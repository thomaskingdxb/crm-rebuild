import { getEnquiries, getEnquiryLookups, CLOSED_LEAD_STAGE_NAMES } from '@/lib/enquiries';
import PipelineKanban from '@/components/PipelineKanban';

export default async function PipelinePage() {
  const [enquiries, lookups] = await Promise.all([getEnquiries(), getEnquiryLookups()]);

  const activeStages = lookups.leadStages.filter((s) => !CLOSED_LEAD_STAGE_NAMES.includes(s.name));
  const activeEnquiries = enquiries.filter((e) => {
    const stageName = e.enquiry_lead_stages[0]?.lead_stages.name;
    return !stageName || !CLOSED_LEAD_STAGE_NAMES.includes(stageName);
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Pipeline</h1>
          <p className="text-sm text-zinc-500">{activeEnquiries.length} active enquiries</p>
        </div>

        <PipelineKanban enquiries={activeEnquiries} stages={activeStages} />
      </div>
    </div>
  );
}
