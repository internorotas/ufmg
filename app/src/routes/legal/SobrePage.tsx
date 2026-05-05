export function SobrePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8" aria-labelledby="sobre-title">
      <header>
        <h1 id="sobre-title" className="text-3xl font-bold text-text-primary">
          Sobre o Interno Rotas
        </h1>
        <p className="mt-2 text-text-secondary">
          Projeto colaborativo para melhorar a experiência de transporte universitário no campus Pampulha.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-text-primary">Missão</h2>
        <p className="mt-2 text-text-secondary">
          Oferecer consulta rápida de linhas e paradas, com dados resilientes mesmo em cenários de conectividade
          instável.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text-primary">Código aberto</h2>
        <p className="mt-2 text-text-secondary">
          O frontend é público e evolui por fases, com foco em acessibilidade, segurança e conformidade LGPD.
        </p>
      </section>
    </main>
  );
}
