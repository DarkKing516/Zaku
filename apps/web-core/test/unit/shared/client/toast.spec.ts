import { toast, useToastStore } from '@/shared/client/toast';

describe('toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queues notifications and dismisses each one automatically', () => {
    toast.success('Guardado');
    toast.error('Falló');

    expect(useToastStore.getState().toasts.map(({ kind, message }) => ({ kind, message }))).toEqual([
      { kind: 'success', message: 'Guardado' },
      { kind: 'error', message: 'Falló' },
    ]);

    jest.advanceTimersByTime(5000);

    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('dismisses a single notification on demand', () => {
    toast.info('Hola');
    const [{ id }] = useToastStore.getState().toasts;

    useToastStore.getState().dismiss(id);

    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
