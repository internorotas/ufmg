import "./index.css";
import Mapa from "./components/Mapa/Mapa";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {
  return (
    <div className="relative h-screen w-screen">
      {/* Sidebar fixa sobre o mapa */}
      <div className="fixed top-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Mapa ocupando toda a tela */}
      <div className="absolute top-0 left-0 z-10 h-full w-full">
        <Mapa />
      </div>
    </div>
  );
}

export default App;
