import { useCallback } from 'preact/hooks';
import { useStore } from '../store';
export const useEntities = (entityIds) => useStore(useCallback(({ hass }) => Object.fromEntries(entityIds.map((id) => [id, hass === null || hass === void 0 ? void 0 : hass.states[id]])), [entityIds]));
