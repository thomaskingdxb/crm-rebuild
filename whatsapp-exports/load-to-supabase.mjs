import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseChat } from './parse-chat.mjs';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  const text = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const env = loadEnvLocal();

const SELF_NAME = 'Thomas King';
const EXTRACTED_DIR = path.join(process.cwd(), 'whatsapp-exports/extracted');

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function deriveContactName(folderName) {
  return folderName.replace(/^WhatsApp Chat - /, '').trim();
}

const folders = fs.readdirSync(EXTRACTED_DIR).filter(f =>
  fs.statSync(path.join(EXTRACTED_DIR, f)).isDirectory()
);

let totalMessages = 0;

for (const folder of folders) {
  const chatFile = path.join(EXTRACTED_DIR, folder, '_chat.txt');
  if (!fs.existsSync(chatFile)) {
    console.log(`SKIP ${folder}: no _chat.txt`);
    continue;
  }
  const messages = parseChat(chatFile);
  const contactName = deriveContactName(folder);

  const { data: contact, error: contactErr } = await supabase
    .from('whatsapp_contacts')
    .upsert({ display_name: contactName }, { onConflict: 'display_name' })
    .select('id')
    .single();
  if (contactErr) { console.error(`FAIL contact ${contactName}:`, contactErr.message); continue; }

  // One conversation per contact - re-importing the same contact reuses it
  // rather than creating a duplicate thread.
  const { data: conv, error: convErr } = await supabase
    .from('whatsapp_conversations')
    .upsert({ contact_id: contact.id, source_file: `${folder}.zip` }, { onConflict: 'contact_id' })
    .select('id')
    .single();
  if (convErr) { console.error(`FAIL conversation ${contactName}:`, convErr.message); continue; }

  const rows = messages.map(m => ({
    conversation_id: conv.id,
    sender_name: m.sender,
    sent_at: m.sentAt,
    body: m.body,
    is_media: m.isMedia,
    dedup_seq: m.dedupSeq,
  }));

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    // ignoreDuplicates: re-running an export re-sends every message again;
    // only genuinely new messages (new dedup key) actually get inserted.
    const { error: msgErr, count } = await supabase
      .from('whatsapp_messages')
      .upsert(batch, {
        onConflict: 'conversation_id,sender_name,sent_at_minute,body,dedup_seq',
        ignoreDuplicates: true,
        count: 'exact',
      });
    if (msgErr) { console.error(`FAIL messages ${contactName} batch ${i}:`, msgErr.message); continue; }
    inserted += count ?? 0;
  }

  totalMessages += inserted;
  console.log(`OK ${contactName}: ${rows.length} in export, ${inserted} new`);
}

console.log(`\nDone. Total messages loaded: ${totalMessages}`);
