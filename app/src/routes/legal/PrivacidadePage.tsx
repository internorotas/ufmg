export function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8" aria-labelledby="privacidade-title">
      <header>
        <h1 id="privacidade-title" className="text-3xl font-bold text-text-primary">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-text-secondary">
          Explicamos em linguagem simples como coletamos, usamos e protegemos seus dados no Interno Rotas.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-text-primary">Dados de localização</h2>
        <p className="mt-2 text-text-secondary">
          A localização é usada para melhorar a previsão de chegada e o acompanhamento colaborativo. Dados sensíveis
          são protegidos e tratados com minimização.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text-primary">Seus direitos (LGPD)</h2>
        <p className="mt-2 text-text-secondary">
          Você pode solicitar acesso, correção e exclusão dos seus dados, conforme a LGPD.
        </p>
      </section>
    </main>
  );
}
