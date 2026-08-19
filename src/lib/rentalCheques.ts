import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { RentalCheque } from '@/types/database';

export async function getChequesForDeal(dealId: string, db: SupabaseClient = defaultClient): Promise<RentalCheque[]> {
  const { data, error } = await db
    .from('rental_cheques')
    .select('*')
    .eq('deal_id', dealId)
    .order('cheque_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RentalCheque[];
}

export interface ChequeDue {
  cheque_id: string;
  deal_id: string;
  cheque_number: number;
  amount: number;
  due_date: string;
  building: string | null;
  unit_number: string | null;
  tenant_name: string | null;
  days_until_due: number; // negative = overdue
}

// Fully live-computed, not a stored task - an undeposited cheque always
// shows up here automatically as its due date approaches, no re-generation
// needed. Mirrors getListingUpdatesDue() in properties.ts.
export async function getChequesDue(db: SupabaseClient = defaultClient): Promise<ChequeDue[]> {
  const { data, error } = await db
    .from('rental_cheques')
    .select('id, deal_id, cheque_number, amount, due_date, deals ( id, properties ( building, unit_number ), buyer:clients!deals_buyer_id_fkey ( name ) )')
    .eq('deposited', false)
    .order('due_date', { ascending: true });
  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return (data ?? []).map((c) => {
    const deal = c.deals as unknown as {
      id: string;
      properties: { building: string | null; unit_number: string | null } | null;
      buyer: { name: string } | null;
    } | null;
    const dueMs = new Date(c.due_date + 'T00:00:00').getTime();
    return {
      cheque_id: c.id,
      deal_id: c.deal_id,
      cheque_number: c.cheque_number,
      amount: c.amount,
      due_date: c.due_date,
      building: deal?.properties?.building ?? null,
      unit_number: deal?.properties?.unit_number ?? null,
      tenant_name: deal?.buyer?.name ?? null,
      days_until_due: Math.round((dueMs - todayMs) / 86_400_000),
    };
  });
}
