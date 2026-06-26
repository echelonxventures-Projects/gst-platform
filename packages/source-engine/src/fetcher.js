import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class SourceFetcher {
  async fetch(url, options = {}) {
    const response = await axios.get(url, {
      responseType: options.binary ? 'arraybuffer' : 'text',
      timeout: options.timeout || 120000,
      headers: options.headers || {}
    });

    return {
      data: options.binary ? Buffer.from(response.data) : response.data,
      headers: response.headers,
      status: response.status
    };
  }

  async fetchPDF(url) {
    return this.fetch(url, { binary: true });
  }

  async fetchHTML(url) {
    return this.fetch(url, { binary: false });
  }

  async fetchJSON(url) {
    const result = await this.fetch(url, { binary: false });
    return {
      ...result,
      data: JSON.parse(result.data)
    };
  }

  saveToFile(buffer, filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
  }

  async fetchAndSave(url, filePath, options = {}) {
    const result = await this.fetch(url, options);
    this.saveToFile(result.data, filePath);
    return result;
  }
}

export const sourceFetcher = new SourceFetcher();
