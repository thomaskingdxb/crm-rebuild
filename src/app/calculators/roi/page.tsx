import { getPropertiesBasic } from '@/lib/properties';
import ROICalculator from '@/components/ROICalculator';
import BackLink from '@/components/BackLink';

export default async function ROICalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const [{ property }, properties] = await Promise.all([searchParams, getPropertiesBasic()]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/calculators" label="Calculators" />
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">ROI Calculator</h1>
        <p className="mb-6 text-sm text-zinc-500">Gross and net rental ROI based on purchase price, running costs, and rental income.</p>

        <ROICalculator properties={properties} initialPropertyId={property ?? null} />
      </div>
    </div>
  );
}
