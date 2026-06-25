import PDFParser from 'pdf2json';
import fs from 'fs';

const INPUT_FILE =
  'storage/documents/gst_schedule_goods.pdf';

const OUTPUT_FILE =
  'storage/extracted/gst_schedule_goods.json';

const parser = new PDFParser();

parser.on(
  'pdfParser_dataReady',
  pdfData => {

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(
        pdfData,
        null,
        2
      )
    );

    console.log(
      'EXTRACTED:',
      OUTPUT_FILE
    );

    console.log(
      'Pages:',
      pdfData.Pages.length
    );
  }
);

parser.on(
  'pdfParser_dataError',
  err => {
    console.error(err);
    process.exit(1);
  }
);

parser.loadPDF(INPUT_FILE);
