import { sessionAlert, useSessionAlertStore } from '@/shared/client/session-alert';

describe('sessionAlert', () => {
  it('opens an alert with its reason and clears it on dismiss', () => {
    sessionAlert.show('FORBIDDEN', 'Sin permisos');

    expect(useSessionAlertStore.getState()).toMatchObject({ reason: 'FORBIDDEN', message: 'Sin permisos' });

    useSessionAlertStore.getState().dismiss();

    expect(useSessionAlertStore.getState()).toMatchObject({ reason: null, message: undefined });
  });
});
