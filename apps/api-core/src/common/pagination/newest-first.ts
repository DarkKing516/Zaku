export interface Chronological {
  readonly id: string;
  readonly createdAt: Date;
}

export function newestFirst(left: Chronological, right: Chronological): number {
  const byCreation = right.createdAt.getTime() - left.createdAt.getTime();
  if (byCreation !== 0) {
    return byCreation;
  }
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}
