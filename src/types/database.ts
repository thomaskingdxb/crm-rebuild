// Types matching the live Supabase schema (project ref ndlqllcsgncsvlwifjvh).
// Table shapes must stay in sync with DATABASE_SCHEMA.md — do not add fields here
// that aren't confirmed in the actual database.

export interface Lookup {
  id: number;
  name: string;
  display_order: number | null;
}

export interface Client {
  id: string; // e.g. 'C001'
  name: string;
  phone: string | null;
  email: string | null;
  source_id: number | null;
  notes: string | null;
  last_contact_date: string | null;
  follow_up_date: string | null;
  date_added: string | null;
  date_of_birth: string | null;
  personal_info: string | null;
}

export interface ClientWithRelations extends Client {
  lead_sources: Lookup | null;
  client_client_types: { client_types: Lookup }[];
  client_client_statuses: { client_statuses: Lookup }[];
}

export interface ClientListItem extends ClientWithRelations {
  lastActivityDate: string | null; // most recent of last_contact_date and activities.activity_date
}

export interface Activity {
  id: string; // e.g. 'AL001'
  client_id: string;
  activity_date: string | null;
  notes: string | null;
}

export interface ActivityWithRelations extends Activity {
  activity_activity_types: { activity_types: Lookup }[];
}

export interface Task {
  id: string; // e.g. 'T001'
  client_id: string;
  task_info: string | null;
  entry_date: string | null;
  deadline_date: string | null;
  impact: number | null;
  effort: number | null;
  priority_score: number | null;
}

export interface TaskWithRelations extends Task {
  task_task_types: { task_types: Lookup }[];
  clients: { id: string; name: string } | null;
}

export interface Enquiry {
  id: string; // e.g. 'E001'
  client_id: string;
  property_id: string | null;
  notes: string | null;
  building: string | null;
  sqft: number | null;
  floor: string | null;
  completion_date: string | null;
  budget: number | null;
  enquiry_date: string | null;
}

export interface EnquiryWithRelations extends Enquiry {
  enquiry_enquiry_types: { enquiry_types: Lookup }[];
  enquiry_property_types: { property_types: Lookup }[];
  enquiry_areas: { areas: Lookup }[];
  enquiry_bedroom_counts: { bedroom_counts: Lookup }[];
  enquiry_bathroom_counts: { bathroom_counts: Lookup }[];
  enquiry_lead_stages: { lead_stages: Lookup }[];
  enquiry_view_types: { view_types: Lookup }[];
  enquiry_developers: { developers: Lookup }[];
  enquiry_property_statuses: { property_statuses: Lookup }[];
  clients: { id: string; name: string; follow_up_date: string | null; last_contact_date: string | null } | null;
}

export interface EnquiryListItem extends EnquiryWithRelations {
  clientLastActivityDate: string | null;
}

export interface Property {
  id: string; // e.g. 'P001'
  owner_id: string | null;
  notes: string | null;
  building: string | null;
  unit_number: string | null;
  sqft: number | null;
  service_charge: number | null;
  floor: string | null;
  layout: string | null; // floor-plan variant within the building, e.g. 'A', 'B', 'C'
  rented_until: string | null;
  completion_date: string | null;
  rental_income: number | null;
  asking_price: number | null;
  op: number | null;
  listing_status_id: number | null; // separate from property_statuses - marketing/listing arrangement, never shown to clients (e.g. in PDF exports)
}

export interface PropertyWithRelations extends Property {
  property_property_types: { property_types: Lookup }[];
  property_property_statuses: { property_statuses: Lookup }[];
  property_areas: { areas: Lookup }[];
  property_bedroom_counts: { bedroom_counts: Lookup }[];
  property_bathroom_counts: { bathroom_counts: Lookup }[];
  property_developers: { developers: Lookup }[];
  property_view_types: { view_types: Lookup }[];
  listing_statuses: Lookup | null;
  clients: { id: string; name: string } | null;
}

export interface DealStage {
  id: number;
  name: string;
  category: 'sale' | 'rental';
  display_order: number | null;
}

export interface Deal {
  id: string; // e.g. 'D001'
  property_id: string | null;
  owner_id: string | null;
  buyer_id: string | null;
  deal_type_id: number | null;
  deal_stage_id: number | null;
  value: number | null;
  commission_percent: number | null;
  commission_amount: number | null;
  commission_split_percent: number | null;
  commission_split_amount: number | null;
  notes: string | null;
  date_agreed: string | null;
  date_completed: string | null;
}

export interface DealWithRelations extends Deal {
  deal_types: Lookup | null;
  deal_stages: DealStage | null;
  properties: { id: string; building: string | null; unit_number: string | null } | null;
  owner: { id: string; name: string } | null;
  buyer: { id: string; name: string } | null;
}

export interface DealForClient extends DealWithRelations {
  role: 'Buyer/Tenant' | 'Seller/Landlord';
}

export interface Goal {
  id: number;
  period_type: 'monthly' | 'quarterly' | 'annual';
  period_start: string; // first day of the period, e.g. '2026-08-01'
  metric: 'deals_agreed' | 'deals_completed' | 'revenue';
  target_value: number;
  created_at: string;
  group_id: string | null; // links monthly rows created together as one recurring target
}

export interface Achievement {
  id: number;
  title: string;
  description: string | null;
  achieved_date: string;
  created_at: string;
}

// WhatsApp coaching pipeline - populated by Claude Code sessions running
// classification passes, never written to by the app itself (no live LLM
// calls from the CRM - see project memory for the architecture decision).
export interface WhatsappContact {
  id: string;
  display_name: string;
  client_id: string | null;
  match_status: 'matched' | 'unmatched' | 'ambiguous' | 'self';
  created_at: string;
}

export interface CoachingFlag {
  id: string;
  message_id: string;
  flag_type: 'new_enquiry' | 'task' | 'needs_response' | 'missed' | 'notable_moment' | 'commitment';
  note: string | null;
  due_date: string | null; // set for 'commitment' flags - a stated/implied promise deadline
  resolved: boolean;
  suggested_resolved: boolean;
  created_at: string;
}

export interface CoachingFlagWithContext extends CoachingFlag {
  whatsapp_messages: {
    id: string;
    sender_name: string;
    sent_at: string;
    body: string | null;
    conversation_id: string;
    whatsapp_conversations: {
      id: string;
      contact_id: string;
      whatsapp_contacts: WhatsappContact;
    };
  };
  draft?: { id: string; draft_text: string; status: string } | null;
  task?: { id: string; task_info: string | null } | null;
}

export interface CoachingMemory {
  id: string;
  contact_id: string;
  summary: string;
  updated_at: string;
}

// Monthly market newsletter - built from a Claude Code/Cowork session (curated
// news via web search, transaction stats read live from DXB Interact with the
// user logged into their own account), the CRM only displays/tracks it.
export interface NewsletterEdition {
  id: string;
  period_label: string; // e.g. 'August 2026'
  headline: string | null;
  insights_text: string | null;
  status: 'draft' | 'sent';
  created_at: string;
}

export interface NewsletterArticle {
  id: string;
  edition_id: string;
  headline: string;
  summary: string;
  source_name: string;
  source_url: string | null;
  display_order: number;
  created_at: string;
}

export interface NewsletterTransactionStat {
  id: string;
  edition_id: string;
  category: string; // e.g. 'Flats', 'Villas', 'Hotel Apartments & Rooms', 'Commercial'
  segment: 'off_plan' | 'ready';
  value_aed: number | null;
  share_pct: number | null;
}

export interface NewsletterEditionWithContent extends NewsletterEdition {
  newsletter_articles: NewsletterArticle[];
  newsletter_transaction_stats: NewsletterTransactionStat[];
}

export interface ContentIdea {
  id: string;
  source_message_id: string | null;
  idea: string;
  draft_copy: string | null;
  status: 'new' | 'posted' | 'dismissed';
  posted_at: string | null;
  created_at: string;
}
