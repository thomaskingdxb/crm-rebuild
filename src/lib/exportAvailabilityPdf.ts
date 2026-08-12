import type { PropertyWithRelations } from '@/types/database';

const STATUS_COLORS: Record<string, [number, number, number]> = {
  Rented: [96, 165, 250],
  Sold: [148, 163, 184],
  'For rent': [251, 146, 60],
  'For sale': [52, 211, 153],
  Vacant: [251, 146, 60],
  'Property listed': [52, 211, 153],
  'Off plan': [148, 163, 184],
  Ready: [148, 163, 184],
  'End user': [148, 163, 184],
};

function money(n: number | null): string {
  return n ? `AED ${n.toLocaleString()}` : '—';
}

interface BuildingGroup {
  building: string;
  bedroomGroups: { bedroomLabel: string; rows: PropertyWithRelations[] }[];
}

export async function exportAvailabilityPdf(groups: BuildingGroup[], subtitle: string) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = 297;
  const pageH = 210;
  const marginX = 14;
  const contentW = pageW - marginX * 2;
  const bottomLimit = pageH - 22;
  let y = 18;

  const bg: [number, number, number] = [13, 27, 46];
  const card: [number, number, number] = [26, 45, 71];
  const borderFaint: [number, number, number] = [47, 51, 50];
  const borderCard: [number, number, number] = [17, 30, 49];
  const textLight: [number, number, number] = [240, 230, 208];
  const textMuted: [number, number, number] = [155, 168, 184];
  const textFaint: [number, number, number] = [107, 120, 136];
  const gold: [number, number, number] = [184, 145, 68];
  const goldBright: [number, number, number] = [212, 168, 83];

  const cols = [
    { label: 'Unit', w: 20 },
    { label: 'Layout', w: 18 },
    { label: 'Beds', w: 16 },
    { label: 'Floor', w: 16 },
    { label: 'Sqft', w: 20 },
    { label: 'View', w: 45 },
    { label: 'Status', w: 32 },
    { label: 'Price', w: 48 },
    { label: 'Rent (yr)', w: 48 },
  ];
  const colX: number[] = [];
  {
    let x = marginX;
    for (const c of cols) {
      colX.push(x);
      x += c.w;
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
    y = 18;
    drawTableHeader();
  }

  function pageFooter() {
    const centerX = pageW / 2;
    const fy = pageH - 14;
    pdf.setDrawColor(...borderFaint);
    pdf.line(marginX, fy - 4, pageW - marginX, fy - 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...textFaint);
    pdf.text('Thomas King · Luxury Invest Group · +971 50 167 0251 · Thomas.king@luxuryinvestgroup.com', centerX, fy, { align: 'center' });
    pdf.text(`Page ${pdf.getNumberOfPages()}`, pageW - marginX, fy, { align: 'right' });
  }

  function drawTableHeader() {
    pdf.setFillColor(...card);
    pdf.rect(marginX, y, contentW, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...gold);
    cols.forEach((c, i) => {
      pdf.text(c.label.toUpperCase(), colX[i] + 2, y + 4.8);
    });
    y += 9;
    pdf.setFont('helvetica', 'normal');
  }

  // Cover header
  pdf.setFillColor(...bg);
  pdf.rect(0, 0, pageW, pageH, 'F');

  if (logoDataUrl) {
    const logoW = 26;
    const logoH = logoW * (2250 / 7500);
    pdf.addImage(logoDataUrl, 'PNG', marginX, y - 6, logoW, logoH);
  }
  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...goldBright);
  pdf.text('Property Availability', marginX, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...textMuted);
  pdf.text(subtitle, marginX, y);
  pdf.setFontSize(8.5);
  pdf.setTextColor(...textFaint);
  pdf.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageW - marginX, y, { align: 'right' });
  y += 9;

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

        const beds = p.property_bedroom_counts.map((b) => b.bedroom_counts.name).join(', ') || '—';
        const view = p.property_view_types.map((v) => v.view_types.name).join(', ') || '—';
        const statuses = p.property_property_statuses.map((s) => s.property_statuses.name);
        const statusText = statuses.join(', ') || '—';
        const statusColor = statuses.length ? (STATUS_COLORS[statuses[0]] ?? textMuted) : textFaint;

        pdf.setDrawColor(...borderCard);
        pdf.line(marginX, y + rowH, marginX + contentW, y + rowH);

        const baseline = y + rowH / 2 + 1.4;
        pdf.setFontSize(8);
        pdf.setTextColor(...textLight);
        pdf.text(p.unit_number ?? '—', colX[0] + 2, baseline);
        pdf.text(p.layout ?? '—', colX[1] + 2, baseline);
        pdf.text(beds, colX[2] + 2, baseline);
        pdf.text(p.floor ?? '—', colX[3] + 2, baseline);
        pdf.text(p.sqft ? p.sqft.toLocaleString() : '—', colX[4] + 2, baseline);
        pdf.setTextColor(...textMuted);
        pdf.text(pdf.splitTextToSize(view, cols[5].w - 4)[0] ?? '—', colX[5] + 2, baseline);
        pdf.setTextColor(...statusColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(pdf.splitTextToSize(statusText, cols[6].w - 4)[0] ?? '—', colX[6] + 2, baseline);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...goldBright);
        pdf.text(money(p.asking_price), colX[7] + 2, baseline);
        pdf.text(money(p.rental_income), colX[8] + 2, baseline);

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
