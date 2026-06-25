import { isHSNReference }
from './is-hsn-reference.js';

console.log(
  isHSNReference(
    'goods of heading 0401'
  )
);

console.log(
  isHSNReference(
    'of heading 9405'
  )
);

console.log(
  isHSNReference(
    'those of heading 9303'
  )
);

console.log(
  isHSNReference(
    '[0401]'
  )
);
