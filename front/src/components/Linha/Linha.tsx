// interface LinhaProps {
//   numeroLinha: number;
// }

export default function Linha() {
  
  const numeroLinha = 1;

  return (
    <div className="flex flex-col text-center m-4 p-4">
      <button className="text-2xl font-bold p-6 bg-amber-700 w-full rounded-4xl">Linha {numeroLinha}</button>

      <div className="text-base flex justify-between items-center px-10">
        <div className="text-center">
          <p>Anterior</p>
          <p>20:00</p>
        </div>
        <div className="text-center">
          <p>Próximo</p>
          <p>20:40</p>
        </div>
      </div>
     
      <div>
        <button>Mais horários</button>
      </div>
      <div>itinerario</div>
      <div>horarios</div>
    </div>
  );
}
