import { store } from 'store';

export const useConfig = () => store((state) => state.config);
