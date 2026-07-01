import { type FormEvent, useState } from 'react';
import { clearAdminCredentials, setAdminCredentials, verifyAdminCredentials } from '@/services/api/adminAuth';
import { AdminLayout } from './AdminLayout';

export function AdminGate() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await verifyAdminCredentials(email.trim(), token.trim());
    setLoading(false);
    if (ok) {
      setAdminCredentials(email.trim(), token.trim());
      setAuthed(true);
    } else {
      setError('Credenciais inválidas ou acesso negado.');
    }
  }

  function handleLogout() {
    clearAdminCredentials();
    setAuthed(false);
    setToken('');
  }

  if (authed) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleLogout}
          className="absolute top-2 right-3 z-50 px-2.5 py-1 text-xs rounded border border-card-border bg-card text-text-secondary hover:bg-background-secondary transition-colors"
        >
          Sair
        </button>
        <AdminLayout />
      </div>
    );
  }

  return (
    <main
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
          width: 'min(400px, 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          background: 'var(--color-card)',
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Acesso operacional</h1>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            E-mail admin
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              style={{
                height: 40,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                padding: '0 10px',
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            Token de serviço
            <input
              required
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="current-password"
              style={{
                height: 40,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                padding: '0 10px',
                fontSize: 14,
              }}
            />
          </label>

          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--color-error-text)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 40,
              borderRadius: 8,
              border: 'none',
              background: 'var(--color-brand-primary)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
