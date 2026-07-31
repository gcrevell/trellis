import { useStore } from 'store';

export const useHass = () => useStore(({ hass }) => hass);
