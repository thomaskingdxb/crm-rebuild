// Parses a WhatsApp _chat.txt export into { sender, sentAt, body, isMedia } messages.
// Usage: node parse-chat.mjs "<path to .txt>"
import fs from 'fs';

const LINE_RE = /^‎?\[(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})\] ([^:]+): ([\s\S]*)$/;
const MEDIA_RE = /omitted\s*$/;

export function parseChat(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const messages = [];

  for (const line of lines) {
    const m = line.match(LINE_RE);
    if (m) {
      const [, dd, mm, yyyy, hh, min, ss, sender, body] = m;
      const sentAt = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss)).toISOString();
      messages.push({
        sender: sender.trim(),
        sentAt,
        body: body.trim(),
        isMedia: MEDIA_RE.test(body.trim()),
      });
    } else if (line.trim() && messages.length) {
      // continuation of a multi-line message
      const last = messages[messages.length - 1];
      last.body += '\n' + line.trim();
    }
  }

  // dedupSeq disambiguates genuinely identical messages (e.g. several images
  // sent in the same second with the same caption) so re-importing the same
  // export is idempotent without collapsing distinct messages into one.
  //
  // WhatsApp shifts message timestamps between separate "Export Chat" runs of
  // the SAME historical conversation - observed offsets ranging from ~2s up
  // to a couple of hours, not a fixed amount. Any time-bucketed dedup key
  // (exact second, rounded minute, etc.) is fragile to this since the offset
  // varies. Content is the only stable signal: dedupSeq is now a running
  // occurrence counter per (sender, body) across the WHOLE conversation, with
  // no time component at all. This is deterministic across re-parses of the
  // same export (messages are always processed in the same chronological
  // order), so re-imports stay idempotent regardless of timestamp drift.
  const seen = new Map();
  for (const msg of messages) {
    const key = `${msg.sender}|${msg.body}`;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    msg.dedupSeq = count;
  }

  return messages;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node parse-chat.mjs "<path to .txt>"');
    process.exit(1);
  }
  const messages = parseChat(filePath);
  console.log(JSON.stringify(messages, null, 2));
  console.error(`\nParsed ${messages.length} messages.`);
}
