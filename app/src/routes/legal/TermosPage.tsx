export function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8" aria-labelledby="termos-title">
      <header>
        <h1 id="termos-title" className="text-3xl font-bold text-text-primary">
          Termos de Uso
        </h1>
        <p className="mt-2 text-text-secondary">
          Estes termos definem as condições para uso do aplicativo Interno Rotas.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-text-primary">Uso responsável</h2>
        <p className="mt-2 text-text-secondary">
          O serviço é voltado ao apoio de deslocamento no campus. Informações podem variar conforme trânsito e
          colaboração dos usuários.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text-primary">Disponibilidade</h2>
        <p className="mt-2 text-text-secondary">
          O app pode operar em modo degradado offline, usando cache local, sem garantia de atualização em tempo real.
        </p>
      </section>
    </main>
  );
}
