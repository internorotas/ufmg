interface LinhaProps {
  numeroLinha: number;
}

interface CardComunicadoProps {
  item: ComunicadoItem;
}

export default function Linha(data:LinhaProps, props: any) {
  // Aqui você pode usar o número da linha passado como prop  
  const numeroLinha = 1;

  return (
    <div className="flex flex-col text-center m-4 p-4">
      <button className="text-2xl font-bold p-4 bg-amber-700 w-full rounded-2xl">Linha {numeroLinha}</button>

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
        <button>Itinerário</button>
        <button>Mais horários</button>
      </div>
      <div>itinerario</div>
      <div>horarios</div>
    </div>
  );
}
