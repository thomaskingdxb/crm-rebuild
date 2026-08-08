import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { DealWithRelations, DealForClient, DealStage, Lookup } from '@/types/database';

const DEAL_SELECT = `*,
  deal_types ( id, name, display_order ),
  deal_stages ( id, name, category, display_order ),
  properties ( id, building, unit_number ),
  owner:clients!owner_id ( id, name ),
  buyer:clients!buyer_id ( id, name )`;

export async function getDeals(db: SupabaseClient = defaultClient): Promise<DealWithRelations[]> {
  const { data, error } = await db.from('deals').select(DEAL_SELECT).order('date_agreed', { ascending: false });
  if (error) throw error;
  return data as unknown as DealWithRelations[];
}

export async function getDeal(id: string, db: SupabaseClient = defaultClient): Promise<DealWithRelations | null> {
  const { data, error } = await db.from('deals').select(DEAL_SELECT).eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as DealWithRelations;
}

export async function getClientDeals(clientId: string, db: SupabaseClient = defaultClient): Promise<DealForClient[]> {
  const { data, error } = await db
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

export async function getPropertyDeals(propertyId: string, db: SupabaseClient = defaultClient): Promise<DealWithRelations[]> {
  const { data, error } = await db
    .from('deals')
    .select(DEAL_SELECT)
    .eq('property_id', propertyId)
    .order('date_agreed', { ascending: false });

  if (error) throw error;
  return data as unknown as DealWithRelations[];
}

export async function getDealLookups(db: SupabaseClient = defaultClient) {
  const [dealTypes, dealStages] = await Promise.all([
    db.from('deal_types').select('*').order('display_order'),
    db.from('deal_stages').select('*').order('display_order'),
  ]);

  if (dealTypes.error) throw dealTypes.error;
  if (dealStages.error) throw dealStages.error;

  const stages = dealStages.data as DealStage[];

  return {
    dealTypes: dealTypes.data as Lookup[],
    dealStages: stages,
    saleStages: stages.filter((s) => s.category === 'sale'),
    rentalStages: stages.filter((s) => s.category === 'rental'),
  };
}

export async function generateNextDealId(db: SupabaseClient = defaultClient): Promise<string> {
  const { data, error } = await db.from('deals').select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace('D', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `D${String(max + 1).padStart(3, '0')}`;
}

// deal_type_id 1 = Rental; 2-4 (Secondary-ready, Secondary-offplan, Offplan) are all Sale variants.
export function dealCategory(deal: { deal_type_id: number | null }): 'sale' | 'rental' | null {
  if (deal.deal_type_id == null) return null;
  return deal.deal_type_id === 1 ? 'rental' : 'sale';
}

export function grossCommission(deal: { value: number | null; commission_percent: number | null; commission_amount: number | null }): number | null {
  if (deal.commission_amount != null) return deal.commission_amount;
  if (deal.value != null && deal.commission_percent != null) return deal.value * deal.commission_percent;
  return null;
}

export function netCommission(deal: {
  value: number | null;
  commission_percent: number | null;
  commission_amount: number | null;
  commission_split_percent: number | null;
  commission_split_amount: number | null;
}): number | null {
  if (deal.commission_split_amount != null) return deal.commission_split_amount;
  const gross = grossCommission(deal);
  if (gross != null && deal.commission_split_percent != null) return gross * deal.commission_split_percent;
  return null;
}

export interface DealStats {
  salesCompleted: number;
  rentalsCompleted: number;
  salesGrossComms: number;
  rentalsGrossComms: number;
  salesNetComms: number;
  rentalsNetComms: number;
  commissionGross: number;
  commissionNet: number;
  salesPending: number;
  rentalsPending: number;
  salesGrossPending: number;
  rentalsGrossPending: number;
  salesNetPending: number;
  rentalsNetPending: number;
  commissionGrossPending: number;
  commissionNetPending: number;
  salesValueCompleted: number;
  rentalsValueCompleted: number;
  salesValuePending: number;
  rentalsValuePending: number;
}

export function computeDealStats(deals: DealWithRelations[]): DealStats {
  const stats: DealStats = {
    salesCompleted: 0,
    rentalsCompleted: 0,
    salesGrossComms: 0,
    rentalsGrossComms: 0,
    salesNetComms: 0,
    rentalsNetComms: 0,
    commissionGross: 0,
    commissionNet: 0,
    salesPending: 0,
    rentalsPending: 0,
    salesGrossPending: 0,
    rentalsGrossPending: 0,
    salesNetPending: 0,
    rentalsNetPending: 0,
    commissionGrossPending: 0,
    commissionNetPending: 0,
    salesValueCompleted: 0,
    rentalsValueCompleted: 0,
    salesValuePending: 0,
    rentalsValuePending: 0,
  };

  for (const d of deals) {
    const gross = grossCommission(d) ?? 0;
    const net = netCommission(d) ?? 0;
    const value = d.value ?? 0;
    const category = dealCategory(d);
    const isCompleted = d.deal_stages?.name === 'Completed';

    if (isCompleted) {
      stats.commissionGross += gross;
      stats.commissionNet += net;
      if (category === 'sale') {
        stats.salesCompleted += 1;
        stats.salesGrossComms += gross;
        stats.salesNetComms += net;
        stats.salesValueCompleted += value;
      } else if (category === 'rental') {
        stats.rentalsCompleted += 1;
        stats.rentalsGrossComms += gross;
        stats.rentalsNetComms += net;
        stats.rentalsValueCompleted += value;
      }
    } else {
      stats.commissionGrossPending += gross;
      stats.commissionNetPending += net;
      if (category === 'sale') {
        stats.salesPending += 1;
        stats.salesGrossPending += gross;
        stats.salesNetPending += net;
        stats.salesValuePending += value;
      } else if (category === 'rental') {
        stats.rentalsPending += 1;
        stats.rentalsGrossPending += gross;
        stats.rentalsNetPending += net;
        stats.rentalsValuePending += value;
      }
    }
  }

  return stats;
}
