import { FaPlus } from "react-icons/fa6";

interface LinhaProps {
  numeroLinha: number;
}

export default function Linha({ numeroLinha }: LinhaProps) {
  return (
    <section className="flex flex-col text-center m-0 p-4 text-internoRotas-bege-areia">
      <button className="text-2xl font-bold p-2 bg-amber-700 w-full rounded-2xl">
        Linha {numeroLinha}
      </button>

      <div className="text-base flex justify-between items-center px-10 bg-internoRotas-cinza-grafite mt-1 p-2 rounded-2xl font-bold">
        <div className="text-center">
          <p className="text-sm">Anterior</p>
          <p className="text-xl">20:00</p>
        </div>
        <div className="text-center">
          <p className="text-sm">Próximo</p>
          <p className="text-xl">20:40</p>
        </div>
      </div>

      <a className="mt-1 p-2 bg-transparent border-1 rounded-2xl flex items-center justify-center">
        <button className="font-bold text-lg flex items-center gap-2">
          <FaPlus  className="text-lg" />
          <span>mais horários</span>
        </button>
      </a>
    </section>
  );
}
