'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProperty } from '@/lib/properties';
import PropertySearchSelect, { sortPropertyOptions, type PropertyOption } from '@/components/PropertySearchSelect';
import { getOffPlanCalculation, saveOffPlanCalculation, deleteOffPlanCalculation, type OffPlanRow } from '@/lib/calculatorPersistence';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

const MILESTONES = ['Booking', 'On Construction', 'On Handover', 'Post Handover', 'Other', 'Manual input'] as const;
const TRUSTEE_FEE: Record<'title' | 'oqood', number> = { title: 4200, oqood: 5250 };

function fmt(n: number): string {
  return `AED ${Math.round(n).toLocaleString()}`;
}

function fmtP(n: number): string {
  return `${n.toFixed(2)}%`;
}

interface Row {
  id: number;
  milestone: string;
  manualLabel: string;
  date: string;
  pct: string;
  paid: string;
}

function rowStatus(fullAmt: number, paidAmt: number): 'unpaid' | 'partial' | 'paid' {
  if (paidAmt <= 0) return 'unpaid';
  if (Math.abs(paidAmt - fullAmt) < 1) return 'paid';
  return 'partial';
}

const statusBadgeClass: Record<string, string> = {
  unpaid: 'bg-white/5 text-zinc-400 ring-1 ring-inset ring-white/10',
  partial: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  paid: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
};

const statusLabel: Record<string, string> = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

interface OffPlanInputs {
  originalPrice: string;
  askingPrice: string;
  nocFee: string;
  pctConstruction: string;
  pctHandover: string;
  postOn: boolean;
  pctPost: string;
  sAgencyPct: string;
  bAgencyPct: string;
  trusteeType: 'title' | 'oqood';
  view: 'seller' | 'buyer';
  includeClientName: boolean;
  includeUnitNumber: boolean;
  includeSchedule: boolean;
}

export default function OffPlanCalculator({
  properties,
  initialPropertyId,
}: {
  properties: { id: string; building: string | null; unit_number: string | null }[];
  initialPropertyId: string | null;
}) {
  const [propertyId, setPropertyId] = useState(initialPropertyId ?? '');
  const [loadingProperty, setLoadingProperty] = useState(false);

  const propertyOptions = useMemo<PropertyOption[]>(() => sortPropertyOptions(properties), [properties]);

  const [owner, setOwner] = useState('');
  const [building, setBuilding] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [includeClientName, setIncludeClientName] = useState(true);
  const [includeUnitNumber, setIncludeUnitNumber] = useState(true);
  const [includeSchedule, setIncludeSchedule] = useState(true);

  const [originalPrice, setOriginalPrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [nocFee, setNocFee] = useState('');

  const [pctConstruction, setPctConstruction] = useState('');
  const [pctHandover, setPctHandover] = useState('');
  const [postOn, setPostOn] = useState(false);
  const [pctPost, setPctPost] = useState('');

  const [sAgencyPct, setSAgencyPct] = useState('2');
  const [bAgencyPct, setBAgencyPct] = useState('2');
  const [trusteeType, setTrusteeType] = useState<'title' | 'oqood'>('title');
  const [view, setView] = useState<'seller' | 'buyer'>('seller');

  const [rows, setRows] = useState<Row[]>([{ id: 1, milestone: 'Booking', manualLabel: '', date: '', pct: '', paid: '' }]);
  const [nextRowId, setNextRowId] = useState(2);
  const [exporting, setExporting] = useState(false);
  const [savedPlanLoaded, setSavedPlanLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!propertyId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedPlanLoaded(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingProperty(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveMessage('');
    Promise.all([getProperty(propertyId), getOffPlanCalculation<OffPlanInputs>(propertyId)])
      .then(([property, saved]) => {
        if (property) {
          setOwner(property.clients?.name ?? '');
          setBuilding(property.building ?? '');
          setUnitNumber(property.unit_number ?? '');
          setOriginalPrice(property.op != null ? String(property.op) : '');
          setAskingPrice(property.asking_price != null ? String(property.asking_price) : '');
        }
        if (saved) {
          const s = saved.inputs;
          setOriginalPrice(s.originalPrice);
          setAskingPrice(s.askingPrice);
          setNocFee(s.nocFee);
          setPctConstruction(s.pctConstruction);
          setPctHandover(s.pctHandover);
          setPostOn(s.postOn);
          setPctPost(s.pctPost);
          setSAgencyPct(s.sAgencyPct);
          setBAgencyPct(s.bAgencyPct);
          setTrusteeType(s.trusteeType);
          setView(s.view);
          setIncludeClientName(s.includeClientName);
          setIncludeUnitNumber(s.includeUnitNumber);
          setIncludeSchedule(s.includeSchedule);
          if (saved.rows.length > 0) {
            setRows(saved.rows.map((r, i) => ({ id: i + 1, milestone: r.milestone, manualLabel: r.manualLabel, date: r.date, pct: r.pct, paid: r.paid })));
            setNextRowId(saved.rows.length + 1);
          }
          setSavedPlanLoaded(true);
        } else {
          setSavedPlanLoaded(false);
        }
      })
      .finally(() => setLoadingProperty(false));
  }, [propertyId]);

  async function handleSave() {
    if (!propertyId) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const inputs: OffPlanInputs = {
        originalPrice,
        askingPrice,
        nocFee,
        pctConstruction,
        pctHandover,
        postOn,
        pctPost,
        sAgencyPct,
        bAgencyPct,
        trusteeType,
        view,
        includeClientName,
        includeUnitNumber,
        includeSchedule,
      };
      const rowsToSave: OffPlanRow[] = rows.map((r) => ({ milestone: r.milestone, manualLabel: r.manualLabel, date: r.date, pct: r.pct, paid: r.paid }));
      await saveOffPlanCalculation(propertyId, inputs, rowsToSave);
      setSavedPlanLoaded(true);
      setSaveMessage('Saved.');
    } catch {
      setSaveMessage('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSaved() {
    if (!propertyId) return;
    setSaving(true);
    setSaveMessage('');
    try {
      await deleteOffPlanCalculation(propertyId);
      setSavedPlanLoaded(false);
      setSaveMessage('Deleted saved plan.');
    } catch {
      setSaveMessage('Failed to delete.');
    } finally {
      setSaving(false);
    }
  }

  function addRow() {
    setRows((prev) => [...prev, { id: nextRowId, milestone: 'On Construction', manualLabel: '', date: '', pct: '', paid: '' }]);
    setNextRowId((n) => n + 1);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const calc = useMemo(() => {
    const op = parseFloat(originalPrice) || 0;
    const ask = parseFloat(askingPrice) || 0;
    const noc = parseFloat(nocFee) || 0;
    const pctC = parseFloat(pctConstruction) || 0;
    const pctH = parseFloat(pctHandover) || 0;
    const pctP = postOn ? parseFloat(pctPost) || 0 : 0;
    const totalPct = pctC + pctH + pctP;

    const rowData = rows.map((r) => {
      const pct = parseFloat(r.pct) || 0;
      const fullAmt = (op * pct) / 100;
      const paidAmt = parseFloat(r.paid) || 0;
      const milestone = r.milestone === 'Manual input' ? r.manualLabel || 'Manual input' : r.milestone;
      return { ...r, pct, fullAmt, paidAmt, milestone, status: rowStatus(fullAmt, paidAmt) };
    });

    let totPct = 0;
    let totFullAmt = 0;
    let totPaidAmt = 0;
    let unpaidPreAmt = 0;
    let unpaidPostAmt = 0;
    for (const r of rowData) {
      totPct += r.pct;
      totFullAmt += r.fullAmt;
      totPaidAmt += r.paidAmt;
      const remaining = r.fullAmt - r.paidAmt;
      if (r.milestone === 'Post Handover') unpaidPostAmt += remaining > 0 ? remaining : 0;
      else if (r.milestone !== 'On Handover') unpaidPreAmt += remaining > 0 ? remaining : 0;
    }

    const remainder = op - totPaidAmt;
    const dld = op * 0.04;
    const originalInclDld = op + dld;
    const profit = ask - op;
    const netProfit = profit - dld;
    const transferAmt = totPaidAmt + profit;
    const handoverAmt = (op * pctH) / 100;

    const sAgency = ask * (parseFloat(sAgencyPct) || 0) * 0.01 * 1.05;
    const sCostTotal = noc + sAgency;

    const bAgency = ask * (parseFloat(bAgencyPct) || 0) * 0.01 * 1.05;
    const bTrustee = TRUSTEE_FEE[trusteeType];
    const bDld = ask * 0.04;
    const bFeesTotal = bDld + bAgency + bTrustee;
    const bTotalInclFees = ask + bFeesTotal;
    const bTransferTotal = transferAmt + bFeesTotal;

    return {
      op,
      ask,
      noc,
      pctC,
      pctH,
      pctP,
      totalPct,
      rowData,
      totPct,
      totFullAmt,
      totPaidAmt,
      unpaidPreAmt,
      unpaidPostAmt,
      remainder,
      dld,
      originalInclDld,
      profit,
      netProfit,
      transferAmt,
      handoverAmt,
      sAgency,
      sCostTotal,
      bAgency,
      bTrustee,
      bDld,
      bFeesTotal,
      bTotalInclFees,
      bTransferTotal,
    };
  }, [originalPrice, askingPrice, nocFee, pctConstruction, pctHandover, postOn, pctPost, rows, sAgencyPct, bAgencyPct, trusteeType]);

  async function exportPDF() {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = 210;
      const marginX = 16;
      const contentW = pageW - marginX * 2;
      let y = 20;

      const bg: [number, number, number] = [13, 27, 46];
      const card: [number, number, number] = [26, 45, 71];
      const borderFaint: [number, number, number] = [47, 51, 50];
      const borderCard: [number, number, number] = [17, 30, 49];
      const textLight: [number, number, number] = [240, 230, 208];
      const textMuted: [number, number, number] = [155, 168, 184];
      const textFaint: [number, number, number] = [107, 120, 136];
      const gold: [number, number, number] = [184, 145, 68];
      const goldBright: [number, number, number] = [212, 168, 83];
      const emerald: [number, number, number] = [126, 203, 126];
      const rose: [number, number, number] = [224, 128, 128];

      pdf.setFillColor(...bg);
      pdf.rect(0, 0, pageW, 297, 'F');

      try {
        const logoResp = await fetch('/branding/lig-logo.png');
        const logoBlob = await logoResp.blob();
        const logoDataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoBlob);
        });
        const logoW = 28;
        const logoH = logoW * (2250 / 7500);
        pdf.addImage(logoDataUrl, 'PNG', marginX, y - 6, logoW, logoH);
      } catch {
        // logo optional
      }
      y += 16;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(...goldBright);
      pdf.text('Off-Plan Calculator', marginX, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...textMuted);
      pdf.text(`Luxury Invest Group · ${view === 'seller' ? 'Seller view' : 'Buyer view'}`, marginX, y);
      y += 10;

      const displayBuilding = includeUnitNumber && unitNumber ? `${building || '—'} - ${unitNumber}` : building || '—';

      pdf.setFontSize(8);
      pdf.setTextColor(...gold);
      pdf.text('PREPARED FOR', marginX, y);
      pdf.text('PROPERTY', marginX + contentW / 2, y);
      y += 5.5;
      pdf.setFontSize(11);
      pdf.setTextColor(...textLight);
      pdf.text(includeClientName ? owner || '—' : '—', marginX, y);
      pdf.text(displayBuilding, marginX + contentW / 2, y);
      y += 10;

      function sectionLabel(text: string) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...gold);
        pdf.text(text.toUpperCase(), marginX, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
      }

      const rowDivider: [number, number, number] = [40, 58, 84];
      const rowH = 8;
      const padV = 4;
      const capOffset = 1.2;

      function dataCard(dRows: { label: string; value: string; bold?: boolean; color?: [number, number, number] }[]) {
        const height = padV * 2 + dRows.length * rowH;
        pdf.setFillColor(...card);
        pdf.setDrawColor(...borderCard);
        pdf.roundedRect(marginX, y, contentW, height, 2, 2, 'FD');

        const cardTop = y;
        dRows.forEach((r, i) => {
          const cellTop = cardTop + padV + i * rowH;
          const baseline = cellTop + rowH / 2 + capOffset;
          if (i > 0) {
            pdf.setDrawColor(...rowDivider);
            pdf.line(marginX + 4, cellTop, marginX + contentW - 4, cellTop);
          }
          pdf.setFontSize(9.5);
          pdf.setTextColor(...textMuted);
          pdf.text(r.label, marginX + 4, baseline);
          pdf.setFont('helvetica', r.bold ? 'bold' : 'normal');
          pdf.setTextColor(...(r.color ?? textLight));
          pdf.text(r.value, marginX + contentW - 4, baseline, { align: 'right' });
          pdf.setFont('helvetica', 'normal');
        });

        y += height + 8.5;
      }

      if (view === 'seller') {
        sectionLabel('Original Purchase');
        dataCard([
          { label: 'Original price', value: fmt(calc.op) },
          { label: 'DLD (4%)', value: fmt(calc.dld) },
          { label: 'Original price incl. DLD', value: fmt(calc.originalInclDld) },
          { label: 'Paid to date', value: fmt(calc.totPaidAmt) },
        ]);

        sectionLabel('Resale');
        dataCard([
          { label: 'Asking price', value: fmt(calc.ask) },
          { label: 'Profit (asking - original)', value: fmt(calc.profit), bold: true, color: calc.profit < 0 ? rose : goldBright },
          { label: 'Net profit (after DLD)', value: fmt(calc.netProfit), bold: true, color: calc.netProfit < 0 ? rose : emerald },
          { label: 'Transfer amount (paid + profit)', value: fmt(calc.transferAmt) },
        ]);

        sectionLabel('Seller Costs');
        dataCard([
          { label: 'NOC fee', value: fmt(calc.noc) },
          { label: 'Agency fee (incl. VAT)', value: fmt(calc.sAgency) },
          { label: 'Total seller costs', value: fmt(calc.sCostTotal), bold: true, color: goldBright },
        ]);
      } else {
        sectionLabel('Purchase Summary');
        dataCard([
          { label: 'Asking price', value: fmt(calc.ask) },
          { label: 'Paid to seller to date', value: fmt(calc.totPaidAmt) },
          { label: 'Remaining pre-handover', value: fmt(calc.unpaidPreAmt) },
          { label: 'Handover amount', value: fmt(calc.handoverAmt) },
          { label: 'Post-handover remaining', value: fmt(calc.unpaidPostAmt) },
        ]);

        sectionLabel('Buyer Fees');
        dataCard([
          { label: 'DLD (4%)', value: fmt(calc.bDld) },
          { label: 'Agency fee (incl. VAT)', value: fmt(calc.bAgency) },
          { label: `Trustee (${trusteeType === 'title' ? 'Title Deed' : 'Oqood'})`, value: fmt(calc.bTrustee) },
          { label: 'Total fees', value: fmt(calc.bFeesTotal), bold: true, color: goldBright },
        ]);

        sectionLabel('Totals');
        dataCard([
          { label: 'Asking price incl. fees', value: fmt(calc.bTotalInclFees) },
          { label: 'Transfer to seller + fees', value: fmt(calc.bTransferTotal), bold: true, color: goldBright },
        ]);
      }

      if (includeSchedule && rows.length > 0) {
        sectionLabel('Payment Schedule');
        const colW = [8, contentW * 0.32, contentW * 0.18, contentW * 0.1, contentW * 0.2, contentW * 0.2 - 8];
        const tableH = padV * 2 + (calc.rowData.length + 1) * rowH;
        pdf.setFillColor(...card);
        pdf.setDrawColor(...borderCard);
        pdf.roundedRect(marginX, y, contentW, tableH, 2, 2, 'FD');

        let rowY = y + padV + rowH / 2 + capOffset;
        let colX = marginX + 4;
        const headers = ['#', 'Milestone', 'Date', '%', 'Amount', 'Status'];
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...gold);
        headers.forEach((h, i) => {
          pdf.text(h.toUpperCase(), colX, rowY);
          colX += colW[i];
        });
        pdf.setFont('helvetica', 'normal');

        calc.rowData.forEach((r, i) => {
          const cellTop = y + padV + (i + 1) * rowH;
          rowY = cellTop + rowH / 2 + capOffset;
          pdf.setDrawColor(...rowDivider);
          pdf.line(marginX + 4, cellTop, marginX + contentW - 4, cellTop);

          colX = marginX + 4;
          pdf.setFontSize(9);
          pdf.setTextColor(...textMuted);
          pdf.text(String(i + 1), colX, rowY);
          colX += colW[0];
          pdf.setTextColor(...textLight);
          pdf.text(r.milestone, colX, rowY);
          colX += colW[1];
          pdf.setTextColor(...textMuted);
          pdf.text(r.date || '—', colX, rowY);
          colX += colW[2];
          pdf.text(`${r.pct}%`, colX, rowY);
          colX += colW[3];
          pdf.setTextColor(...textLight);
          pdf.text(fmt(r.fullAmt), colX, rowY);
          colX += colW[4];
          const statusColor = r.status === 'paid' ? emerald : r.status === 'partial' ? goldBright : textFaint;
          pdf.setTextColor(...statusColor);
          pdf.text(statusLabel[r.status], colX, rowY);
        });

        y += tableH + 8.5;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...textFaint);
      const note = 'Figures are estimates - always consult a licensed advisor.';
      pdf.text(note, marginX, y);
      y += 12;

      const centerX = pageW / 2;
      pdf.setDrawColor(...borderFaint);
      pdf.line(marginX, y, pageW - marginX, y);
      y += 8;

      const footerRow1 = y;
      const footerRow2 = y + 5;
      const footerRow3 = y + 10;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...goldBright);
      pdf.text('Thomas King', marginX, footerRow1);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...textFaint);
      pdf.text('SALES ADVISOR', marginX, footerRow2);

      pdf.setFontSize(9);
      pdf.setTextColor(...textMuted);
      pdf.text('+971 50 167 0251', centerX, footerRow1, { align: 'center' });
      pdf.text('Thomas.king@luxuryinvestgroup.com', centerX, footerRow2, { align: 'center' });
      pdf.text('luxuryinvestgroup.com', centerX, footerRow3, { align: 'center' });

      pdf.setFontSize(8.5);
      pdf.setTextColor(...gold);
      pdf.text('Instagram', pageW - marginX - 20, footerRow1, { align: 'right' });
      pdf.setTextColor(...textMuted);
      pdf.text('@t.king.lux', pageW - marginX, footerRow1, { align: 'right' });
      pdf.setTextColor(...gold);
      pdf.text('TikTok', pageW - marginX - 20, footerRow2, { align: 'right' });
      pdf.setTextColor(...textMuted);
      pdf.text('@t.king.lux', pageW - marginX, footerRow2, { align: 'right' });

      y = footerRow3 + 9;
      pdf.setDrawColor(...borderFaint);
      pdf.line(marginX, y, pageW - marginX, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(...textFaint);
      pdf.text('Luxury Invest Group · 2605 & 2611, Rise Tower, Tecom, Al Thanyah, Dubai, UAE', centerX, y, { align: 'center' });

      pdf.save(`OffPlan-Calculator-${(building || 'Property').replace(/[^a-z0-9]+/gi, '-')}.pdf`);
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
            <PropertySearchSelect options={propertyOptions} value={propertyId} onChange={setPropertyId} />
            {loadingProperty && <p className="mt-1 text-xs text-zinc-500">Loading property details...</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prepared for</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} placeholder="Client name" />
            </div>
            <div>
              <label className={labelClass}>Building</label>
              <input value={building} onChange={(e) => setBuilding(e.target.value)} className={inputClass} placeholder="Building name" />
            </div>
            <div>
              <label className={labelClass}>Unit number</label>
              <input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className={inputClass} placeholder="Unit number" />
            </div>
            <div>
              <label className={labelClass}>Original price (AED)</label>
              <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Asking price (AED)</label>
              <input type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>NOC fee (AED)</label>
              <input type="number" value={nocFee} onChange={(e) => setNocFee(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="mb-4 text-sm font-semibold text-zinc-200">Payment plan structure</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>During construction (%)</label>
              <input type="number" value={pctConstruction} onChange={(e) => setPctConstruction(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>On handover (%)</label>
              <input type="number" value={pctHandover} onChange={(e) => setPctHandover(e.target.value)} className={inputClass} />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={postOn}
              onChange={(e) => setPostOn(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500"
            />
            Post-handover payment plan
          </label>
          {postOn && (
            <div className="mt-3">
              <label className={labelClass}>Post handover (%)</label>
              <input type="number" value={pctPost} onChange={(e) => setPctPost(e.target.value)} className={inputClass} />
            </div>
          )}
          {calc.totalPct > 0 && Math.abs(calc.totalPct - 100) > 0.01 && (
            <p className="mt-3 text-xs text-amber-400">Payment plan totals {calc.totalPct.toFixed(1)}%, not 100%.</p>
          )}
        </div>

        <div className="surface-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-200">Payment schedule</p>
            <button type="button" onClick={addRow} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
              + Add row
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {rows.map((row) => {
              const rd = calc.rowData.find((r) => r.id === row.id);
              return (
                <div key={row.id} className="rounded-lg bg-white/5 p-3 ring-1 ring-inset ring-white/10">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={row.milestone}
                      onChange={(e) => updateRow(row.id, { milestone: e.target.value })}
                      className={inputClass}
                    >
                      {MILESTONES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, { date: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  {row.milestone === 'Manual input' && (
                    <input
                      type="text"
                      value={row.manualLabel}
                      onChange={(e) => updateRow(row.id, { manualLabel: e.target.value })}
                      placeholder="Enter milestone..."
                      className={`${inputClass} mt-2`}
                    />
                  )}
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] text-zinc-500">% of price</label>
                      <input
                        type="number"
                        value={row.pct}
                        onChange={(e) => updateRow(row.id, { pct: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-zinc-500">Paid (AED)</label>
                      <input
                        type="number"
                        value={row.paid}
                        onChange={(e) => updateRow(row.id, { paid: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col justify-between">
                      <label className="mb-1 block text-[10px] text-zinc-500">Full amount</label>
                      <p className="px-1 py-2 text-sm text-zinc-300">{rd ? fmt(rd.fullAmt) : 'AED 0'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass[rd?.status ?? 'unpaid']}`}>
                      {statusLabel[rd?.status ?? 'unpaid']}
                    </span>
                    <button type="button" onClick={() => removeRow(row.id)} className="text-xs text-rose-400 hover:text-rose-300">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <p className="text-sm text-zinc-500">No payment schedule rows yet.</p>}
          </div>
          {rows.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-zinc-400">
              <span>
                Total: {fmtP(calc.totPct)} · {fmt(calc.totFullAmt)}
              </span>
              <span className="text-zinc-300">Paid: {fmt(calc.totPaidAmt)}</span>
            </div>
          )}
        </div>

        <div className="surface-card p-6">
          <p className="mb-3 text-sm font-semibold text-zinc-200">Fees</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Seller agency fee (%)</label>
              <input type="number" value={sAgencyPct} onChange={(e) => setSAgencyPct(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Buyer agency fee (%)</label>
              <input type="number" value={bAgencyPct} onChange={(e) => setBAgencyPct(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Trustee registration type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTrusteeType('title')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                  trusteeType === 'title' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                }`}
              >
                Title Deed (AED 4,200)
              </button>
              <button
                type="button"
                onClick={() => setTrusteeType('oqood')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                  trusteeType === 'oqood' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                }`}
              >
                Oqood (AED 5,250)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="surface-card p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView('seller')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition ${
                view === 'seller' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
              }`}
            >
              Seller view
            </button>
            <button
              type="button"
              onClick={() => setView('buyer')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition ${
                view === 'buyer' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
              }`}
            >
              Buyer view
            </button>
          </div>
        </div>

        <div className="surface-card-accent flex flex-col gap-4 p-6">
          <div>
            <p className="text-xs font-medium text-zinc-500">{owner || 'Prepared for —'}</p>
            <p className="text-sm font-semibold text-zinc-100">
              {building || unitNumber ? `${building}${unitNumber ? ` - ${unitNumber}` : ''}` : 'Property —'}
            </p>
          </div>

          {view === 'seller' ? (
            <>
              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Original price</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.op)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Original incl. DLD</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.originalInclDld)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Asking price</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.ask)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Paid to date</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.totPaidAmt)}</p>
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="mb-2 text-xs font-medium text-zinc-400">Seller costs</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">NOC fee</span>
                    <span className="text-zinc-300">{fmt(calc.noc)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Agency fee (incl. VAT)</span>
                    <span className="text-zinc-300">{fmt(calc.sAgency)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-zinc-400">Total costs</span>
                    <span className="text-zinc-100">{fmt(calc.sCostTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: calc.profit < 0 ? 'rgba(244,63,94,0.1)' : 'rgba(59,130,246,0.1)',
                    border: `1px solid ${calc.profit < 0 ? 'rgba(244,63,94,0.2)' : 'rgba(59,130,246,0.2)'}`,
                  }}
                >
                  <p className={`text-[10px] uppercase tracking-wide ${calc.profit < 0 ? 'text-rose-300' : 'text-blue-300'}`}>Profit</p>
                  <p className={`text-lg font-semibold ${calc.profit < 0 ? 'text-rose-300' : 'text-blue-200'}`}>{fmt(calc.profit)}</p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: calc.netProfit < 0 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${calc.netProfit < 0 ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  }}
                >
                  <p className={`text-[10px] uppercase tracking-wide ${calc.netProfit < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>Net profit</p>
                  <p className={`text-lg font-semibold ${calc.netProfit < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{fmt(calc.netProfit)}</p>
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-zinc-300">Transfer amount (paid to date + profit)</span>
                  <span className="text-zinc-100">{fmt(calc.transferAmt)}</span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">
                  {fmt(calc.totPaidAmt)} + ({fmt(calc.ask)} - {fmt(calc.op)}) = {fmt(calc.transferAmt)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Asking price</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.ask)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Paid to seller</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.totPaidAmt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Remaining pre-handover</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.unpaidPreAmt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Handover amount</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(calc.handoverAmt)}</p>
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="mb-2 text-xs font-medium text-zinc-400">Buyer fees</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">DLD (4%)</span>
                    <span className="text-zinc-300">{fmt(calc.bDld)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Agency fee (incl. VAT)</span>
                    <span className="text-zinc-300">{fmt(calc.bAgency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Trustee ({trusteeType === 'title' ? 'Title Deed' : 'Oqood'})</span>
                    <span className="text-zinc-300">{fmt(calc.bTrustee)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-zinc-400">Total fees</span>
                    <span className="text-zinc-100">{fmt(calc.bFeesTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-wide text-blue-300">Asking price incl. fees</p>
                  <p className="text-lg font-semibold text-blue-200">{fmt(calc.bTotalInclFees)}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-wide text-emerald-300">Transfer + fees</p>
                  <p className="text-lg font-semibold text-emerald-300">{fmt(calc.bTransferTotal)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="surface-card p-4">
          <p className="mb-2 text-xs font-medium text-zinc-400">Include in PDF export</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={includeClientName}
                onChange={(e) => setIncludeClientName(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500"
              />
              Client name
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={includeUnitNumber}
                onChange={(e) => setIncludeUnitNumber(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500"
              />
              Unit number
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={includeSchedule}
                onChange={(e) => setIncludeSchedule(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500"
              />
              Payment schedule
            </label>
          </div>
        </div>

        {propertyId && (
          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">{savedPlanLoaded ? 'Saved plan for this property' : 'No saved plan for this property'}</p>
                {saveMessage && <p className="mt-1 text-xs text-zinc-500">{saveMessage}</p>}
              </div>
              <div className="flex gap-2">
                {savedPlanLoaded && (
                  <button
                    type="button"
                    onClick={handleDeleteSaved}
                    disabled={saving}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 ring-1 ring-inset ring-white/10 hover:ring-white/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : savedPlanLoaded ? 'Update saved plan' : 'Save plan'}
                </button>
              </div>
            </div>
          </div>
        )}

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
