'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProperty } from '@/lib/properties';
import PropertySearchSelect, { sortPropertyOptions, type PropertyOption } from '@/components/PropertySearchSelect';
import { getUAEPropertyCalculation, saveUAEPropertyCalculation, deleteUAEPropertyCalculation } from '@/lib/calculatorPersistence';

interface UAEPropertyInputs {
  tab: 'mortgage' | 'roi';
  price: string;
  mDpPct: string;
  mRatePct: string;
  mTermYears: string;
  mDldMode: 'pct' | 'manual';
  mDldPct: string;
  mDldManual: string;
  mAgencyMode: 'pct' | 'manual';
  mAgencyPct: string;
  mAgencyManual: string;
  mTrustee: 'title' | 'oqood';
  rent: string;
  sqft: string;
  scRate: string;
  rMgmtPct: string;
  rMaint: string;
  rOther: string;
  rDldAdmin: string;
  rDldMode: 'pct' | 'manual';
  rDldPct: string;
  rDldManual: string;
  rAgencyMode: 'pct' | 'manual';
  rAgencyPct: string;
  rAgencyManual: string;
  rTrustee: 'title' | 'oqood';
  purchaseType: 'cash' | 'mortgage';
  rMregAdmin: string;
  rMfeesOther: string;
  roiIncDld: boolean;
  roiIncAgency: boolean;
  roiIncTrustee: boolean;
  roiIncMreg: boolean;
  includeClientName: boolean;
  includeUnitNumber: boolean;
}

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

const TRUSTEE_FEE: Record<'title' | 'oqood', number> = { title: 4200, oqood: 5250 };
const MORTGAGE_DLD_ADMIN = 580;
const MORTGAGE_REG_ADMIN = 290;

function fmt(n: number): string {
  return `AED ${Math.round(n).toLocaleString()}`;
}

function fmtP(n: number): string {
  return `${n.toFixed(2)}%`;
}

function monthlyPayment(loanAmt: number, annRate: number, years: number): number {
  const months = years * 12;
  const r = annRate / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return loanAmt / months;
  return (loanAmt * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function FeeModeToggle({
  mode,
  onModeChange,
  pct,
  onPctChange,
  manual,
  onManualChange,
  computed,
  label,
}: {
  mode: 'pct' | 'manual';
  onModeChange: (m: 'pct' | 'manual') => void;
  pct: string;
  onPctChange: (v: string) => void;
  manual: string;
  onManualChange: (v: string) => void;
  computed: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className={labelClass}>{label}</label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onModeChange('pct')}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset transition ${
              mode === 'pct' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-500 ring-white/10 hover:ring-white/20'
            }`}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => onModeChange('manual')}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset transition ${
              mode === 'manual' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-500 ring-white/10 hover:ring-white/20'
            }`}
          >
            AED
          </button>
        </div>
      </div>
      {mode === 'pct' ? (
        <div>
          <input type="number" value={pct} onChange={(e) => onPctChange(e.target.value)} className={inputClass} placeholder="%" />
          <p className="mt-1 text-[10px] text-zinc-500">{fmt(computed)}</p>
        </div>
      ) : (
        <input type="number" value={manual} onChange={(e) => onManualChange(e.target.value)} className={inputClass} placeholder="AED" />
      )}
    </div>
  );
}

export default function UAEPropertyCalculator({
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

  const [tab, setTab] = useState<'mortgage' | 'roi'>('mortgage');
  const [price, setPrice] = useState('');

  // Mortgage tab
  const [mDpPct, setMDpPct] = useState('20');
  const [mRatePct, setMRatePct] = useState('4');
  const [mTermYears, setMTermYears] = useState('25');
  const [mDldMode, setMDldMode] = useState<'pct' | 'manual'>('pct');
  const [mDldPct, setMDldPct] = useState('4');
  const [mDldManual, setMDldManual] = useState('');
  const [mAgencyMode, setMAgencyMode] = useState<'pct' | 'manual'>('pct');
  const [mAgencyPct, setMAgencyPct] = useState('2');
  const [mAgencyManual, setMAgencyManual] = useState('');
  const [mTrustee, setMTrustee] = useState<'title' | 'oqood'>('title');

  // ROI tab
  const [rent, setRent] = useState('');
  const [sqft, setSqft] = useState('');
  const [scRate, setScRate] = useState('');
  const [rMgmtPct, setRMgmtPct] = useState('5');
  const [rMaint, setRMaint] = useState('');
  const [rOther, setROther] = useState('');
  const [rDldAdmin, setRDldAdmin] = useState('');
  const [rDldMode, setRDldMode] = useState<'pct' | 'manual'>('pct');
  const [rDldPct, setRDldPct] = useState('4');
  const [rDldManual, setRDldManual] = useState('');
  const [rAgencyMode, setRAgencyMode] = useState<'pct' | 'manual'>('pct');
  const [rAgencyPct, setRAgencyPct] = useState('2');
  const [rAgencyManual, setRAgencyManual] = useState('');
  const [rTrustee, setRTrustee] = useState<'title' | 'oqood'>('title');
  const [purchaseType, setPurchaseType] = useState<'cash' | 'mortgage'>('cash');
  const [rMregAdmin, setRMregAdmin] = useState('');
  const [rMfeesOther, setRMfeesOther] = useState('');

  const [roiIncDld, setRoiIncDld] = useState(true);
  const [roiIncAgency, setRoiIncAgency] = useState(true);
  const [roiIncTrustee, setRoiIncTrustee] = useState(true);
  const [roiIncMreg, setRoiIncMreg] = useState(false);

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
    Promise.all([getProperty(propertyId), getUAEPropertyCalculation<UAEPropertyInputs>(propertyId)])
      .then(([property, saved]) => {
        if (property) {
          setOwner(property.clients?.name ?? '');
          setBuilding(property.building ?? '');
          setUnitNumber(property.unit_number ?? '');
          setPrice(property.asking_price != null ? String(property.asking_price) : '');
          setRent(property.rental_income != null ? String(property.rental_income) : '');
          setSqft(property.sqft != null ? String(property.sqft) : '');
          setScRate(property.service_charge != null ? String(property.service_charge) : '');
        }
        if (saved) {
          setTab(saved.tab);
          setPrice(saved.price);
          setMDpPct(saved.mDpPct);
          setMRatePct(saved.mRatePct);
          setMTermYears(saved.mTermYears);
          setMDldMode(saved.mDldMode);
          setMDldPct(saved.mDldPct);
          setMDldManual(saved.mDldManual);
          setMAgencyMode(saved.mAgencyMode);
          setMAgencyPct(saved.mAgencyPct);
          setMAgencyManual(saved.mAgencyManual);
          setMTrustee(saved.mTrustee);
          setRent(saved.rent);
          setSqft(saved.sqft);
          setScRate(saved.scRate);
          setRMgmtPct(saved.rMgmtPct);
          setRMaint(saved.rMaint);
          setROther(saved.rOther);
          setRDldAdmin(saved.rDldAdmin);
          setRDldMode(saved.rDldMode);
          setRDldPct(saved.rDldPct);
          setRDldManual(saved.rDldManual);
          setRAgencyMode(saved.rAgencyMode);
          setRAgencyPct(saved.rAgencyPct);
          setRAgencyManual(saved.rAgencyManual);
          setRTrustee(saved.rTrustee);
          setPurchaseType(saved.purchaseType);
          setRMregAdmin(saved.rMregAdmin);
          setRMfeesOther(saved.rMfeesOther);
          setRoiIncDld(saved.roiIncDld);
          setRoiIncAgency(saved.roiIncAgency);
          setRoiIncTrustee(saved.roiIncTrustee);
          setRoiIncMreg(saved.roiIncMreg);
          setIncludeClientName(saved.includeClientName);
          setIncludeUnitNumber(saved.includeUnitNumber);
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
      const inputs: UAEPropertyInputs = {
        tab,
        price,
        mDpPct,
        mRatePct,
        mTermYears,
        mDldMode,
        mDldPct,
        mDldManual,
        mAgencyMode,
        mAgencyPct,
        mAgencyManual,
        mTrustee,
        rent,
        sqft,
        scRate,
        rMgmtPct,
        rMaint,
        rOther,
        rDldAdmin,
        rDldMode,
        rDldPct,
        rDldManual,
        rAgencyMode,
        rAgencyPct,
        rAgencyManual,
        rTrustee,
        purchaseType,
        rMregAdmin,
        rMfeesOther,
        roiIncDld,
        roiIncAgency,
        roiIncTrustee,
        roiIncMreg,
        includeClientName,
        includeUnitNumber,
      };
      await saveUAEPropertyCalculation(propertyId, inputs);
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
      await deleteUAEPropertyCalculation(propertyId);
      setSavedPlanLoaded(false);
      setSaveMessage('Deleted saved plan.');
    } catch {
      setSaveMessage('Failed to delete.');
    } finally {
      setSaving(false);
    }
  }

  const serviceCharge = useMemo(() => {
    const s = parseFloat(sqft) || 0;
    const r = parseFloat(scRate) || 0;
    return s * r;
  }, [sqft, scRate]);

  const mortgage = useMemo(() => {
    const p = parseFloat(price) || 0;
    const dpPct = parseFloat(mDpPct) || 0;
    const annRate = parseFloat(mRatePct) || 0;
    const years = parseInt(mTermYears, 10) || 25;
    const dpAmt = (p * dpPct) / 100;
    const loanAmt = p - dpAmt;
    const monthly = monthlyPayment(loanAmt, annRate, years);
    const dld = mDldMode === 'pct' ? (p * (parseFloat(mDldPct) || 0)) / 100 : parseFloat(mDldManual) || 0;
    const agency = mAgencyMode === 'pct' ? (p * (parseFloat(mAgencyPct) || 0)) / 100 : parseFloat(mAgencyManual) || 0;
    const agencyVat = agency * 0.05;
    const trustee = TRUSTEE_FEE[mTrustee];
    const dldCombined = dld + MORTGAGE_DLD_ADMIN;
    const mregCombined = loanAmt * 0.0025 + MORTGAGE_REG_ADMIN;
    const totalFees = dldCombined + agency + agencyVat + trustee + mregCombined;
    const totalUpfront = dpAmt + totalFees;
    const purchaseInclFees = p + totalFees;
    return { p, dpAmt, loanAmt, monthly, annRate, years, dld, agency, agencyVat, trustee, dldCombined, mregCombined, totalFees, totalUpfront, purchaseInclFees };
  }, [price, mDpPct, mRatePct, mTermYears, mDldMode, mDldPct, mDldManual, mAgencyMode, mAgencyPct, mAgencyManual, mTrustee]);

  const roi = useMemo(() => {
    const p = parseFloat(price) || 0;
    const rentN = parseFloat(rent) || 0;
    const service = serviceCharge;
    const mgmt = (rentN * (parseFloat(rMgmtPct) || 0)) / 100;
    const maint = parseFloat(rMaint) || 0;
    const other = parseFloat(rOther) || 0;
    const totalAnnual = service + mgmt + maint + other;
    const netIncome = rentN - totalAnnual;

    const dld = rDldMode === 'pct' ? (p * (parseFloat(rDldPct) || 0)) / 100 : parseFloat(rDldManual) || 0;
    const agency = rAgencyMode === 'pct' ? (p * (parseFloat(rAgencyPct) || 0)) / 100 : parseFloat(rAgencyManual) || 0;
    const agencyVat = agency * 0.05;
    const trustee = TRUSTEE_FEE[rTrustee];
    const dldAdmin = parseFloat(rDldAdmin) || 0;
    const dldCombined = dld + dldAdmin;

    const isMortgage = purchaseType === 'mortgage';
    let dpAmt = 0;
    let loanAmt = 0;
    let monthly = 0;
    let mregCombined = 0;
    if (isMortgage) {
      const dpPct = parseFloat(mDpPct) || 0;
      const annRate = parseFloat(mRatePct) || 0;
      const years = parseInt(mTermYears, 10) || 25;
      dpAmt = (p * dpPct) / 100;
      loanAmt = p - dpAmt;
      monthly = monthlyPayment(loanAmt, annRate, years);
      const mregAmt = loanAmt * 0.0025;
      const mregAdmin = parseFloat(rMregAdmin) || 0;
      const mfeesOther = parseFloat(rMfeesOther) || 0;
      mregCombined = mregAmt + mregAdmin + mfeesOther;
    }

    const totalFees = dldCombined + agency + agencyVat + trustee + mregCombined;
    const totalUpfront = dpAmt + totalFees;
    const purchaseInclFees = p + totalFees;
    const cashRequired = totalUpfront;

    const roiFees = (roiIncDld ? dldCombined : 0) + (roiIncAgency ? agency + agencyVat : 0) + (roiIncTrustee ? trustee : 0) + (roiIncMreg ? mregCombined : 0);
    const roiBase = p + roiFees;
    const grossROI = p > 0 ? (rentN / p) * 100 : 0;
    const netROI = roiBase > 0 ? (netIncome / roiBase) * 100 : 0;

    return {
      p,
      rentN,
      service,
      mgmt,
      maint,
      other,
      totalAnnual,
      netIncome,
      dld,
      agency,
      agencyVat,
      trustee,
      dldCombined,
      isMortgage,
      dpAmt,
      loanAmt,
      monthly,
      mregCombined,
      totalFees,
      totalUpfront,
      purchaseInclFees,
      cashRequired,
      grossROI,
      netROI,
    };
  }, [
    price,
    rent,
    serviceCharge,
    rMgmtPct,
    rMaint,
    rOther,
    rDldMode,
    rDldPct,
    rDldManual,
    rAgencyMode,
    rAgencyPct,
    rAgencyManual,
    rTrustee,
    rDldAdmin,
    purchaseType,
    mDpPct,
    mRatePct,
    mTermYears,
    rMregAdmin,
    rMfeesOther,
    roiIncDld,
    roiIncAgency,
    roiIncTrustee,
    roiIncMreg,
  ]);

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
      const blue: [number, number, number] = [96, 165, 250];
      const blueBright: [number, number, number] = [147, 197, 253];

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
      pdf.text('UAE Property Calculator', marginX, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...textMuted);
      pdf.text(`Luxury Invest Group · ${tab === 'mortgage' ? 'Mortgage' : 'Purchase & ROI'}`, marginX, y);
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

      if (tab === 'mortgage') {
        sectionLabel('Mortgage');
        dataCard([
          { label: 'Property price', value: fmt(mortgage.p) },
          { label: 'Down payment', value: fmt(mortgage.dpAmt) },
          { label: 'Loan amount', value: fmt(mortgage.loanAmt) },
          { label: `Interest rate (${mortgage.years} yr term)`, value: `${mortgage.annRate.toFixed(2)}%` },
        ]);

        sectionLabel('Purchase Fees');
        dataCard([
          { label: 'DLD (incl. admin)', value: fmt(mortgage.dldCombined) },
          { label: 'Agency fee (incl. VAT)', value: fmt(mortgage.agency + mortgage.agencyVat) },
          { label: `Trustee (${mTrustee === 'title' ? 'Title Deed' : 'Oqood'})`, value: fmt(mortgage.trustee) },
          { label: 'Mortgage registration', value: fmt(mortgage.mregCombined) },
          { label: 'Total fees', value: fmt(mortgage.totalFees), bold: true, color: goldBright },
        ]);

        sectionLabel('Totals');
        const boxW = (contentW - 4) / 2;
        const boxH = 20;
        pdf.setFillColor(30, 41, 59);
        pdf.setDrawColor(...blue);
        pdf.roundedRect(marginX, y, boxW, boxH, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(...blue);
        pdf.text('MONTHLY PAYMENT', marginX + 4, y + 7);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...blueBright);
        pdf.text(fmt(mortgage.monthly), marginX + 4, y + 15);

        pdf.setFont('helvetica', 'normal');
        pdf.setFillColor(41, 34, 20);
        pdf.setDrawColor(...gold);
        pdf.roundedRect(marginX + boxW + 4, y, boxW, boxH, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(...gold);
        pdf.text('TOTAL UPFRONT (DP + FEES)', marginX + boxW + 8, y + 7);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...goldBright);
        pdf.text(fmt(mortgage.totalUpfront), marginX + boxW + 8, y + 15);
        y += boxH + 8.5;
      } else {
        sectionLabel('Purchase');
        dataCard([
          { label: 'Property price', value: fmt(roi.p) },
          { label: 'Purchase incl. fees', value: fmt(roi.purchaseInclFees) },
          { label: 'Cash required', value: fmt(roi.cashRequired), bold: true, color: goldBright },
        ]);

        sectionLabel('Annual Costs');
        dataCard([
          { label: 'Service charges', value: fmt(roi.service) },
          { label: 'Management fee', value: fmt(roi.mgmt) },
          { label: 'Maintenance', value: fmt(roi.maint) },
          { label: 'Other costs', value: fmt(roi.other) },
          { label: 'Total annual costs', value: fmt(roi.totalAnnual), bold: true, color: goldBright },
        ]);

        sectionLabel('Rental Income');
        dataCard([
          { label: 'Gross rental income', value: fmt(roi.rentN) },
          { label: 'Net rental income', value: fmt(roi.netIncome), bold: true, color: emerald },
        ]);

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
        pdf.setTextColor(...blueBright);
        pdf.text(fmtP(roi.grossROI), marginX + 4, y + 15);

        pdf.setFont('helvetica', 'normal');
        pdf.setFillColor(20, 40, 20);
        pdf.setDrawColor(...emerald);
        pdf.roundedRect(marginX + boxW + 4, y, boxW, boxH, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(...emerald);
        pdf.text('NET ROI', marginX + boxW + 8, y + 7);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(fmtP(roi.netROI), marginX + boxW + 8, y + 15);
        y += boxH + 8.5;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...textFaint);
      pdf.text('Figures are estimates - always consult a licensed advisor.', marginX, y);
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

      pdf.save(`UAE-Property-Calculator-${(building || 'Property').replace(/[^a-z0-9]+/gi, '-')}.pdf`);
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
              <label className={labelClass}>Property price (AED)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('mortgage')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition ${
                tab === 'mortgage' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
              }`}
            >
              Mortgage
            </button>
            <button
              type="button"
              onClick={() => setTab('roi')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition ${
                tab === 'roi' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
              }`}
            >
              Purchase & ROI
            </button>
          </div>
        </div>

        {tab === 'mortgage' ? (
          <>
            <div className="surface-card p-6">
              <p className="mb-4 text-sm font-semibold text-zinc-200">Loan details</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Down payment (%)</label>
                  <input type="number" value={mDpPct} onChange={(e) => setMDpPct(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Interest rate (%/yr)</label>
                  <input type="number" value={mRatePct} onChange={(e) => setMRatePct(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Loan term (years)</label>
                  <input type="number" value={mTermYears} onChange={(e) => setMTermYears(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <p className="mb-4 text-sm font-semibold text-zinc-200">Purchase fees</p>
              <div className="grid grid-cols-2 gap-4">
                <FeeModeToggle
                  label="DLD fee"
                  mode={mDldMode}
                  onModeChange={setMDldMode}
                  pct={mDldPct}
                  onPctChange={setMDldPct}
                  manual={mDldManual}
                  onManualChange={setMDldManual}
                  computed={mortgage.dld}
                />
                <FeeModeToggle
                  label="Agency fee"
                  mode={mAgencyMode}
                  onModeChange={setMAgencyMode}
                  pct={mAgencyPct}
                  onPctChange={setMAgencyPct}
                  manual={mAgencyManual}
                  onManualChange={setMAgencyManual}
                  computed={mortgage.agency}
                />
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">DLD admin AED {MORTGAGE_DLD_ADMIN} and mortgage registration admin AED {MORTGAGE_REG_ADMIN} are added automatically.</p>
              <div className="mt-4">
                <label className={labelClass}>Trustee registration type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMTrustee('title')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                      mTrustee === 'title' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                    }`}
                  >
                    Title Deed (AED 4,200)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMTrustee('oqood')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                      mTrustee === 'oqood' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                    }`}
                  >
                    Oqood (AED 5,250)
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="surface-card p-6">
              <p className="mb-4 text-sm font-semibold text-zinc-200">Rental income & running costs</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Annual rental income (AED)</label>
                  <input type="number" value={rent} onChange={(e) => setRent(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Management fee (% of rent)</label>
                  <input type="number" value={rMgmtPct} onChange={(e) => setRMgmtPct(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Size (sqft)</label>
                  <input type="number" value={sqft} onChange={(e) => setSqft(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Service charge rate (AED/sqft/yr)</label>
                  <input type="number" value={scRate} onChange={(e) => setScRate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Maintenance (AED/yr)</label>
                  <input type="number" value={rMaint} onChange={(e) => setRMaint(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Other costs (AED/yr)</label>
                  <input type="number" value={rOther} onChange={(e) => setROther(e.target.value)} className={inputClass} />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">Calculated service charge: {fmt(serviceCharge)}</p>
            </div>

            <div className="surface-card p-6">
              <p className="mb-4 text-sm font-semibold text-zinc-200">Purchase fees</p>
              <div className="grid grid-cols-2 gap-4">
                <FeeModeToggle
                  label="DLD fee"
                  mode={rDldMode}
                  onModeChange={setRDldMode}
                  pct={rDldPct}
                  onPctChange={setRDldPct}
                  manual={rDldManual}
                  onManualChange={setRDldManual}
                  computed={roi.dld}
                />
                <FeeModeToggle
                  label="Agency fee"
                  mode={rAgencyMode}
                  onModeChange={setRAgencyMode}
                  pct={rAgencyPct}
                  onPctChange={setRAgencyPct}
                  manual={rAgencyManual}
                  onManualChange={setRAgencyManual}
                  computed={roi.agency}
                />
                <div>
                  <label className={labelClass}>DLD admin fee (AED)</label>
                  <input type="number" value={rDldAdmin} onChange={(e) => setRDldAdmin(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Trustee registration type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRTrustee('title')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                      rTrustee === 'title' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                    }`}
                  >
                    Title Deed (AED 4,200)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRTrustee('oqood')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                      rTrustee === 'oqood' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                    }`}
                  >
                    Oqood (AED 5,250)
                  </button>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <p className="mb-3 text-sm font-semibold text-zinc-200">Purchase type</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseType('cash')}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                    purchaseType === 'cash' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseType('mortgage')}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                    purchaseType === 'mortgage' ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40' : 'text-zinc-400 ring-white/10 hover:ring-white/20'
                  }`}
                >
                  Mortgage
                </button>
              </div>
              {purchaseType === 'mortgage' && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-zinc-500">Uses down payment / rate / term from the Mortgage tab.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Mortgage reg. admin (AED)</label>
                      <input type="number" value={rMregAdmin} onChange={(e) => setRMregAdmin(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Other mortgage fees (AED)</label>
                      <input type="number" value={rMfeesOther} onChange={(e) => setRMfeesOther(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="surface-card p-6">
              <p className="mb-3 text-sm font-semibold text-zinc-200">Include in Net ROI base</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={roiIncDld} onChange={(e) => setRoiIncDld(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500" />
                  DLD
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={roiIncAgency} onChange={(e) => setRoiIncAgency(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500" />
                  Agency
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={roiIncTrustee} onChange={(e) => setRoiIncTrustee(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500" />
                  Trustee
                </label>
                {purchaseType === 'mortgage' && (
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox" checked={roiIncMreg} onChange={(e) => setRoiIncMreg(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500" />
                    Mortgage reg.
                  </label>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="surface-card-accent flex flex-col gap-4 p-6">
          <div>
            <p className="text-xs font-medium text-zinc-500">{owner || 'Prepared for —'}</p>
            <p className="text-sm font-semibold text-zinc-100">
              {building || unitNumber ? `${building}${unitNumber ? ` - ${unitNumber}` : ''}` : 'Property —'}
            </p>
          </div>

          {tab === 'mortgage' ? (
            <>
              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Property price</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(mortgage.p)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Down payment</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(mortgage.dpAmt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Loan amount</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(mortgage.loanAmt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Rate / term</p>
                  <p className="text-sm font-medium text-zinc-200">
                    {mortgage.annRate.toFixed(2)}% / {mortgage.years}yr
                  </p>
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="mb-2 text-xs font-medium text-zinc-400">Purchase fees</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">DLD (incl. admin)</span>
                    <span className="text-zinc-300">{fmt(mortgage.dldCombined)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Agency (incl. VAT)</span>
                    <span className="text-zinc-300">{fmt(mortgage.agency + mortgage.agencyVat)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Trustee</span>
                    <span className="text-zinc-300">{fmt(mortgage.trustee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Mortgage registration</span>
                    <span className="text-zinc-300">{fmt(mortgage.mregCombined)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-zinc-400">Total fees</span>
                    <span className="text-zinc-100">{fmt(mortgage.totalFees)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-wide text-blue-300">Monthly payment</p>
                  <p className="text-lg font-semibold text-blue-200">{fmt(mortgage.monthly)}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(184,145,68,0.12)', border: '1px solid rgba(184,145,68,0.25)' }}>
                  <p className="text-[10px] uppercase tracking-wide text-amber-300">Total upfront</p>
                  <p className="text-lg font-semibold text-amber-200">{fmt(mortgage.totalUpfront)}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Property price</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(roi.p)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Purchase incl. fees</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(roi.purchaseInclFees)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Cash required</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(roi.cashRequired)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Gross rental income</p>
                  <p className="text-sm font-medium text-zinc-200">{fmt(roi.rentN)}</p>
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="mb-2 text-xs font-medium text-zinc-400">Annual costs</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Service charges</span>
                    <span className="text-zinc-300">{fmt(roi.service)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Management fee</span>
                    <span className="text-zinc-300">{fmt(roi.mgmt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Maintenance</span>
                    <span className="text-zinc-300">{fmt(roi.maint)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Other costs</span>
                    <span className="text-zinc-300">{fmt(roi.other)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-zinc-400">Total annual costs</span>
                    <span className="text-zinc-100">{fmt(roi.totalAnnual)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-emerald-400">Net rental income</span>
                  <span className="text-emerald-400">{fmt(roi.netIncome)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-wide text-blue-300">Gross ROI</p>
                  <p className="text-lg font-semibold text-blue-200">{fmtP(roi.grossROI)}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-wide text-emerald-300">Net ROI</p>
                  <p className="text-lg font-semibold text-emerald-300">{fmtP(roi.netROI)}</p>
                </div>
              </div>
            </>
          )}

          <p className="text-[10px] leading-relaxed text-zinc-600">Figures are estimates — always consult a licensed advisor.</p>
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
