/**
 * Utility to generate and trigger print/save as PDF for approved match releases
 * Designed strictly adhering to NikaahKaro Design System:
 * Emerald Green (#064E3B), Warm Neutral background, Plus Jakarta Sans typography.
 */

function formatFieldPathLabel(path: string): string {
  if (!path) return 'Field';
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];
  
  const customLabels: Record<string, string> = {
    full_name: 'Full Name',
    phone: 'Phone Number',
    primary_phone: 'Phone Number',
    date_of_birth: 'Date of Birth',
    marital_status: 'Marital Status',
    number_of_children: 'No. of Children',
    height_cm: 'Height (cm)',
    weight_kg: 'Weight (kg)',
    complexion: 'Complexion',
    has_disability: 'Disability Status',
    qualification: 'Qualification',
    field_of_study: 'Field of Study',
    job_title: 'Job Title',
    monthly_income_min: 'Monthly Income',
    religion_id: 'Religion',
    sect_id: 'Sect',
    caste_id: 'Caste',
    mother_tongue_id: 'Mother Tongue',
    current_city_id: 'Current City',
    permanent_city_id: 'Permanent City',
    house_status: 'House Status',
    family_setup: 'Family Setup',
    social_background: 'Social Background',
    religious_practice: 'Religious Practice',
    beard: 'Beard',
    hijab: 'Hijab',
    smoking: 'Smoking'
  };

  if (customLabels[lastPart]) {
    return customLabels[lastPart];
  }

  return lastPart
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function formatFieldValue(val: any, path?: string): string {
  if (val === null || val === undefined || val === '') return 'N/A';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') {
    // Check if ISO date string
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      } catch {
        // ignore
      }
    }
    return val;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return 'None';
    if (path && path.includes('education_records')) {
      return val.map((item: any) => [item.qualification, item.institution_name].filter(Boolean).join(' - ') || 'Education Record').join(', ');
    }
    if (path && path.includes('employment_records')) {
      return val.map((item: any) => [item.job_title, item.organization_name].filter(Boolean).join(' at ') || 'Employment Record').join(', ');
    }
    return val.map(item => typeof item === 'object' ? (item.name || item.title || item.qualification || item.job_title || 'Record') : String(item)).join(', ');
  }
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(val);
}

import { jsPDF } from 'jspdf';
import { filterAndFormatReleaseFields } from './formatReleaseFields';
import { useReferenceDataStore } from '@/lib/stores/reference-data-store';

export async function generateReleasedProfilesPDF(data: {
  sourceProfile: any;
  agent: any;
  releases: any[];
  requestId?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const refStore = useReferenceDataStore.getState();
  if (!refStore.isLoaded && !refStore.isLoading) {
    try {
      await refStore.loadAll();
    } catch {
      // ignore
    }
  }

  const clientName = data.sourceProfile?.full_name || 'Client Profile';
  const clientPhone = data.sourceProfile?.phone || 'N/A';
  const clientLocation = data.sourceProfile?.location || 'N/A';
  const clientDob = data.sourceProfile?.date_of_birth
    ? new Date(data.sourceProfile.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const clientStatus = data.sourceProfile?.marital_status ? data.sourceProfile.marital_status.replace(/_/g, ' ') : 'N/A';
  const agentName = data.agent?.full_name || 'Assigned Agent';
  const agentPhone = data.agent?.phone || 'N/A';
  const releases = data.releases || [];
  const releaseCount = releases.length;
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 182mm
  const maxY = pageHeight - 18; // Leave 18mm for bottom footer

  let currentY = 16;

  // Helper function to draw page header
  const drawPageHeader = (isFirstPage: boolean) => {
    // Brand Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(6, 78, 59); // Emerald
    doc.text('Nikaah', marginX, currentY + 6);
    const nikaahWidth = doc.getTextWidth('Nikaah');

    doc.setTextColor(200, 106, 74); // Terra cotta
    doc.text('Karo', marginX + nikaahWidth, currentY + 6);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(141, 140, 134); // Muted
    doc.text('Confidential Matrimonial Match Release Snapshot', marginX, currentY + 11);

    // Verified badge on top right
    const badgeText = 'VERIFIED RELEASE';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const badgeTextWidth = doc.getTextWidth(badgeText);
    const badgeW = badgeTextWidth + 8;
    const badgeH = 5.5;
    const badgeX = marginX + contentWidth - badgeW;
    const badgeY = currentY + 1;

    doc.setFillColor(6, 78, 59);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2.5, 2.5, 'F');
    doc.setTextColor(250, 248, 245);
    doc.text(badgeText, badgeX + 4, badgeY + 3.8);

    // Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(141, 140, 134);
    const dateText = `Date: ${todayStr}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, marginX + contentWidth - dateWidth, currentY + 11);

    // Green separator line
    currentY += 14;
    doc.setDrawColor(6, 78, 59);
    doc.setLineWidth(0.6);
    doc.line(marginX, currentY, marginX + contentWidth, currentY);
    currentY += 5;
  };

  // Draw Page 1 Header
  drawPageHeader(true);

  // Client & Agent Overview Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(234, 226, 213);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 3, 3, 'FD');

  const overviewY = currentY + 5;
  const colW = contentWidth / 4;

  const overviewFields = [
    { label: 'TARGET CLIENT', val: clientName, sub: clientStatus },
    { label: 'CONTACT PHONE', val: clientPhone, sub: `DOB: ${clientDob}` },
    { label: 'ASSIGNED AGENT', val: agentName, sub: agentPhone !== 'N/A' ? `Tel: ${agentPhone}` : '' },
    { label: 'CITY / LOCATION', val: clientLocation, sub: '' }
  ];

  overviewFields.forEach((item, idx) => {
    const xPos = marginX + 4 + (idx * colW);
    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(141, 140, 134);
    doc.text(item.label, xPos, overviewY);

    // Main Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 59, 52);
    const truncatedVal = doc.splitTextToSize(item.val, colW - 6)[0] || item.val;
    doc.text(truncatedVal, xPos, overviewY + 5);

    // Subtext if any
    if (item.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(141, 140, 134);
      doc.text(item.sub, xPos, overviewY + 9.5);
    }
  });

  currentY += 28;

  // Section Heading
  doc.setFillColor(200, 106, 74);
  doc.rect(marginX, currentY, 1.8, 4.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 78, 59);
  doc.text(`APPROVED MATCH CANDIDATES (${releaseCount})`, marginX + 4, currentY + 3.8);

  currentY += 8;

  // Draw Candidate Cards
  releases.forEach((rel, relIdx) => {
    const candName = rel.candidate?.full_name || `Candidate Profile #${relIdx + 1}`;
    const scoreVal = rel.score !== undefined && rel.score !== null ? `${rel.score}% Compatibility` : 'Released Match';
    const fields: Array<{ field_path: string; field_value: any }> = rel.fields || [];

    // Pre-calculate field items and row heights (filtered for gender/marital status and resolved IDs)
    const formattedFields = filterAndFormatReleaseFields(rel.fields || [], {
      gender: rel.candidate?.gender,
      marital_status: rel.candidate?.marital_status,
      full_name: rel.candidate?.full_name
    }).map(f => ({
      label: f.label,
      rawVal: f.value
    }));

    const fieldColW = (contentWidth - 14) / 2; // 84mm each
    const fieldRows: Array<{ left: any; right?: any; height: number }> = [];

    for (let i = 0; i < formattedFields.length; i += 2) {
      const left = formattedFields[i];
      const right = formattedFields[i + 1];

      // Measure height needed for values
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const leftLines = doc.splitTextToSize(left.rawVal, fieldColW - 6);
      const rightLines = right ? doc.splitTextToSize(right.rawVal, fieldColW - 6) : [];

      const maxLines = Math.max(leftLines.length, rightLines.length, 1);
      const rowH = Math.max(12, 6.5 + (maxLines * 3.8) + 2);

      fieldRows.push({ left, right, height: rowH });
    }

    const headerHeight = 11;
    const fieldsTotalHeight = fieldRows.reduce((acc, r) => acc + r.height + 2.5, 0);
    const cardPaddingBottom = 4;
    const totalCardHeight = headerHeight + (fieldsTotalHeight > 0 ? fieldsTotalHeight : 8) + cardPaddingBottom;

    // Check if card fits on current page
    if (currentY + totalCardHeight > maxY) {
      doc.addPage();
      currentY = 16;
      drawPageHeader(false);

      // Section continuation indicator
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(141, 140, 134);
      doc.text(`APPROVED MATCH CANDIDATES (CONT.)`, marginX, currentY);
      currentY += 5;
    }

    const cardStartY = currentY;

    // Card Background Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(234, 226, 213);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, cardStartY, contentWidth, totalCardHeight, 3.5, 3.5, 'FD');

    // Candidate Header: Index circle + Name
    const headerY = cardStartY + 3.5;

    // Index Pill
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(234, 226, 213);
    doc.roundedRect(marginX + 4, headerY, 6, 6, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 78, 59);
    doc.text(String(relIdx + 1), marginX + 5.8, headerY + 4.2);

    // Candidate Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(6, 78, 59);
    doc.text(candName, marginX + 13, headerY + 4.5);

    // Score Badge on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const scoreTextWidth = doc.getTextWidth(scoreVal);
    const scoreW = scoreTextWidth + 7;
    const scoreH = 5.5;
    const scoreX = marginX + contentWidth - scoreW - 4;

    doc.setFillColor(234, 245, 237); // Soft light green
    doc.setDrawColor(196, 227, 204);
    doc.roundedRect(scoreX, headerY + 0.3, scoreW, scoreH, 2.5, 2.5, 'FD');
    doc.setTextColor(6, 78, 59);
    doc.text(scoreVal, scoreX + 3.5, headerY + 4);

    // Subtle divider inside card
    doc.setDrawColor(242, 238, 232);
    doc.setLineWidth(0.25);
    doc.line(marginX + 4, cardStartY + headerHeight, marginX + contentWidth - 4, cardStartY + headerHeight);

    // Render Fields
    let fieldY = cardStartY + headerHeight + 3;

    if (fieldRows.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(141, 140, 134);
      doc.text('No individual fields recorded in release snapshot.', marginX + 5, fieldY + 3);
    } else {
      fieldRows.forEach(row => {
        // Draw Left Field Box
        const leftX = marginX + 4;
        doc.setFillColor(250, 248, 245);
        doc.setDrawColor(239, 233, 223);
        doc.roundedRect(leftX, fieldY, fieldColW, row.height, 2, 2, 'FD');

        // Left Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(141, 140, 134);
        doc.text(row.left.label.toUpperCase(), leftX + 3, fieldY + 3.8);

        // Left Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(31, 59, 52);
        const leftLines = doc.splitTextToSize(row.left.rawVal, fieldColW - 6);
        leftLines.forEach((line: string, lineIdx: number) => {
          doc.text(line, leftX + 3, fieldY + 7.5 + (lineIdx * 3.8));
        });

        // Draw Right Field Box if available
        if (row.right) {
          const rightX = marginX + 4 + fieldColW + 6;
          doc.setFillColor(250, 248, 245);
          doc.setDrawColor(239, 233, 223);
          doc.roundedRect(rightX, fieldY, fieldColW, row.height, 2, 2, 'FD');

          // Right Label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(141, 140, 134);
          doc.text(row.right.label.toUpperCase(), rightX + 3, fieldY + 3.8);

          // Right Value
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(31, 59, 52);
          const rightLines = doc.splitTextToSize(row.right.rawVal, fieldColW - 6);
          rightLines.forEach((line: string, lineIdx: number) => {
            doc.text(line, rightX + 3, fieldY + 7.5 + (lineIdx * 3.8));
          });
        }

        fieldY += row.height + 2.5;
      });
    }

    currentY += totalCardHeight + 5;
  });

  // Stamp Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    const footerY = pageHeight - 8;
    doc.setDrawColor(234, 226, 213);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 3, marginX + contentWidth, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(141, 140, 134);
    doc.text('STRICTLY CONFIDENTIAL • Authorized matrimonial snapshot • NikaahKaro CRM', marginX, footerY);

    const pageNumText = `Page ${p} of ${totalPages}`;
    const pageNumWidth = doc.getTextWidth(pageNumText);
    doc.text(pageNumText, marginX + contentWidth - pageNumWidth, footerY);
  }

  // Safe file naming & trigger instant download
  const safeClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `NikaahKaro_Release_${safeClientName}.pdf`;

  doc.save(filename);
}
