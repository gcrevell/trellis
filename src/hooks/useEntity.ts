import { useStore } from '../store';
import { useCallback } from 'preact/hooks';

export const useEntity = (entityId: string) => useStore(
  useCallback(
    ({ hass }) => hass?.states[entityId],
    [entityId],
  ),
);
