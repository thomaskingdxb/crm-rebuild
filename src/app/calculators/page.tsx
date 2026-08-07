import Link from 'next/link';

const TOOLS = [
  {
    href: '/calculators/roi',
    title: 'ROI Calculator',
    description: 'Gross and net rental ROI, service charges, management fees, and other running costs.',
    available: true,
  },
  {
    href: '/calculators/offplan',
    title: 'Off-Plan Calculator',
    description: 'Buyer/seller resale profit on off-plan units, with payment schedule and DLD/NOC/trustee fees.',
    available: true,
  },
  {
    href: '#',
    title: 'UAE Property Calculator',
    description: 'Full purchase cost breakdown plus mortgage repayments and rental running costs.',
    available: false,
  },
];

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Calculators</h1>
        <p className="mb-6 text-sm text-zinc-500">Investment tools for working out costs and returns on properties.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) =>
            tool.available ? (
              <Link
                key={tool.title}
                href={tool.href}
                className="surface-card-accent p-5 transition hover:ring-1 hover:ring-blue-500/30"
              >
                <p className="text-sm font-semibold text-zinc-100">{tool.title}</p>
                <p className="mt-2 text-xs text-zinc-500">{tool.description}</p>
              </Link>
            ) : (
              <div key={tool.title} className="surface-card p-5 opacity-60">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-100">{tool.title}</p>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">Soon</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{tool.description}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
