import Sidebar from "@/components/Sidebar/Sidebar";
import Mapa from "@/components/Mapa/Mapa";

export default function Home() {
  return (
    <>
      <div className="relative h-full w-full">
        <Sidebar />
      </div>
      <div className="absolute top-0 left-0 z-10 h-full w-full">
        <Mapa />
      </div>
    </>
  );
}
