const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' });

export const formatDate = (isoDate: string) => dateFormat.format(new Date(isoDate));
