import { useCallback } from 'preact/hooks';
import { store } from 'store';

export const useUser = () => {
  const user = store((state) => state.hass?.user);
  const entity = store(useCallback(
    ({ hass }) => (
      user
        ? Object.values(hass?.states).find(({ attributes }) => attributes?.user_id === user.id)
        : undefined
    ),
    [user],
  ));

  return {
    ...user,
    entity,
  };
};
