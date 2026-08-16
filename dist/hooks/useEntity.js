import { useStore } from '../store';
import { useCallback } from 'preact/hooks';
export const useEntity = (entityId) => useStore(useCallback(({ hass }) => hass === null || hass === void 0 ? void 0 : hass.states[entityId], [entityId]));
