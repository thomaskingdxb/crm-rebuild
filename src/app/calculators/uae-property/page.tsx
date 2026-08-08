import { getPropertiesBasic } from '@/lib/properties';
import { createClient } from '@/lib/supabase/server';
import UAEPropertyCalculator from '@/components/UAEPropertyCalculator';
import BackLink from '@/components/BackLink';

export default async function UAEPropertyCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const supabase = await createClient();
  const [{ property }, properties] = await Promise.all([searchParams, getPropertiesBasic(supabase)]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/calculators" label="Calculators" />
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">UAE Property Calculator</h1>
        <p className="mb-6 text-sm text-zinc-500">Full purchase cost breakdown plus mortgage repayments and rental running costs.</p>

        <UAEPropertyCalculator properties={properties} initialPropertyId={property ?? null} />
      </div>
    </div>
  );
}
