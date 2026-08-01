import { useStore } from '../store';

export const useConfig = () => useStore((state) => state.config);
