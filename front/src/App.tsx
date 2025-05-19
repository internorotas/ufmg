import "./index.css";

import Mapa from "./components/Mapa/Mapa";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {
  return (
    <div className="flex h-screen">
      <div className="w-[30%] h-full">
      <Sidebar />
      </div>
      <div className="w-[70%] h-full">
      <Mapa />
      </div>
    </div>
  );
}

export default App;
