import { useCallback } from 'preact/hooks';
import { useStore } from 'store';

export const useEntities = (entityIds: string[]) => useStore(
  useCallback(
    ({ hass }) => Object.fromEntries(
      entityIds.map(
        (id) => [id, hass?.states[id]],
      ),
    ),
    [entityIds],
  ),
);
