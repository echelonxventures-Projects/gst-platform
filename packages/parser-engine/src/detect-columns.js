export const COLUMNS = [
  {
    index: 0,
    rate: 0,
    minX: 10,
    maxX: 18
  },
  {
    index: 1,
    rate: 5,
    minX: 18,
    maxX: 25
  },
  {
    index: 2,
    rate: 12,
    minX: 25,
    maxX: 33
  },
  {
    index: 3,
    rate: 18,
    minX: 33,
    maxX: 41
  },
  {
    index: 4,
    rate: 28,
    minX: 41,
    maxX: Number.POSITIVE_INFINITY
  }
];

export function detectColumns(page) {

  return COLUMNS.map(column => {

    const items = page.filter(item =>
      item.x >= column.minX &&
      item.x < column.maxX
    );

    return {
      ...column,
      items
    };

  });

}
