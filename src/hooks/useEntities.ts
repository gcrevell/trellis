import { useCallback } from 'preact/hooks';
import { store } from 'store';

export const useEntities = (entityIds: string[]) => store(
  useCallback(
    ({ hass }) => Object.fromEntries(
      entityIds.map(
        (id) => [id, hass?.states[id]],
      ),
    ),
    [entityIds],
  ),
);
