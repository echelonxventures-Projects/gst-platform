import fs from 'fs';
import { rateFromX } from './rate-from-x.js';
import { extractHSNs } from './hsn-extractor.js';
import { isValidHSN } from './hsn-validator.js';

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const entries = [];

pages.forEach(
  (page, pageIndex) => {

    page.forEach(item => {

      const text =
        item.text.trim();

      if (!text) {
        return;
      }

      const rate =
        rateFromX(item.x);

      if (
        rate === null
      ) {
        return;
      }

      const hsns =
        extractHSNs(text)
          .filter(
            isValidHSN
          );

      if (
        hsns.length === 0
      ) {
        return;
      }

      entries.push({
        page:
          pageIndex + 1,
        rate,
        hsns,
        text
      });

    });

  }
);

fs.mkdirSync(
  'storage/structured',
  {
    recursive: true
  }
);

fs.writeFileSync(
  'storage/structured/schedule_entries.json',
  JSON.stringify(
    entries,
    null,
    2
  )
);

console.log(
  'Entries:',
  entries.length
);
