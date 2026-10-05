import { DataSource } from 'typeorm';

export class LazyDataSource {
  private connection?: Promise<DataSource>;

  constructor(private readonly open: () => Promise<DataSource>) {}

  get(): Promise<DataSource> {
    this.connection ??= this.open().catch((error: unknown) => {
      this.connection = undefined;
      throw error;
    });
    return this.connection;
  }

  get isOpenOrOpening(): boolean {
    return this.connection !== undefined;
  }

  async destroy(): Promise<void> {
    const connection = this.connection;
    this.connection = undefined;
    const dataSource = await connection?.catch(() => undefined);
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  }
}
