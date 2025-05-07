// App.tsx
import "./index.css";
import Mapa from "./components/Mapa/Mapa";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {
  return (
    <div className="relative h-screen w-screen">
      {/* Header flutuante */}
      <header className="fixed top-4 left-4 w-[30%] z-50 bg-internoRotas-azul-eletrico rounded-2xl p-2 shadow-lg text-center p-4 flex justify-center items-center">
        <img
          src="src/assets/logo-horizontal-transparente.svg"
          alt="Logo do Interno Rotas"
          width={150}
          height={60}
        />
      </header>

      {/* Sidebar fixa */}
      <Sidebar />

      {/* Mapa ocupando toda a tela */}
      <div className="absolute top-0 left-0 z-10 h-full w-full">
        <Mapa />
      </div>

      {/* Footer fixo na parte inferior */}
      <footer className="fixed bottom-4 left-4 w-[30%] z-50 bg-internoRotas-preto-carvao text-internoRotas-bege-areia p-4 rounded-2xl shadow-lg text-center">
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

export default App;
