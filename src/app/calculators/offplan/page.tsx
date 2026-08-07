import { getPropertiesBasic } from '@/lib/properties';
import OffPlanCalculator from '@/components/OffPlanCalculator';
import BackLink from '@/components/BackLink';

export default async function OffPlanCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const [{ property }, properties] = await Promise.all([searchParams, getPropertiesBasic()]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/calculators" label="Calculators" />
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Off-Plan Calculator</h1>
        <p className="mb-6 text-sm text-zinc-500">Buyer/seller resale profit on off-plan units, with payment schedule and DLD/NOC/trustee fees.</p>

        <OffPlanCalculator properties={properties} initialPropertyId={property ?? null} />
      </div>
    </div>
  );
}
