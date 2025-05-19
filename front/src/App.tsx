import "./index.css";

import Mapa from "./components/Mapa/Mapa";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {
  return (
    <div>
      <div className="absolute inset-0 z-0">
        <Mapa />
      </div>
      <div className="z-10 items-center justify-center">
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
