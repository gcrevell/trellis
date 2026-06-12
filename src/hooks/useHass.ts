import { store } from 'store';

export const useHass = () => store(({ hass }) => hass);
