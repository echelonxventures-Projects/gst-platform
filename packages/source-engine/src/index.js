import axios from 'axios';
import { checksum } from './checksum.js';
import { db } from './db.js';

const SOURCE_URL =
'https://cbic-gst.gov.in/pdf/chapter-wise-rate-wise-gst-schedule-18.05.2017.pdf';

async function run() {

  console.log('GST Source Engine');

  const response = await axios.get(
    SOURCE_URL,
    {
      responseType: 'arraybuffer'
    }
  );

  const buffer = Buffer.from(response.data);

  const hash = checksum(buffer);

  console.log('Checksum:', hash);

  const existing =
  await db.query(
    `
    select latest_checksum
    from source.document_registry
    where document_code=$1
    `,
    ['gst_schedule_goods']
  );

  if (
    existing.rows.length &&
    existing.rows[0].latest_checksum === hash
  ) {
    console.log('NO CHANGE');
    process.exit(0);
  }

  console.log('CHANGE DETECTED');

  await db.query(
    `
    insert into source.fetch_history
    (
      source_id,
      checksum,
      status
    )
    values
    (
      null,
      $1,
      'changed'
    )
    `,
    [hash]
  );

  await db.query(
    `
    insert into source.document_registry
    (
      source_code,
      document_code,
      document_url,
      latest_checksum,
      last_checked,
      last_changed
    )
    values
    (
      'cbic',
      'gst_schedule_goods',
      $1,
      $2,
      now(),
      now()
    )
    on conflict do nothing
    `,
    [SOURCE_URL, hash]
  );

  console.log('RECORDED');
}

run()
.then(() => process.exit(0))
.catch(err => {
  console.error(err);
  process.exit(1);
});
