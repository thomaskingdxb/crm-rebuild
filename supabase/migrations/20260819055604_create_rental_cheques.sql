create table rental_cheques (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null references deals(id),
  cheque_number int not null,
  amount numeric not null,
  due_date date not null,
  deposited boolean not null default false,
  deposited_date date,
  notes text,
  unique (deal_id, cheque_number)
);

alter table rental_cheques enable row level security;
create policy authenticated_full_access on rental_cheques for all to authenticated using (true) with check (true);
