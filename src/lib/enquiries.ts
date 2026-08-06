import { supabase } from '@/lib/supabase/client';
import type { EnquiryWithRelations, EnquiryListItem, Lookup } from '@/types/database';

const ENQUIRY_SELECT = `*,
  enquiry_enquiry_types ( enquiry_types ( id, name, display_order ) ),
  enquiry_property_types ( property_types ( id, name, display_order ) ),
  enquiry_areas ( areas ( id, name, display_order ) ),
  enquiry_bedroom_counts ( bedroom_counts ( id, name, display_order ) ),
  enquiry_bathroom_counts ( bathroom_counts ( id, name, display_order ) ),
  enquiry_lead_stages ( lead_stages ( id, name, display_order ) ),
  enquiry_view_types ( view_types ( id, name, display_order ) ),
  enquiry_developers ( developers ( id, name, display_order ) ),
  enquiry_property_statuses ( property_statuses ( id, name, display_order ) ),
  clients ( id, name, follow_up_date, last_contact_date )`;

function mostRecentDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

async function attachClientLastActivity(enquiries: EnquiryWithRelations[]): Promise<EnquiryListItem[]> {
  const clientIds = [...new Set(enquiries.map((e) => e.client_id).filter(Boolean))];
  const { data, error } = await supabase.from('activities').select('client_id, activity_date').in('client_id', clientIds);
  if (error) throw error;

  const lastActivityByClient = new Map<string, string>();
  for (const a of data ?? []) {
    if (!a.activity_date) continue;
    const current = lastActivityByClient.get(a.client_id);
    if (!current || a.activity_date > current) {
      lastActivityByClient.set(a.client_id, a.activity_date);
    }
  }

  return enquiries.map((e) => ({
    ...e,
    clientLastActivityDate: mostRecentDate(e.clients?.last_contact_date ?? null, lastActivityByClient.get(e.client_id) ?? null),
  }));
}

export async function getEnquiries(): Promise<EnquiryListItem[]> {
  const { data, error } = await supabase.from('enquiries').select(ENQUIRY_SELECT).order('enquiry_date', { ascending: false });
  if (error) throw error;
  return attachClientLastActivity(data as unknown as EnquiryWithRelations[]);
}

export async function getEnquiry(id: string): Promise<EnquiryListItem | null> {
  const { data, error } = await supabase.from('enquiries').select(ENQUIRY_SELECT).eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  const [withActivity] = await attachClientLastActivity([data as unknown as EnquiryWithRelations]);
  return withActivity;
}

export async function getClientEnquiries(clientId: string): Promise<EnquiryListItem[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select(ENQUIRY_SELECT)
    .eq('client_id', clientId)
    .order('enquiry_date', { ascending: false });

  if (error) throw error;
  return attachClientLastActivity(data as unknown as EnquiryWithRelations[]);
}

export async function getPropertyEnquiries(propertyId: string): Promise<EnquiryListItem[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select(ENQUIRY_SELECT)
    .eq('property_id', propertyId)
    .order('enquiry_date', { ascending: false });

  if (error) throw error;
  return attachClientLastActivity(data as unknown as EnquiryWithRelations[]);
}

export async function getEnquiryLookups() {
  const [enquiryTypes, propertyTypes, areas, bedroomCounts, bathroomCounts, leadStages, viewTypes, developers, propertyStatuses] = await Promise.all([
    supabase.from('enquiry_types').select('*').order('display_order'),
    supabase.from('property_types').select('*').order('display_order'),
    supabase.from('areas').select('*').order('display_order'),
    supabase.from('bedroom_counts').select('*').order('display_order'),
    supabase.from('bathroom_counts').select('*').order('display_order'),
    supabase.from('lead_stages').select('*').order('display_order'),
    supabase.from('view_types').select('*').order('display_order'),
    supabase.from('developers').select('*').order('display_order'),
    supabase.from('property_statuses').select('*').order('display_order'),
  ]);

  for (const r of [enquiryTypes, propertyTypes, areas, bedroomCounts, bathroomCounts, leadStages, viewTypes, developers, propertyStatuses]) {
    if (r.error) throw r.error;
  }

  return {
    enquiryTypes: enquiryTypes.data as Lookup[],
    propertyTypes: propertyTypes.data as Lookup[],
    areas: areas.data as Lookup[],
    bedroomCounts: bedroomCounts.data as Lookup[],
    bathroomCounts: bathroomCounts.data as Lookup[],
    leadStages: leadStages.data as Lookup[],
    viewTypes: viewTypes.data as Lookup[],
    developers: developers.data as Lookup[],
    propertyStatuses: propertyStatuses.data as Lookup[],
  };
}

// Enquiries in these lead stages are done deals or dead leads — the Pipeline
// board excludes them to stay focused on enquiries still being worked.
export const CLOSED_LEAD_STAGE_NAMES = ['Closed - Lost', 'Closed - Won', 'Unresponsive'];

export async function generateNextEnquiryId(): Promise<string> {
  const { data, error } = await supabase.from('enquiries').select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace('E', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `E${String(max + 1).padStart(3, '0')}`;
}
