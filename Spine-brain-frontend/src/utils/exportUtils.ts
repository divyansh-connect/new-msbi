import { jsPDF } from 'jspdf';

export const generatePDFReport = (
  title: string,
  subtitle: string = 'Midwest Spine & Brain Institute — Marketing Operations CRM Report',
  tableData?: { headers: string[]; rows: (string | number)[][] }
) => {
  const doc = new jsPDF();

  // Header Banner Background (#1D3A46)
  doc.setFillColor(29, 58, 70);
  doc.rect(0, 0, 210, 32, 'F');

  // Header Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MIDWEST SPINE & BRAIN INSTITUTE', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Marketing Operations CRM Executive Report', 14, 23);

  // Document Title
  doc.setTextColor(29, 58, 70);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 120, 123);
  doc.text(subtitle, 14, 52);

  // Metadata Timestamp & Scope
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(9);
  doc.text(`Generated Date: ${now} | Scope: Midwest Spine & Brain Institute Operations`, 14, 60);

  // Divider Line
  doc.setDrawColor(205, 228, 232);
  doc.setLineWidth(0.5);
  doc.line(14, 64, 196, 64);

  let startY = 74;

  // Table Data Rendering
  if (tableData && tableData.headers && tableData.rows) {
    // Table Header Background
    doc.setFillColor(230, 240, 243);
    doc.rect(14, startY - 6, 182, 10, 'F');

    doc.setTextColor(29, 58, 70);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const colWidth = 182 / tableData.headers.length;
    tableData.headers.forEach((header, colIdx) => {
      doc.text(header.toUpperCase(), 16 + colIdx * colWidth, startY);
    });

    startY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    tableData.rows.forEach((row, rowIdx) => {
      if (rowIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, startY - 5, 182, 8, 'F');
      }
      row.forEach((cell, colIdx) => {
        const cellText = String(cell);
        doc.text(cellText.substring(0, 25), 16 + colIdx * colWidth, startY);
      });
      startY += 8;

      // Page overflow check
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }
    });
  } else {
    // Default Performance Metrics Table if no specific data passed
    const defaultMetrics = [
      ['Metric Indicator', 'Target Goal', 'Current Performance', 'Variance Status'],
      ['Inbound Patient Leads', '1,000 Leads', '1,248 Leads', '+24.8% (Exceeded)'],
      ['Qualified Surgery Consults', '350 Consults', '412 Consults', '+17.7% (Exceeded)'],
      ['Blended Campaign Net ROI', '250.0%', '324.0%', '+74.0% Net Return'],
      ['Average Cost Per Lead (CPL)', '$55.00', '$47.85', '-$7.15 Efficiency Gain'],
    ];

    defaultMetrics.forEach((row, rowIdx) => {
      if (rowIdx === 0) {
        doc.setFillColor(230, 240, 243);
        doc.rect(14, startY - 5, 182, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 58, 70);
      } else {
        if (rowIdx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, startY - 5, 182, 8, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
      }

      doc.text(row[0], 16, startY);
      doc.text(row[1], 75, startY);
      doc.text(row[2], 120, startY);
      doc.text(row[3], 160, startY);
      startY += rowIdx === 0 ? 10 : 8;
    });
  }

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential — Midwest Spine & Brain Institute Marketing Operations CRM System', 14, 285);

  // Trigger Real Browser File Download
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_report.pdf`;
  doc.save(filename);
};

/**
 * Neutralizes potential CSV/Formula Injection attacks.
 * If a cell string starts with '=', '+', '-', '@', '\t', '\r',
 * prepend a single quote (') so spreadsheet applications treat the value as literal text.
 */
export const sanitizeCsvCell = (val: string | number): string => {
  if (typeof val === 'number') return String(val);
  const str = String(val ?? '');
  const trimmed = str.trimStart();
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
    return `'${str}`;
  }
  return str;
};

export const generateCSVExport = (
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) => {
  const sanitizedHeaders = headers.map((h) => `"${sanitizeCsvCell(h).replace(/"/g, '""')}"`).join(',');
  const sanitizedRows = rows.map((rowArray) =>
    rowArray.map((item) => `"${sanitizeCsvCell(item).replace(/"/g, '""')}"`).join(',')
  );

  const csvString = [sanitizedHeaders, ...sanitizedRows].join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', objectUrl);
  link.setAttribute('download', `${filename.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Safe cleanup of temporary object URL to prevent memory leaks
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export const generateExcelExport = (
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) => {
  generateCSVExport(`${filename}_excel_sheet`, headers, rows);
};
