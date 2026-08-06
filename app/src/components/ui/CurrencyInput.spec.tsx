// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrencyInput, formatCentsAsAmountText, parseAmountToCents } from './CurrencyInput';

describe('parseAmountToCents', () => {
  it.each([
    ['10', 1000],
    ['10,5', 1050],
    ['10,50', 1050],
    ['10.50', 1050],
    ['R$ 10,50', 1050],
    ['1.234,56', 123456],
    ['0,01', 1],
    ['  15  ', 1500],
  ])('parseia "%s" para %i centavos', (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    '-10',
    'abc',
    'R$ -5',
    Number.NaN.toString(),
  ])('retorna null para entrada inválida: "%s"', (input) => {
    expect(parseAmountToCents(input)).toBeNull();
  });

  it('nunca lança exceção para entrada arbitrária', () => {
    expect(() => parseAmountToCents('###!!!')).not.toThrow();
    expect(parseAmountToCents('###!!!')).toBeNull();
  });
});

describe('formatCentsAsAmountText', () => {
  it('formata centavos como texto BRL sem símbolo de moeda', () => {
    expect(formatCentsAsAmountText(1050)).toBe('10,50');
    expect(formatCentsAsAmountText(123456)).toBe('1.234,56');
    expect(formatCentsAsAmountText(1)).toBe('0,01');
  });
});

describe('CurrencyInput', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  function getInput(): HTMLInputElement {
    const input = container.querySelector('input');
    if (!input) throw new Error('input não encontrado');
    return input;
  }

  function typeValue(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('nunca reformata durante a digitação — texto exibido é exatamente o digitado', async () => {
    const onValueCentsChange = vi.fn();
    await act(async () => {
      root.render(<CurrencyInput valueCents={null} onValueCentsChange={onValueCentsChange} />);
    });

    const input = getInput();
    await act(async () => {
      typeValue(input, '1');
    });
    expect(input.value).toBe('1');

    await act(async () => {
      typeValue(input, '15');
    });
    expect(input.value).toBe('15');

    await act(async () => {
      typeValue(input, '15,5');
    });
    expect(input.value).toBe('15,5');
    expect(onValueCentsChange).toHaveBeenLastCalledWith(1550);
  });

  it('formata no blur, sem alterar o valor emitido', async () => {
    const onValueCentsChange = vi.fn();
    await act(async () => {
      root.render(<CurrencyInput valueCents={null} onValueCentsChange={onValueCentsChange} />);
    });

    const input = getInput();
    await act(async () => {
      typeValue(input, '10.5');
    });
    expect(onValueCentsChange).toHaveBeenLastCalledWith(1050);

    await act(async () => {
      // React 17+ delega blur via 'focusout' (bubbling) — 'blur' puro não
      // dispara o onBlur do componente em jsdom.
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });
    expect(input.value).toBe('10,50');
  });

  it('permite apagar tudo sem reinserir valor sozinho', async () => {
    const onValueCentsChange = vi.fn();
    await act(async () => {
      root.render(<CurrencyInput valueCents={1000} onValueCentsChange={onValueCentsChange} />);
    });

    const input = getInput();
    expect(input.value).toBe('10,00');

    await act(async () => {
      typeValue(input, '');
    });
    expect(input.value).toBe('');
    expect(onValueCentsChange).toHaveBeenLastCalledWith(null);
  });

  it('aceita colagem de valor completo com prefixo R$ e milhar', async () => {
    const onValueCentsChange = vi.fn();
    await act(async () => {
      root.render(<CurrencyInput valueCents={null} onValueCentsChange={onValueCentsChange} />);
    });

    const input = getInput();
    await act(async () => {
      typeValue(input, 'R$ 1.234,56');
    });
    expect(onValueCentsChange).toHaveBeenLastCalledWith(123456);
  });

  it('resincroniza o texto exibido quando valueCents muda por fonte externa (ex: preset)', async () => {
    const onValueCentsChange = vi.fn();
    let props = { valueCents: null as number | null, onValueCentsChange };
    await act(async () => {
      root.render(<CurrencyInput {...props} />);
    });

    const input = getInput();
    await act(async () => {
      typeValue(input, '20');
    });
    expect(input.value).toBe('20');

    props = { valueCents: 500, onValueCentsChange };
    await act(async () => {
      root.render(<CurrencyInput {...props} />);
    });
    expect(input.value).toBe('5,00');
  });

  it('marca aria-invalid quando error=true', async () => {
    await act(async () => {
      root.render(<CurrencyInput valueCents={null} onValueCentsChange={vi.fn()} error />);
    });

    expect(getInput().getAttribute('aria-invalid')).toBe('true');
  });
});
