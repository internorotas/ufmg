const PT_BR_DATE: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const PT_BR_DATETIME: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDateTimePtBr(value: string): string {
  return new Date(value).toLocaleString('pt-BR', PT_BR_DATETIME);
}

export function formatDatePtBr(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', PT_BR_DATE);
}

export function formatConsent(consentAt: string | null): string {
  if (!consentAt) return 'Não concedido';
  return formatDateTimePtBr(consentAt);
}
