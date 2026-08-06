'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProperty } from '@/lib/properties';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

function fmt(n: number): string {
  return `AED ${Math.round(n).toLocaleString()}`;
}

function fmtP(n: number): string {
  return `${n.toFixed(2)}%`;
}

export default function ROICalculator({
  properties,
  initialPropertyId,
}: {
  properties: { id: string; building: string | null; unit_number: string | null }[];
  initialPropertyId: string | null;
}) {
  const [propertyId, setPropertyId] = useState(initialPropertyId ?? '');
  const [loadingProperty, setLoadingProperty] = useState(false);

  const [owner, setOwner] = useState('');
  const [building, setBuilding] = useState('');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [scPsf, setScPsf] = useState('');
  const [grossRent, setGrossRent] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [mgmtPct, setMgmtPct] = useState('5');
  const [mgmtManualOverride, setMgmtManualOverride] = useState(false);
  const [mgmtManual, setMgmtManual] = useState('');
  const [roiMode, setRoiMode] = useState<'excl' | 'incl'>('excl');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingProperty(true);
    getProperty(propertyId)
      .then((property) => {
        if (!property) return;
        setOwner(property.clients?.name ?? '');
        setBuilding(`${property.building ?? ''}${property.unit_number ? ` - ${property.unit_number}` : ''}`.trim());
        setLocation(property.property_areas[0]?.areas.name ?? '');
        setBedrooms(property.property_bedroom_counts[0]?.bedroom_counts.name ?? '');
        setSqft(property.sqft != null ? String(property.sqft) : '');
        setPurchasePrice(property.asking_price != null ? String(property.asking_price) : '');
        setScPsf(property.service_charge != null ? String(property.service_charge) : '');
        setGrossRent(property.rental_income != null ? String(property.rental_income) : '');
      })
      .finally(() => setLoadingProperty(false));
  }, [propertyId]);

  const calc = useMemo(() => {
    const price = parseFloat(purchasePrice) || 0;
    const sqftN = parseFloat(sqft) || 0;
    const scPsfN = parseFloat(scPsf) || 0;
    const grossRentN = parseFloat(grossRent) || 0;
    const maintenanceN = parseFloat(maintenance) || 0;
    const otherCostsN = parseFloat(otherCosts) || 0;

    const dld = price * 0.04;
    const priceInclDld = price + dld;
    const scAnnual = sqftN * scPsfN;

    const mgmt = mgmtManualOverride ? parseFloat(mgmtManual) || 0 : (grossRentN * (parseFloat(mgmtPct) || 0)) / 100;

    const totalCosts = scAnnual + mgmt + maintenanceN + otherCostsN;
    const netRent = grossRentN - totalCosts;
    const grossROI = price > 0 ? (grossRentN / price) * 100 : 0;
    const roiBase = roiMode === 'excl' ? price : priceInclDld;
    const netROI = roiBase > 0 ? (netRent / roiBase) * 100 : 0;

    return { price, dld, priceInclDld, scAnnual, mgmt, totalCosts, netRent, grossROI, netROI };
  }, [purchasePrice, sqft, scPsf, grossRent, maintenance, otherCosts, mgmtPct, mgmtManualOverride, mgmtManual, roiMode]);

  const mgmtManualDisplay = mgmtManualOverride ? mgmtManual : Math.round(calc.mgmt).toString();

  async function exportPDF() {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = 210;
      const marginX = 16;
      const contentW = pageW - marginX * 2;
      let y = 20;

      const bg: [number, number, number] = [13, 17, 25];
      const card: [number, number, number] = [22, 26, 36];
      const border: [number, number, number] = [45, 50, 62];
      const textLight: [number, number, number] = [240, 240, 245];
      const textMuted: [number, number, number] = [150, 150, 160];
      const blue: [number, number, number] = [96, 165, 250];
      const emerald: [number, number, number] = [52, 211, 153];

      pdf.setFillColor(...bg);
      pdf.rect(0, 0, pageW, 297, 'F');

      pdf.setTextColor(...textLight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('ROI Calculator', marginX, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...textMuted);
      pdf.text('Luxury Invest Group', marginX, y);
      y += 10;

      pdf.setTextColor(...textMuted);
      pdf.setFontSize(8);
      pdf.text('PREPARED FOR', marginX, y);
      pdf.text('PROPERTY', marginX + contentW / 2, y);
      y += 5;
      pdf.setTextColor(...textLight);
      pdf.setFontSize(11);
      pdf.text(owner || '—', marginX, y);
      pdf.text(building || '—', marginX + contentW / 2, y);
      y += 10;

      function sectionLabel(text: string) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...blue);
        pdf.text(text.toUpperCase(), marginX, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
      }

      function cardStart(height: number) {
        pdf.setFillColor(...card);
        pdf.setDrawColor(...border);
        pdf.roundedRect(marginX, y, contentW, height, 2, 2, 'FD');
      }

      function row(label: string, value: string, rowY: number, bold = false) {
        pdf.setFontSize(9.5);
        pdf.setTextColor(...textMuted);
        pdf.text(label, marginX + 4, rowY);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setTextColor(...textLight);
        pdf.text(value, marginX + contentW - 4, rowY, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
      }

      // Property details
      sectionLabel('Property Details');
      cardStart(30);
      let ry = y + 6;
      row('Location', location || '—', ry);
      row('Bedrooms', bedrooms || '—', ry, false);
      ry += 6;
      row('Size', sqft ? `${sqft} sqft` : '—', ry);
      ry += 6;
      row('Purchase price', fmt(calc.price), ry);
      ry += 6;
      row('Purchase price incl. DLD (4%)', fmt(calc.priceInclDld), ry);
      y += 36;

      // Annual costs
      sectionLabel('Annual Costs');
      cardStart(38);
      ry = y + 6;
      row('Service charges', fmt(calc.scAnnual), ry);
      ry += 6;
      row('Management fee', fmt(calc.mgmt), ry);
      ry += 6;
      row('Maintenance', fmt(parseFloat(maintenance) || 0), ry);
      ry += 6;
      row('Other costs', fmt(parseFloat(otherCosts) || 0), ry);
      ry += 7;
      pdf.setDrawColor(...border);
      pdf.line(marginX + 4, ry - 4, marginX + contentW - 4, ry - 4);
      row('Total annual costs', fmt(calc.totalCosts), ry, true);
      y += 44;

      // Rental income
      sectionLabel('Rental Income');
      cardStart(20);
      ry = y + 6;
      row('Gross rental income', fmt(parseFloat(grossRent) || 0), ry);
      ry += 7;
      pdf.setDrawColor(...border);
      pdf.line(marginX + 4, ry - 4, marginX + contentW - 4, ry - 4);
      pdf.setTextColor(...emerald);
      row('Net rental income', fmt(calc.netRent), ry, true);
      pdf.setTextColor(...textLight);
      y += 26;

      // Results
      sectionLabel('Results');
      const boxW = (contentW - 4) / 2;
      const boxH = 20;
      pdf.setFillColor(30, 41, 59);
      pdf.setDrawColor(...blue);
      pdf.roundedRect(marginX, y, boxW, boxH, 2, 2, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(...blue);
      pdf.text('GROSS ROI', marginX + 4, y + 7);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(fmtP(calc.grossROI), marginX + 4, y + 15);

      pdf.setFont('helvetica', 'normal');
      pdf.setFillColor(20, 40, 34);
      pdf.setDrawColor(...emerald);
      pdf.roundedRect(marginX + boxW + 4, y, boxW, boxH, 2, 2, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(...emerald);
      pdf.text(`NET ROI (${roiMode === 'excl' ? 'EXCL' : 'INCL'}. DLD)`, marginX + boxW + 8, y + 7);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(fmtP(calc.netROI), marginX + boxW + 8, y + 15);
      y += boxH + 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...textMuted);
      const note = `Gross ROI = gross rent / purchase price. Net ROI = net income / purchase price (${
        roiMode === 'excl' ? 'excl DLD' : 'incl DLD'
      }). Figures are estimates - always consult a licensed advisor.`;
      pdf.text(pdf.splitTextToSize(note, contentW), marginX, y);
      y += 14;

      pdf.setDrawColor(...border);
      pdf.line(marginX, y, pageW - marginX, y);
      y += 6;
      pdf.setFontSize(8);
      pdf.setTextColor(...textMuted);
      pdf.text('Thomas King · Luxury Invest Group', marginX, y);

      pdf.save(`ROI-Calculator-${(building || 'Property').replace(/[^a-z0-9]+/gi, '-')}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div className="surface-card p-6">
          <p className="mb-4 text-sm font-semibold text-zinc-200">Property</p>
          <div className="mb-4">
            <label className={labelClass}>Link a property (optional)</label>
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClass}>
              <option value="">— None, enter manually —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.building ?? p.id}
                  {p.unit_number ? ` - ${p.unit_number}` : ''}
                </option>
              ))}
            </select>
            {loadingProperty && <p className="mt-1 text-xs text-zinc-500">Loading property details...</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prepared for</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} placeholder="Client name" />
            </div>
            <div>
              <label className={labelClass}>Property</label>
              <input value={building} onChange={(e) => setBuilding(e.target.value)} className={inputClass} placeholder="Building / unit" />
            </div>
            <div>
              <label className={labelClass}>Location / Area</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bedrooms</label>
              <input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Size (sqft)</label>
              <input type="number" value={sqft} onChange={(e) => setSqft(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Purchase price (AED)</label>
              <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="mb-4 text-sm font-semibold text-zinc-200">Annual costs & income</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Service charges per sqft (AED)</label>
              <input type="number" value={scPsf} onChange={(e) => setScPsf(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gross rental income (AED/year)</label>
              <input type="number" value={grossRent} onChange={(e) => setGrossRent(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Maintenance (AED/yr)</label>
              <input type="number" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Other costs (AED/yr)</label>
              <input type="number" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Management fee (% of rent)</label>
              <input
                type="number"
                value={mgmtPct}
                disabled={mgmtManualOverride}
                onChange={(e) => setMgmtPct(e.target.value)}
                className={`${inputClass} disabled:opacity-40`}
              />
            </div>
            <div>
              <label className={labelClass}>Management fee — manual override (AED)</label>
              <input
                type="number"
                value={mgmtManualDisplay}
                onChange={(e) => {
                  setMgmtManualOverride(true);
                  setMgmtManual(e.target.value);
                }}
                className={inputClass}
              />
              {mgmtManualOverride && (
                <button type="button" onClick={() => setMgmtManualOverride(false)} className="mt-1 text-xs text-blue-400 hover:text-blue-300">
                  Reset to % of rent
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="mb-3 text-sm font-semibold text-zinc-200">Net ROI base</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRoiMode('excl')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                roiMode === 'excl' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
              }`}
            >
              Excl. DLD
            </button>
            <button
              type="button"
              onClick={() => setRoiMode('incl')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                roiMode === 'incl' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
              }`}
            >
              Incl. DLD
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="surface-card-accent flex flex-col gap-4 p-6">
          <div>
            <p className="text-xs font-medium text-zinc-500">{owner || 'Prepared for —'}</p>
            <p className="text-sm font-semibold text-zinc-100">{building || 'Property —'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Purchase price</p>
              <p className="text-sm font-medium text-zinc-200">{fmt(calc.price)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Purchase price incl. DLD</p>
              <p className="text-sm font-medium text-zinc-200">{fmt(calc.priceInclDld)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">DLD (4%)</p>
              <p className="text-sm font-medium text-zinc-200">{fmt(calc.dld)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Gross rental income</p>
              <p className="text-sm font-medium text-zinc-200">{fmt(parseFloat(grossRent) || 0)}</p>
            </div>
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="mb-2 text-xs font-medium text-zinc-400">Annual costs</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Service charges</span>
                <span className="text-zinc-300">{fmt(calc.scAnnual)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Management fee</span>
                <span className="text-zinc-300">{fmt(calc.mgmt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Maintenance</span>
                <span className="text-zinc-300">{fmt(parseFloat(maintenance) || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Other costs</span>
                <span className="text-zinc-300">{fmt(parseFloat(otherCosts) || 0)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-zinc-400">Total annual costs</span>
                <span className="text-zinc-100">{fmt(calc.totalCosts)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-emerald-400">Net rental income</span>
              <span className="text-emerald-400">{fmt(calc.netRent)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wide text-blue-300">Gross ROI</p>
              <p className="text-lg font-semibold text-blue-200">{fmtP(calc.grossROI)}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wide text-emerald-300">Net ROI ({roiMode === 'excl' ? 'excl' : 'incl'}. DLD)</p>
              <p className="text-lg font-semibold text-emerald-300">{fmtP(calc.netROI)}</p>
            </div>
          </div>

          <p className="text-[10px] leading-relaxed text-zinc-600">
            Gross ROI = gross rent ÷ purchase price. Net ROI = net income ÷ purchase price ({roiMode === 'excl' ? 'excl DLD' : 'incl DLD'}). Figures are
            estimates — always consult a licensed advisor.
          </p>
        </div>

        <button
          type="button"
          onClick={exportPDF}
          disabled={exporting}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {exporting ? 'Preparing PDF...' : 'Export as PDF'}
        </button>
      </div>
    </div>
  );
}
