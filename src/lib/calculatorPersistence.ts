import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';

export interface OffPlanRow {
  milestone: string;
  manualLabel: string;
  date: string;
  pct: string;
  paid: string;
}

export interface SavedCalculatorSummary {
  roi: { updatedAt: string } | null;
  offplan: { updatedAt: string } | null;
  uaeProperty: { updatedAt: string } | null;
}

export async function getSavedCalculatorSummary(propertyId: string, db: SupabaseClient = defaultClient): Promise<SavedCalculatorSummary> {
  const [roi, offplan, uae] = await Promise.all([
    db.from('roi_calculations').select('updated_at').eq('property_id', propertyId).maybeSingle(),
    db.from('offplan_calculations').select('updated_at').eq('property_id', propertyId).maybeSingle(),
    db.from('uae_property_calculations').select('updated_at').eq('property_id', propertyId).maybeSingle(),
  ]);
  if (roi.error) throw roi.error;
  if (offplan.error) throw offplan.error;
  if (uae.error) throw uae.error;

  return {
    roi: roi.data ? { updatedAt: roi.data.updated_at } : null,
    offplan: offplan.data ? { updatedAt: offplan.data.updated_at } : null,
    uaeProperty: uae.data ? { updatedAt: uae.data.updated_at } : null,
  };
}

export async function getROICalculation<T>(propertyId: string, db: SupabaseClient = defaultClient): Promise<T | null> {
  const { data, error } = await db.from('roi_calculations').select('inputs').eq('property_id', propertyId).maybeSingle();
  if (error) throw error;
  return (data?.inputs as T) ?? null;
}

export async function saveROICalculation(propertyId: string, inputs: unknown, db: SupabaseClient = defaultClient): Promise<void> {
  const { error } = await db
    .from('roi_calculations')
    .upsert({ property_id: propertyId, inputs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteROICalculation(propertyId: string, db: SupabaseClient = defaultClient): Promise<void> {
  const { error } = await db.from('roi_calculations').delete().eq('property_id', propertyId);
  if (error) throw error;
}

export async function getOffPlanCalculation<T>(propertyId: string, db: SupabaseClient = defaultClient): Promise<{ inputs: T; rows: OffPlanRow[] } | null> {
  const { data, error } = await db.from('offplan_calculations').select('inputs').eq('property_id', propertyId).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: rowsData, error: rowsError } = await db
    .from('offplan_calculation_rows')
    .select('milestone, manual_label, date, pct, paid')
    .eq('property_id', propertyId)
    .order('position');
  if (rowsError) throw rowsError;

  return {
    inputs: data.inputs as T,
    rows: (rowsData ?? []).map((r) => ({
      milestone: r.milestone,
      manualLabel: r.manual_label ?? '',
      date: r.date ?? '',
      pct: r.pct ?? '',
      paid: r.paid ?? '',
    })),
  };
}

export async function saveOffPlanCalculation(propertyId: string, inputs: unknown, rows: OffPlanRow[], db: SupabaseClient = defaultClient): Promise<void> {
  const { error } = await db
    .from('offplan_calculations')
    .upsert({ property_id: propertyId, inputs, updated_at: new Date().toISOString() });
  if (error) throw error;

  const { error: deleteError } = await db.from('offplan_calculation_rows').delete().eq('property_id', propertyId);
  if (deleteError) throw deleteError;

  if (rows.length > 0) {
    const { error: insertError } = await db.from('offplan_calculation_rows').insert(
      rows.map((r, i) => ({
        property_id: propertyId,
        position: i,
        milestone: r.milestone,
        manual_label: r.manualLabel,
        date: r.date,
        pct: r.pct,
        paid: r.paid,
      }))
    );
    if (insertError) throw insertError;
  }
}

export async function deleteOffPlanCalculation(propertyId: string, db: SupabaseClient = defaultClient): Promise<void> {
  const { error } = await db.from('offplan_calculations').delete().eq('property_id', propertyId);
  if (error) throw error;
}

export async function getUAEPropertyCalculation<T>(propertyId: string, db: SupabaseClient = defaultClient): Promise<T | null> {
  const { data, error } = await db.from('uae_property_calculations').select('inputs').eq('property_id', propertyId).maybeSingle();
  if (error) throw error;
  return (data?.inputs as T) ?? null;
}

export async function saveUAEPropertyCalculation(propertyId: string, inputs: unknown, db: SupabaseClient = defaultClient): Promise<void> {
  const { error } = await db
    .from('uae_property_calculations')
    .upsert({ property_id: propertyId, inputs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteUAEPropertyCalculation(propertyId: string, db: SupabaseClient = defaultClient): Promise<void> {
  const { error } = await db.from('uae_property_calculations').delete().eq('property_id', propertyId);
  if (error) throw error;
}
