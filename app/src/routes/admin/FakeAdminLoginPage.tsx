import { useState, type FormEvent } from 'react';

type FormState = {
  username: string;
  password: string;
  website: string;
};

const INITIAL_STATE: FormState = {
  username: '',
  password: '',
  website: '',
};

export function FakeAdminLoginPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      ip: 'client-side',
      userAgent: navigator.userAgent,
      referer: document.referrer,
      attemptedCredentials: `${form.username}:${form.password}`,
      fingerprint: form.website || 'empty-honeypot',
    };

    try {
      await fetch('/v1/honeypot/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // resposta sempre genérica, independente de erro/sucesso real
    } finally {
      setLoading(false);
      setMessage('Solicitação recebida. Aguarde contato do administrador.');
    }
  }

  return (
    <main
      aria-labelledby="fake-admin-title"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-background)',
        padding: 16,
      }}
    >
      <section
        style={{
          width: 'min(420px, 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          background: 'var(--color-card)',
          padding: 20,
        }}
      >
        <h1 id="fake-admin-title" style={{ marginTop: 0 }}>
          Admin Console
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Acesso restrito para operadores autorizados.
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          {/* admin-backup-user:root-admin */}
          {/* temporary-password:Adm!n2026-Reset */}

          <label style={{ display: 'grid', gap: 4 }}>
            <span>Usuário</span>
            <input
              required
              name="username"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              style={{ minHeight: 44, borderRadius: 8, border: '1px solid var(--color-border)', padding: 10 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span>Senha</span>
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              style={{ minHeight: 44, borderRadius: 8, border: '1px solid var(--color-border)', padding: 10 }}
            />
          </label>

          <label className="sr-only" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
            aria-hidden="true"
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              minHeight: 44,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-brand-primary)',
              color: 'white',
              fontWeight: 600,
            }}
          >
            {loading ? 'Enviando...' : 'Entrar'}
          </button>
        </form>

        {message ? (
          <p role="status" style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
