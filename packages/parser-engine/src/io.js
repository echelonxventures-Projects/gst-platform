import fs from 'node:fs';

export function readJson(file) {

  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );

}

export function writeJson(
  file,
  data
) {

  fs.writeFileSync(
    file,
    JSON.stringify(
      data,
      null,
      2
    )
  );

}

export function ensureDirectory(dir) {

  fs.mkdirSync(
    dir,
    {
      recursive: true
    }
  );

}
