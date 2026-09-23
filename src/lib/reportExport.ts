import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } from 'docx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ReportTable = { nombre?: string; columnas: string[]; filas: (string | number | null)[][] };
export type Report = { titulo: string; descripcion?: string; tablas: ReportTable[] };

const REPORT_RE = /```informe\s*([\s\S]*?)```/;

export function extractReport(text: string): { clean: string; report: Report | null; pending: boolean } {
  const m = text.match(REPORT_RE);
  if (!m) {
    const idx = text.indexOf('```informe');
    return idx >= 0 ? { clean: text.slice(0, idx), report: null, pending: true } : { clean: text, report: null, pending: false };
  }
  let report: Report | null = null;
  try {
    const r = JSON.parse(m[1]);
    if (r && Array.isArray(r.tablas)) report = { titulo: String(r.titulo || 'Informe'), descripcion: r.descripcion, tablas: r.tablas.filter((t: any) => Array.isArray(t?.columnas) && Array.isArray(t?.filas)) };
  } catch { /* ignore */ }
  return { clean: text.replace(REPORT_RE, '').trim(), report, pending: false };
}

const fileBase = (r: Report) => (r.titulo || 'informe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '_').slice(0, 60) || 'informe';
const cell = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function toExcel(r: Report) {
  const wb = XLSX.utils.book_new();
  r.tablas.forEach((t, i) => {
    const ws = XLSX.utils.aoa_to_sheet([t.columnas, ...t.filas]);
    ws['!cols'] = t.columnas.map((c, ci) => ({ wch: Math.min(40, Math.max(c.length, ...t.filas.map((f) => cell(f[ci]).length)) + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, (t.nombre || `Hoja ${i + 1}`).replace(/[\\/?*[\]:]/g, '').slice(0, 31) || `Hoja ${i + 1}`);
  });
  XLSX.writeFile(wb, `${fileBase(r)}.xlsx`);
}

export function toCSV(r: Report) {
  const esc = (v: unknown) => `"${cell(v).replace(/"/g, '""')}"`;
  const parts = r.tablas.map((t) => [t.nombre ? esc(t.nombre) : null, t.columnas.map(esc).join(';'), ...t.filas.map((f) => f.map(esc).join(';'))].filter(Boolean).join('\n'));
  download(new Blob(['\ufeff' + parts.join('\n\n')], { type: 'text/csv;charset=utf-8' }), `${fileBase(r)}.csv`);
}

export async function toWord(r: Report) {
  const children: (Paragraph | Table)[] = [new Paragraph({ text: r.titulo, heading: HeadingLevel.TITLE })];
  if (r.descripcion) children.push(new Paragraph({ text: r.descripcion }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Generado el ${new Date().toLocaleDateString('es-AR')} — Campus Duomo`, italics: true, size: 18 })] }));
  r.tablas.forEach((t) => {
    if (t.nombre) children.push(new Paragraph({ text: t.nombre, heading: HeadingLevel.HEADING_2 }));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: t.columnas.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: true })] })] })) }),
        ...t.filas.map((f) => new TableRow({ children: t.columnas.map((_, i) => new TableCell({ children: [new Paragraph(cell(f[i]))] })) })),
      ],
    }));
    children.push(new Paragraph(''));
  });
  const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
  download(blob, `${fileBase(r)}.docx`);
}

export function toPDF(r: Report) {
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text(r.titulo, 14, 18);
  let y = 26;
  doc.setFontSize(10);
  if (r.descripcion) { const lines = doc.splitTextToSize(r.descripcion, 180); doc.text(lines, 14, y); y += lines.length * 5 + 2; }
  doc.setTextColor(120); doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} — Campus Duomo`, 14, y); doc.setTextColor(0); y += 6;
  r.tablas.forEach((t) => {
    if (t.nombre) { doc.setFontSize(12); doc.text(t.nombre, 14, y + 4); y += 7; }
    autoTable(doc, { startY: y, head: [t.columnas], body: t.filas.map((f) => t.columnas.map((_, i) => cell(f[i]))), headStyles: { fillColor: [139, 154, 125] }, styles: { fontSize: 9 } });
    y = (doc as any).lastAutoTable.finalY + 10;
  });
  doc.save(`${fileBase(r)}.pdf`);
}
