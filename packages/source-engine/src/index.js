import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { checksum } from './checksum.js';
import { db } from './db.js';

const SOURCE_CODE = 'cbic';
const DOCUMENT_CODE = 'gst_schedule_goods';

const SOURCE_URL =
  'https://cbic-gst.gov.in/pdf/chapter-wise-rate-wise-gst-schedule-18.05.2017.pdf';

async function run() {

  console.log('GST Source Engine');

  const response = await axios.get(
    SOURCE_URL,
    {
      responseType: 'arraybuffer',
      timeout: 120000
    }
  );

  const buffer = Buffer.from(response.data);

  const hash = checksum(buffer);

  console.log('Checksum:', hash);

  const documentDir = './storage/documents';

  fs.mkdirSync(
    documentDir,
    { recursive: true }
  );

  const currentFile = path.join(
    documentDir,
    `${DOCUMENT_CODE}.pdf`
  );

  const archiveFile = path.join(
    documentDir,
    `${DOCUMENT_CODE}_${hash}.pdf`
  );

  const existing = await db.query(
    `
    SELECT latest_checksum
    FROM source.document_registry
    WHERE document_code = $1
    `,
    [DOCUMENT_CODE]
  );

  if (
    existing.rows.length > 0 &&
    existing.rows[0].latest_checksum === hash
  ) {

    console.log('NO CHANGE');

    await db.query(
      `
      UPDATE source.document_registry
      SET last_checked = now()
      WHERE document_code = $1
      `,
      [DOCUMENT_CODE]
    );

    return;
  }

  console.log('CHANGE DETECTED');

  fs.writeFileSync(
    currentFile,
    buffer
  );

  fs.writeFileSync(
    archiveFile,
    buffer
  );

  console.log('Saved:', currentFile);
  console.log('Archived:', archiveFile);

  await db.query(
    `
    INSERT INTO source.fetch_history
    (
      source_id,
      checksum,
      status
    )
    VALUES
    (
      NULL,
      $1,
      'changed'
    )
    `,
    [hash]
  );

  await db.query(
    `
    INSERT INTO source.document_registry
    (
      source_code,
      document_code,
      document_url,
      latest_checksum,
      last_checked,
      last_changed
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      now(),
      now()
    )
    ON CONFLICT (document_code)
    DO UPDATE
    SET
      document_url = EXCLUDED.document_url,
      latest_checksum = EXCLUDED.latest_checksum,
      last_checked = now(),
      last_changed = now()
    `,
    [
      SOURCE_CODE,
      DOCUMENT_CODE,
      SOURCE_URL,
      hash
    ]
  );

  console.log('REGISTRY UPDATED');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
