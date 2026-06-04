import { createContext, type ReactNode, useContext } from 'react';
import {
  type UseLocalizacaoUsuarioReturn,
  useLocalizacaoUsuario,
} from '@/hooks/useLocalizacaoUsuario';

const LocationContext = createContext<UseLocalizacaoUsuarioReturn | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const value = useLocalizacaoUsuario();
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): UseLocalizacaoUsuarioReturn {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be inside LocationProvider');
  return ctx;
}
