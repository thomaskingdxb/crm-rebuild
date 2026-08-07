import { supabase } from '@/lib/supabase/client';

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

export async function getSavedCalculatorSummary(propertyId: string): Promise<SavedCalculatorSummary> {
  const [roi, offplan, uae] = await Promise.all([
    supabase.from('roi_calculations').select('updated_at').eq('property_id', propertyId).maybeSingle(),
    supabase.from('offplan_calculations').select('updated_at').eq('property_id', propertyId).maybeSingle(),
    supabase.from('uae_property_calculations').select('updated_at').eq('property_id', propertyId).maybeSingle(),
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

export async function getROICalculation<T>(propertyId: string): Promise<T | null> {
  const { data, error } = await supabase.from('roi_calculations').select('inputs').eq('property_id', propertyId).maybeSingle();
  if (error) throw error;
  return (data?.inputs as T) ?? null;
}

export async function saveROICalculation(propertyId: string, inputs: unknown): Promise<void> {
  const { error } = await supabase
    .from('roi_calculations')
    .upsert({ property_id: propertyId, inputs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteROICalculation(propertyId: string): Promise<void> {
  const { error } = await supabase.from('roi_calculations').delete().eq('property_id', propertyId);
  if (error) throw error;
}

export async function getOffPlanCalculation<T>(propertyId: string): Promise<{ inputs: T; rows: OffPlanRow[] } | null> {
  const { data, error } = await supabase.from('offplan_calculations').select('inputs').eq('property_id', propertyId).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: rowsData, error: rowsError } = await supabase
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

export async function saveOffPlanCalculation(propertyId: string, inputs: unknown, rows: OffPlanRow[]): Promise<void> {
  const { error } = await supabase
    .from('offplan_calculations')
    .upsert({ property_id: propertyId, inputs, updated_at: new Date().toISOString() });
  if (error) throw error;

  const { error: deleteError } = await supabase.from('offplan_calculation_rows').delete().eq('property_id', propertyId);
  if (deleteError) throw deleteError;

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('offplan_calculation_rows').insert(
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

export async function deleteOffPlanCalculation(propertyId: string): Promise<void> {
  const { error } = await supabase.from('offplan_calculations').delete().eq('property_id', propertyId);
  if (error) throw error;
}

export async function getUAEPropertyCalculation<T>(propertyId: string): Promise<T | null> {
  const { data, error } = await supabase.from('uae_property_calculations').select('inputs').eq('property_id', propertyId).maybeSingle();
  if (error) throw error;
  return (data?.inputs as T) ?? null;
}

export async function saveUAEPropertyCalculation(propertyId: string, inputs: unknown): Promise<void> {
  const { error } = await supabase
    .from('uae_property_calculations')
    .upsert({ property_id: propertyId, inputs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteUAEPropertyCalculation(propertyId: string): Promise<void> {
  const { error } = await supabase.from('uae_property_calculations').delete().eq('property_id', propertyId);
  if (error) throw error;
}
