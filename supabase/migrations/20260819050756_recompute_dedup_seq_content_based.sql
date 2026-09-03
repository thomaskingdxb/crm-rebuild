alter table whatsapp_messages drop constraint whatsapp_messages_dedup_key;

with recomputed as (
  select id, row_number() over (partition by conversation_id, sender_name, body order by sent_at, id) as new_seq
  from whatsapp_messages
)
update whatsapp_messages m
set dedup_seq = r.new_seq
from recomputed r
where m.id = r.id and m.dedup_seq is distinct from r.new_seq;

alter table whatsapp_messages add constraint whatsapp_messages_dedup_key unique (conversation_id, sender_name, body, dedup_seq);
