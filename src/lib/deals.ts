import { supabase } from '@/lib/supabase/client';
import type { DealWithRelations, DealForClient, Lookup } from '@/types/database';

const DEAL_SELECT = `*,
  deal_types ( id, name, display_order ),
  deal_lead_stages ( lead_stages ( id, name, display_order ) ),
  properties ( id, building, unit_number ),
  owner:clients!owner_id ( id, name ),
  buyer:clients!buyer_id ( id, name )`;

export async function getDeals(): Promise<DealWithRelations[]> {
  const { data, error } = await supabase.from('deals').select(DEAL_SELECT).order('date_agreed', { ascending: false });
  if (error) throw error;
  return data as unknown as DealWithRelations[];
}

export async function getDeal(id: string): Promise<DealWithRelations | null> {
  const { data, error } = await supabase.from('deals').select(DEAL_SELECT).eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as DealWithRelations;
}

export async function getClientDeals(clientId: string): Promise<DealForClient[]> {
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .or(`owner_id.eq.${clientId},buyer_id.eq.${clientId}`)
    .order('date_agreed', { ascending: false });

  if (error) throw error;

  const deals = data as unknown as DealWithRelations[];
  return deals.map((d) => ({
    ...d,
    role: d.buyer_id === clientId ? 'Buyer/Tenant' : 'Seller/Landlord',
  }));
}

export async function getPropertyDeals(propertyId: string): Promise<DealWithRelations[]> {
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .eq('property_id', propertyId)
    .order('date_agreed', { ascending: false });

  if (error) throw error;
  return data as unknown as DealWithRelations[];
}

export async function getDealLookups() {
  const [dealTypes, leadStages] = await Promise.all([
    supabase.from('deal_types').select('*').order('display_order'),
    supabase.from('lead_stages').select('*').order('display_order'),
  ]);

  if (dealTypes.error) throw dealTypes.error;
  if (leadStages.error) throw leadStages.error;

  return {
    dealTypes: dealTypes.data as Lookup[],
    leadStages: leadStages.data as Lookup[],
  };
}

export async function generateNextDealId(): Promise<string> {
  const { data, error } = await supabase.from('deals').select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace('D', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `D${String(max + 1).padStart(3, '0')}`;
}
