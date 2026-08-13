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
  // WhatsApp shifts every timestamp by a few seconds between two separate
  // "Export Chat" runs of the SAME historical conversation (confirmed: a
  // constant ~2s offset across an entire chat when re-exported a day later).
  // Grouping/matching on the exact second would treat every message as new
  // on every re-export. Round to the minute for the dedup key so re-imports
  // stay idempotent despite that jitter - the raw `sentAt` (full precision)
  // is still what gets stored.
  const seen = new Map();
  for (const msg of messages) {
    const minuteBucket = msg.sentAt.slice(0, 16); // 'YYYY-MM-DDTHH:MM'
    const key = `${msg.sender}|${minuteBucket}|${msg.body}`;
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
