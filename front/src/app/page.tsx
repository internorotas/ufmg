import Sidebar from "@/components/Sidebar/Sidebar";
import Mapa from "@/components/Mapa/Mapa";
import "@/app/globals.css";

export default function Home() {
  return (
    <div className="relative h-screen w-screen">
      <Sidebar />
      <div className="absolute top-0 left-0 z-10 h-full w-full">
        <Mapa />
      </div>
    </div>
  );
}
