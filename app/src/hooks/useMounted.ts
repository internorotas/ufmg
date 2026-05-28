import { useCallback, useEffect, useRef } from 'react';

/**
 * Retorna função estável que indica se o componente ainda está montado.
 * Substitui o padrão `let active = true` em efeitos assíncronos.
 */
export function useMounted(): () => boolean {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return useCallback(() => mountedRef.current, []);
}
