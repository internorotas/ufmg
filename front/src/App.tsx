import Mapa from "./components/Mapa/Mapa";
import Sidebar from "./components/Sidebar/Sidebar";

import '@fontsource/poppins/100.css';
import '@fontsource/poppins/200.css';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/poppins/900.css';

import "./index.css";

export default function App() {
  return (
    <div className="relative h-screen w-screen">
      <Sidebar />
      <div className="absolute top-0 left-0 z-10 h-full w-full">
        <Mapa />
      </div>
    </div>
  );
}
