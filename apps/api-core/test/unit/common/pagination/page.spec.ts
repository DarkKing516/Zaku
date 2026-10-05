import { Page } from '@common/pagination/page';

describe('Page', () => {
  it('computes total pages rounding up', () => {
    expect(new Page([1, 2], 1, 2, 5).totalPages).toBe(3);
  });

  it('reports zero pages when there are no items', () => {
    expect(new Page([], 1, 20, 0).totalPages).toBe(0);
  });

  it('maps items preserving pagination data', () => {
    const mapped = new Page([1, 2], 2, 2, 4).map((value) => `#${value}`);

    expect(mapped.items).toEqual(['#1', '#2']);
    expect(mapped).toMatchObject({ page: 2, pageSize: 2, totalItems: 4 });
  });

  it('computes the offset of a page request', () => {
    expect(Page.offsetOf({ page: 3, pageSize: 10 })).toBe(20);
  });
});
