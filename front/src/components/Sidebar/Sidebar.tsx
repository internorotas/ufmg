import Linha from "../Linha/Linha";

export default function Sidebar() {
  return (
    <div className="fixed top-20 left-4 h-[calc(100%-10rem)] w-full bg-internoRotas-preto-carvao text-white shadow-lg z-50 rounded-4xl flex flex-col overflow-hidden">
      {/* Navigation */}
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
    </div>
  );
}
