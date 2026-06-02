/**
 * Render consolidated Markdown report to PDF (updated in place each merge).
 */
import path from 'node:path';
import { mdToPdf } from 'md-to-pdf';

/**
 * @param {object} opts
 * @param {string} opts.mdPath absolute path to .md
 * @param {string} opts.pdfPath absolute path to .pdf
 * @returns {Promise<{ pdfPath: string }>}
 */
export async function renderConsolidatedReportPdf(opts) {
  const { mdPath, pdfPath } = opts;
  await mdToPdf(
    { path: mdPath },
    {
      dest: pdfPath,
      basedir: path.dirname(mdPath),
      document_title: 'Consolidated API performance',
      pdf_options: {
        format: 'A4',
        landscape: true,
        margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' },
        printBackground: true,
      },
      css: `
        body { font-family: system-ui, Segoe UI, sans-serif; font-size: 11px; }
        table { font-size: 8px; border-collapse: collapse; width: 100%; table-layout: fixed; word-break: break-word; }
        th, td { padding: 4px 6px; vertical-align: top; }
        h1 { font-size: 18px; }
        h2 { font-size: 14px; margin-top: 1.2em; page-break-after: avoid; }
        h3 { font-size: 12px; margin-top: 1em; page-break-after: avoid; }
        tr { page-break-inside: avoid; }
      `,
      launch_options: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    },
  );
  return { pdfPath };
}
