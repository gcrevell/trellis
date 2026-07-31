import { useCallback } from 'preact/hooks';
import { useStore } from 'store';

export const useUser = () => {
  const user = useStore((state) => state.hass?.user);
  const entity = useStore(useCallback(
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
