import path from 'path';
import { sourceRegistry } from '@gst-platform/registry-engine/sources';
import { changeDetector } from '@gst-platform/change-engine';
import { eventPublisher } from '@gst-platform/event-engine';
import { config } from '@gst-platform/core/config';
import { sourceFetcher } from './fetcher.js';

export class SourceEngine {
  async processSource(sourceCode) {
    const source = await sourceRegistry.get(sourceCode);
    
    if (!source) {
      throw new Error(`Source not found: ${sourceCode}`);
    }

    if (!source.enabled) {
      console.log(`Source disabled: ${sourceCode}`);
      return { status: 'disabled' };
    }

    console.log(`Processing source: ${source.name}`);

    const documentCode = source.configuration.document_code || sourceCode;
    
    let result;
    if (source.type === 'pdf') {
      result = await sourceFetcher.fetchPDF(source.url);
    } else if (source.type === 'json') {
      result = await sourceFetcher.fetchJSON(source.url);
    } else {
      result = await sourceFetcher.fetchHTML(source.url);
    }

    const buffer = Buffer.isBuffer(result.data) ? result.data : Buffer.from(result.data);
    const checksum = changeDetector.calculateChecksum(buffer);

    console.log(`Checksum: ${checksum}`);

    const changeResult = await changeDetector.hasChanged(documentCode, checksum);

    if (!changeResult.changed) {
      console.log('No change detected');
      await changeDetector.recordCheck(documentCode, checksum, 'no_change');
      return { status: 'no_change', checksum };
    }

    console.log(`Change detected: ${changeResult.reason}`);

    const documentsDir = config.storage.documentsPath;
    const currentFile = path.join(documentsDir, `${documentCode}.${this.getExtension(source.type)}`);
    const archiveFile = path.join(documentsDir, `${documentCode}_${checksum}.${this.getExtension(source.type)}`);

    sourceFetcher.saveToFile(buffer, currentFile);
    sourceFetcher.saveToFile(buffer, archiveFile);

    console.log(`Saved: ${currentFile}`);
    console.log(`Archived: ${archiveFile}`);

    await changeDetector.updateRegistry(sourceCode, documentCode, source.url, checksum);
    await changeDetector.recordCheck(documentCode, checksum, 'changed');

    await eventPublisher.publishSourceChanged(sourceCode, documentCode, checksum);

    console.log('Source processed successfully');

    return {
      status: 'changed',
      checksum,
      documentCode,
      currentFile,
      archiveFile
    };
  }

  async processAllSources() {
    const sources = await sourceRegistry.list(true);
    const results = [];

    for (const source of sources) {
      try {
        const result = await this.processSource(source.code);
        results.push({ source: source.code, ...result });
      } catch (error) {
        console.error(`Error processing source ${source.code}:`, error.message);
        results.push({ source: source.code, status: 'error', error: error.message });
      }
    }

    return results;
  }

  getExtension(type) {
    const extensions = {
      pdf: 'pdf',
      json: 'json',
      html: 'html',
      csv: 'csv',
      excel: 'xlsx'
    };
    return extensions[type] || 'txt';
  }
}

export const sourceEngine = new SourceEngine();
