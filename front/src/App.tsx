import "./index.css";

import Mapa from "./components/Mapa/Mapa";
import Sidebar from "./components/Sidebar/Sidebar";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <div>
      <div className="absolute inset-0 z-0">
        <Mapa />
      </div>
      <div className="z-10 items-center justify-center">
        <Header />

        <Sidebar />

        <Footer />
      </div>
    </div>
  );
}

export default App;

{
  /* 
  <div className="relative z-10 flex flex-col flex-grow w-full">
  <div className="w-full">
    <Header />
  </div>

  <div className="flex-grow flex items-center justify-center">
    <Sidebar />
  </div>

  <Footer />
</div>; 
*/
}
