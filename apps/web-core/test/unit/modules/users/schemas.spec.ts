import { usersPageQuerySchema } from '@/modules/users/schemas';

describe('usersPageQuerySchema', () => {
  it.each([
    [{}, 1],
    [{ page: '3' }, 3],
    [{ page: '0' }, 1],
    [{ page: 'abc' }, 1],
    [{ page: ['2', '5'] }, 1],
    [{ page: '99999' }, 1],
  ])('reads %p as page %p', (searchParams, expected) => {
    expect(usersPageQuerySchema.parse(searchParams).page).toBe(expected);
  });
});
