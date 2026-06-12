import { store } from 'store';
import { useCallback } from 'preact/hooks';

export const useEntity = (entityId: string) => store(
  useCallback(
    ({ hass }) => hass?.states[entityId],
    [entityId],
  ),
);
