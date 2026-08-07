import { type ChangeEvent, forwardRef, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { inputVariants } from './Input';

/**
 * Interpreta um texto digitado/colado em reais (BRL) e devolve o valor em
 * centavos inteiros — nunca em float. Aceita pt-BR e o ponto decimal simples
 * por compatibilidade: "10", "10,5", "10,50", "10.50", "R$ 10,50",
 * "1.234,56". Formatos com mais de duas casas ou ponto ambíguo são rejeitados.
 *
 * Retorna `null` para qualquer entrada não numérica, negativa ou vazia —
 * nunca lança, o chamador decide o que fazer com `null` (campo inválido).
 */
export function parseAmountToCents(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;

  s = s.replace(/^R\$\s*/i, '').replace(/\s+/g, '');
  if (!s || !/^\d[\d.,]*$/.test(s)) return null;

  let wholePart = s;
  let fractionPart = '';

  if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length !== 2 || !parts[1] || parts[1].length > 2) return null;
    [wholePart, fractionPart] = parts;
    if (!/^\d+$/.test(fractionPart)) return null;
  } else if (s.includes('.')) {
    const parts = s.split('.');
    const lastPart = parts[parts.length - 1] ?? '';
    if (parts.length === 2 && lastPart.length <= 2) {
      [wholePart, fractionPart] = parts;
      if (!fractionPart) return null;
    } else if (parts.length > 2 && parts.slice(1).every((part) => part.length === 3)) {
      wholePart = parts.join('');
    } else {
      // "1.234" pode ser milhar ou três casas decimais; não adivinhar.
      return null;
    }
  }

  if (wholePart.includes('.')) {
    const thousandGroups = wholePart.split('.');
    if (
      thousandGroups.length < 2 ||
      !/^\d{1,3}$/.test(thousandGroups[0] ?? '') ||
      !thousandGroups.slice(1).every((part) => /^\d{3}$/.test(part))
    ) {
      return null;
    }
    wholePart = thousandGroups.join('');
  }

  if (!/^\d+$/.test(wholePart)) return null;
  const normalizedCents = `${wholePart}${fractionPart.padEnd(2, '0')}`;
  try {
    const cents = BigInt(normalizedCents);
    return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
  } catch {
    return null;
  }
}

/** Formata centavos inteiros como texto BRL sem o símbolo de moeda (ex: 123456 → "1.234,56"). */
export function formatCentsAsAmountText(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface CurrencyInputProps {
  id?: string;
  valueCents: number | null;
  onValueCentsChange: (cents: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
  required?: boolean;
}

/**
 * Input de valor monetário: `type="text"` + `inputMode="decimal"`, fonte de
 * verdade sempre em centavos inteiros (nunca float). Nunca reformata durante
 * a digitação — só no blur — para nunca deslocar o cursor no meio da frase.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    {
      id,
      valueCents,
      onValueCentsChange,
      placeholder,
      disabled,
      error,
      className,
      required,
      ...ariaProps
    },
    ref,
  ) {
    const [displayValue, setDisplayValue] = useState<string>(() =>
      valueCents !== null ? formatCentsAsAmountText(valueCents) : '',
    );
    // Rastreia o último valor emitido por ESTE input — distingue "o valor
    // mudou porque o usuário digitou" de "mudou porque veio de fora" (ex.:
    // clique num valor sugerido), que é quando de fato queremos resincronizar
    // o texto exibido. Sem isso, cada tecla reformataria o texto e o cursor
    // pularia para o fim a cada dígito.
    const lastEmittedRef = useRef<number | null>(valueCents);

    useEffect(() => {
      if (valueCents !== lastEmittedRef.current) {
        lastEmittedRef.current = valueCents;
        setDisplayValue(valueCents !== null ? formatCentsAsAmountText(valueCents) : '');
      }
    }, [valueCents]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const raw = event.target.value;
      setDisplayValue(raw);

      if (raw.trim() === '') {
        lastEmittedRef.current = null;
        onValueCentsChange(null);
        return;
      }

      const cents = parseAmountToCents(raw);
      lastEmittedRef.current = cents;
      onValueCentsChange(cents);
    }

    function handleBlur() {
      if (lastEmittedRef.current !== null) {
        setDisplayValue(formatCentsAsAmountText(lastEmittedRef.current));
      }
    }

    return (
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={error || undefined}
        className={cn(inputVariants({ error }), className)}
        {...ariaProps}
      />
    );
  },
);
