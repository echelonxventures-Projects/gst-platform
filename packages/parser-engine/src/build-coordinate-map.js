import fs from 'fs';

import { rateFromX }
from './rate-from-x.js';

import { extractHSNs }
from './hsn-extractor.js';

import { isValidHSN }
from './hsn-validator.js';

import { isHSNReference }
from './is-hsn-reference.js';

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const map = {};

pages.forEach(
  (page, pageIndex) => {

    page.forEach(item => {

      const text =
        item.text.trim();

      if (!text) {
        return;
      }

      if (
        isHSNReference(text)
      ) {
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
        extractHSNs(text);

      if (
        hsns.length === 0
      ) {
        return;
      }

      hsns.forEach(hsn => {

        if (
          !isValidHSN(hsn)
        ) {
          return;
        }

        if (!map[hsn]) {
          map[hsn] = [];
        }

        map[hsn].push({
          page:
            pageIndex + 1,
          rate,
          x: item.x,
          text
        });

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
  'storage/structured/coordinate_rate_map.json',
  JSON.stringify(
    map,
    null,
    2
  )
);

console.log(
  'HSNs:',
  Object.keys(map).length
);
