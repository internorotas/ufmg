import Linha from "../Linha/Linha";

export default function Sidebar() {
  return (
    <div className="fixed top-0 left-0 h-full w-72 bg-internoRotas-preto-carvao text-white shadow-lg z-50 rounded-r-4xl flex flex-col overflow-hidden">
      <header className="w-full bg-internoRotas-azul-eletrico rounded-tr-2xl p-4 shadow-lg text-center flex justify-center items-center">
        <img
          src="src/assets/logo-horizontal-transparente.svg"
          alt="Logo do Interno Rotas"
          width={150}
          height={60}
        />
      </header>

      <nav className="py-4 flex-1 overflow-y-auto">
        <div>
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
          <Linha numeroLinha={1} />
        </div>
      </nav>

      <footer className="w-full bg-internoRotas-preto-carvao text-internoRotas-bege-areia p-4 rounded-br-2xl shadow-lg text-center">
        <a
          href="https://github.com/igormartins4"
          target="_blank"
          rel="noopener noreferrer"
          className="text-internoRotas-bege-areia"
        >
          <p className="text-sm font-semibold">
            Desenvolvido com 💙 por Igor Martins
          </p>
        </a>
      </footer>
    </div>
  );
}
