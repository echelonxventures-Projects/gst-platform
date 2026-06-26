import fs from 'fs';
import PDFParser from 'pdf2json';
import { db } from '@gst-platform/core/db';
import { validateHSN, normalizeHSN, validateGSTRate } from '@gst-platform/core/validators';
import { eventPublisher } from '@gst-platform/event-engine';

export class HSNParser {
  async parsePDF(filePath) {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', reject);
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        resolve(pdfData);
      });
      
      pdfParser.loadPDF(filePath);
    });
  }

  extractTextFromPDF(pdfData) {
    const pages = [];
    
    for (const page of pdfData.Pages) {
      const texts = page.Texts.map(t => 
        decodeURIComponent(t.R[0].T)
      );
      pages.push(texts.join(' '));
    }
    
    return pages;
  }

  parseHSNFromText(text) {
    const entries = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const hsnMatch = line.match(/^(\d{2,8})/);
      if (!hsnMatch) continue;

      const hsnCode = normalizeHSN(hsnMatch[1]);
      if (!validateHSN(hsnCode)) continue;

      let description = line.replace(hsnMatch[0], '').trim();
      
      const rateMatch = line.match(/(\d+(?:\.\d+)?)\s*%/g);
      let igst = null, cgst = null, sgst = null;

      if (rateMatch) {
        const rates = rateMatch.map(r => parseFloat(r.replace('%', '')));
        if (rates.length >= 1) igst = rates[0];
        if (rates.length >= 2) cgst = rates[0] / 2;
        if (rates.length >= 2) sgst = rates[0] / 2;
      }

      if (description.length < 3) {
        if (i + 1 < lines.length) {
          description = lines[i + 1];
        }
      }

      entries.push({
        hsn_code: hsnCode,
        description: description.substring(0, 500),
        cgst,
        sgst,
        igst,
        cess: null
      });
    }

    return entries;
  }

  async parseAndStore(filePath, sourceId, documentCode) {
    console.log(`Parsing PDF: ${filePath}`);

    const pdfData = await this.parsePDF(filePath);
    const pages = this.extractTextFromPDF(pdfData);
    const allText = pages.join('\n');

    const entries = this.parseHSNFromText(allText);
    console.log(`Extracted ${entries.length} HSN entries`);

    let stored = 0;
    for (const entry of entries) {
      if (!validateGSTRate(entry.igst)) continue;

      try {
        await db.query(
          `INSERT INTO gst.hsn_master 
           (hsn_code, description, cgst, sgst, igst, cess, source_id, effective_date, notification_no)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (hsn_code, source_id) DO UPDATE
           SET description = EXCLUDED.description,
               cgst = EXCLUDED.cgst,
               sgst = EXCLUDED.sgst,
               igst = EXCLUDED.igst,
               cess = EXCLUDED.cess,
               updated_at = now()`,
          [
            entry.hsn_code,
            entry.description,
            entry.cgst,
            entry.sgst,
            entry.igst,
            entry.cess,
            sourceId,
            '2017-07-01',
            '1/2017'
          ]
        );
        stored++;
      } catch (error) {
        console.error(`Error storing HSN ${entry.hsn_code}:`, error.message);
      }
    }

    console.log(`Stored ${stored} HSN entries`);

    await eventPublisher.publishParsingCompleted(documentCode, stored);
    await eventPublisher.publishDocumentProcessed(documentCode, 'completed', { entriesCount: stored });

    return { parsed: entries.length, stored };
  }

  async parseCSV(filePath, sourceId) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => row[h] = values[idx]);
      
      const hsnCode = normalizeHSN(row.hsn || row.hsn_code || row.code);
      if (!validateHSN(hsnCode)) continue;

      entries.push({
        hsn_code: hsnCode,
        description: row.description || row.desc || '',
        cgst: parseFloat(row.cgst) || null,
        sgst: parseFloat(row.sgst) || null,
        igst: parseFloat(row.igst) || null,
        cess: parseFloat(row.cess) || null
      });
    }

    return entries;
  }
}

export const hsnParser = new HSNParser();
