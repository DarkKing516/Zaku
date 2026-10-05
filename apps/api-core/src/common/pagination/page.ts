export interface PageRequest {
  readonly page: number;
  readonly pageSize: number;
}

export class Page<TItem> {
  constructor(
    readonly items: readonly TItem[],
    readonly page: number,
    readonly pageSize: number,
    readonly totalItems: number,
  ) {}

  static offsetOf(request: PageRequest): number {
    return (request.page - 1) * request.pageSize;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  map<TMapped>(mapItem: (item: TItem) => TMapped): Page<TMapped> {
    return new Page(this.items.map(mapItem), this.page, this.pageSize, this.totalItems);
  }
}
