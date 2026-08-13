import type { PropertyWithRelations } from '@/types/database';

const STATUS_COLORS: Record<string, [number, number, number]> = {
  Rented: [96, 165, 250],
  Sold: [148, 163, 184],
  'For rent': [251, 146, 60],
  'For sale': [52, 211, 153],
  Vacant: [251, 146, 60],
  'Off plan': [148, 163, 184],
  Ready: [148, 163, 184],
  'End user': [148, 163, 184],
};

function money(n: number | null): string {
  return n ? `AED ${n.toLocaleString()}` : '—';
}

export type AvailabilityColumnKey = 'unit' | 'layout' | 'beds' | 'floor' | 'sqft' | 'view' | 'status' | 'price' | 'rent';

export const AVAILABILITY_COLUMNS: { key: AvailabilityColumnKey; label: string }[] = [
  { key: 'unit', label: 'Unit' },
  { key: 'layout', label: 'Layout' },
  { key: 'beds', label: 'Beds' },
  { key: 'floor', label: 'Floor' },
  { key: 'sqft', label: 'Sqft' },
  { key: 'view', label: 'View' },
  { key: 'status', label: 'Status' },
  { key: 'price', label: 'Price' },
  { key: 'rent', label: 'Rent (yr)' },
];

// Relative widths — proportioned to fill whatever columns are selected.
const COLUMN_WEIGHT: Record<AvailabilityColumnKey, number> = {
  unit: 1.1,
  layout: 0.9,
  beds: 0.9,
  floor: 0.9,
  sqft: 1.1,
  view: 2.2,
  status: 1.6,
  price: 1.8,
  rent: 1.8,
};

interface BuildingGroup {
  building: string;
  bedroomGroups: { bedroomLabel: string; rows: PropertyWithRelations[] }[];
}

function columnValue(key: AvailabilityColumnKey, p: PropertyWithRelations): { text: string; color?: [number, number, number]; bold?: boolean } {
  switch (key) {
    case 'unit':
      return { text: p.unit_number ?? '—' };
    case 'layout':
      return { text: p.layout ?? '—' };
    case 'beds':
      return { text: p.property_bedroom_counts.map((b) => b.bedroom_counts.name).join(', ') || '—' };
    case 'floor':
      return { text: p.floor ?? '—' };
    case 'sqft':
      return { text: p.sqft ? p.sqft.toLocaleString() : '—' };
    case 'view':
      return { text: p.property_view_types.map((v) => v.view_types.name).join(', ') || '—' };
    case 'status': {
      const statuses = p.property_property_statuses.map((s) => s.property_statuses.name);
      return { text: statuses.join(', ') || '—', color: statuses.length ? STATUS_COLORS[statuses[0]] : undefined, bold: true };
    }
    case 'price':
      return { text: money(p.asking_price) };
    case 'rent':
      return { text: money(p.rental_income) };
  }
}

export async function exportAvailabilityPdf(groups: BuildingGroup[], subtitle: string, columnKeys: AvailabilityColumnKey[]) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = 210;
  const pageH = 297;
  const marginX = 16;
  const contentW = pageW - marginX * 2;
  const bottomLimit = pageH - 24;
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

  const activeCols = AVAILABILITY_COLUMNS.filter((c) => columnKeys.includes(c.key));
  const totalWeight = activeCols.reduce((sum, c) => sum + COLUMN_WEIGHT[c.key], 0) || 1;
  const colX: number[] = [];
  const colW: number[] = [];
  {
    let x = marginX;
    for (const c of activeCols) {
      const w = (COLUMN_WEIGHT[c.key] / totalWeight) * contentW;
      colX.push(x);
      colW.push(w);
      x += w;
    }
  }

  let logoDataUrl: string | null = null;
  try {
    const logoResp = await fetch('/branding/lig-logo.png');
    const logoBlob = await logoResp.blob();
    logoDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(logoBlob);
    });
  } catch {
    // logo optional
  }

  function newPage() {
    pdf.addPage();
    pdf.setFillColor(...bg);
    pdf.rect(0, 0, pageW, pageH, 'F');
    y = 20;
    drawTableHeader();
  }

  function pageFooter() {
    const centerX = pageW / 2;
    const fy = pageH - 15;
    pdf.setDrawColor(...borderFaint);
    pdf.line(marginX, fy - 5, pageW - marginX, fy - 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...textFaint);
    pdf.text('Thomas King · Luxury Invest Group', centerX, fy - 1, { align: 'center' });
    pdf.text('+971 50 167 0251 · Thomas.king@luxuryinvestgroup.com', centerX, fy + 4, { align: 'center' });
    pdf.text(`Page ${pdf.getNumberOfPages()}`, pageW - marginX, fy - 1, { align: 'right' });
  }

  function drawTableHeader() {
    pdf.setFillColor(...card);
    pdf.rect(marginX, y, contentW, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...gold);
    activeCols.forEach((c, i) => {
      pdf.text(c.label.toUpperCase(), colX[i] + 2, y + 4.8);
    });
    y += 9;
    pdf.setFont('helvetica', 'normal');
  }

  // Cover header
  pdf.setFillColor(...bg);
  pdf.rect(0, 0, pageW, pageH, 'F');

  if (logoDataUrl) {
    const logoW = 24;
    const logoH = logoW * (2250 / 7500);
    pdf.addImage(logoDataUrl, 'PNG', marginX, y - 6, logoW, logoH);
  }
  y += 13;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...goldBright);
  pdf.text('Property Availability', marginX, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...textMuted);
  pdf.text(subtitle, marginX, y);
  y += 4.5;
  pdf.setFontSize(8);
  pdf.setTextColor(...textFaint);
  pdf.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), marginX, y);
  y += 7;

  drawTableHeader();

  const rowH = 7;

  for (const group of groups) {
    if (y + rowH + 8 > bottomLimit) newPage();
    pdf.setFillColor(...card);
    pdf.rect(marginX, y, contentW, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...goldBright);
    pdf.text(group.building.toUpperCase(), marginX + 2, y + 4.2);
    y += 8;
    pdf.setFont('helvetica', 'normal');

    for (const bg2 of group.bedroomGroups) {
      if (y + rowH + 6 > bottomLimit) newPage();
      pdf.setFontSize(7.5);
      pdf.setTextColor(...textFaint);
      pdf.text(bg2.bedroomLabel === 'Unspecified' ? 'Bedrooms unspecified' : `${bg2.bedroomLabel} bed`, marginX + 2, y);
      y += 5;

      for (const p of bg2.rows) {
        if (y + rowH > bottomLimit) newPage();

        pdf.setDrawColor(...borderCard);
        pdf.line(marginX, y + rowH, marginX + contentW, y + rowH);

        const baseline = y + rowH / 2 + 1.4;
        pdf.setFontSize(7.5);

        activeCols.forEach((c, i) => {
          const { text, color, bold } = columnValue(c.key, p);
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setTextColor(...(color ?? (c.key === 'price' || c.key === 'rent' ? goldBright : c.key === 'unit' ? textLight : textMuted)));
          const fitted = pdf.splitTextToSize(text, colW[i] - 3)[0] ?? text;
          pdf.text(fitted, colX[i] + 2, baseline);
        });
        pdf.setFont('helvetica', 'normal');

        y += rowH;
      }
      y += 3;
    }
  }

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pageFooter();
  }

  pdf.save(`Property-Availability-${subtitle.replace(/[^a-z0-9]+/gi, '-')}.pdf`);
}
