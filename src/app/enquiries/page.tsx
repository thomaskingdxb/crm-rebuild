import Link from 'next/link';
import { getEnquiries, getEnquiryLookups } from '@/lib/enquiries';
import EnquiriesList from '@/components/EnquiriesList';

export default async function EnquiriesPage() {
  const [enquiries, lookups] = await Promise.all([getEnquiries(), getEnquiryLookups()]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Enquiries</h1>
            <p className="text-sm text-zinc-500">{enquiries.length} total</p>
          </div>
          <Link
            href="/enquiries/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            + Add Enquiry
          </Link>
        </div>

        <EnquiriesList enquiries={enquiries} lookups={lookups} />
      </div>
    </div>
  );
}
