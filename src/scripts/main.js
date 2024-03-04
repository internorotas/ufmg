import data from "./dadosLinhas.js";
import exibeLinha from "./map.js";

const ferias = {
  inicio: "December 16, 2023",
  fim: "March 05, 2024",
};

const bottomSheet = createDraggableBottomSheet();

console.log(data);

function imprimeLinhas(data, idContainer) {
  let containerLinhas = document.getElementById(idContainer);
  let conteudoLinhas = "";

  for (let i = 0; i < data.length; i++) {
    if (data[i].sublinha == null) {
      conteudoLinhas += `
        <section class="linha" id="linha-${data[i].tipo}">
          <Button id="linha">${data[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhas += `
        <section class="linha" id="linha-${data[i].tipo}">
          <Button>${data[i].nome}<p>${data[i].sublinha}</p></Button>
        </section>
      `;
    }

    conteudoLinhas += `
      <div class="exibir-horario">
        <div class="horario-atual">
          <div class="anterior">
            <p>Anterior</p>
            <p>${retornaHorarioAnterior(i, idContainer)}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${retornaProximoHorario(i, idContainer)}</p>
          </div>
        </div>

        <div class="container-buttons">
          <button class="mostrar-itinerario">itinerário</button>
          <button class="mais-horarios">mais horários</button>
        </div>

        <div class="itinerario-interno escondido">
    `;

    for (let j = 0; j < data[i].itinerario.length; j++) {
      conteudoLinhas += ` 
            <li>${data[i].itinerario[j]}</li>
      `;
    }

    conteudoLinhas += `
        </div>

        <div class="horarios-interno escondido">
    `;

    for (let j = 0; j < data[i].horarios.length; j++) {
      conteudoLinhas += ` 
            <li>${data[i].horarios[j]}</li>
      `;
    }

    conteudoLinhas += `
        </div>
      </div>
    `;
  }

  // coloca a variável no HTML da página
  containerLinhas.innerHTML = conteudoLinhas;
}

imprimeLinhas(data.diasUteis, "container-linhas-dias-uteis");
imprimeLinhas(data.sabado, "container-linhas-sabado");
imprimeLinhas(data.feriasRecessos, "container-linhas-ferias-recessos");

// pega todos os botões da página
let botoesLinha = document.querySelectorAll(".linha");

// percorre por todos os botões da página
for (let i = 0; i < botoesLinha.length; i++) {
  // adiciona um Event Listener em cada um deles
  botoesLinha[i].addEventListener("click", function () {
    // exibeHorario(i);
    exibeLinha(i);
    bottomSheet.resetSheetPosition();
  });
}

// pega todos os botões da página
let botoesItinerario = document.getElementsByClassName("mostrar-itinerario");

// percorre por todos os botões da página
for (let i = 0; i < botoesItinerario.length; i++) {
  // adiciona um Event Listener em cada um deles
  botoesItinerario[i].addEventListener("click", function () {
    exibeItinerario(i);
  });
}

function toggleVisibility(element) {
  if (element.classList.contains("escondido")) {
    element.classList.remove("escondido");
    element.classList.add("aparecido");
  } else {
    element.classList.remove("aparecido");
    element.classList.add("escondido");
  }
}

function exibeItinerario(posicaoBotao) {
  const containerItinerario =
    document.getElementsByClassName("itinerario-interno");
  toggleVisibility(containerItinerario[posicaoBotao]);
}

const botaoReportarProblema = document.getElementById("reportar-problema");
botaoReportarProblema.addEventListener("click", function () {
  const containerAvisoProblema = document.getElementById(
    "container-problema-links"
  );
  toggleVisibility(containerAvisoProblema);
});

const botoesHorarios = document.getElementsByClassName("mais-horarios");
for (let i = 0; i < botoesHorarios.length; i++) {
  botoesHorarios[i].addEventListener("click", function () {
    const containerHorarios =
      document.getElementsByClassName("horarios-interno");
    toggleVisibility(containerHorarios[i]);
  });
}

function retornaHorarioAnterior(posicao, itinerarioChamado) {
  let horarioAnterior;
  let itinerario = verificaDia();

  if (itinerario == "util") {
    if (itinerarioChamado == "container-linhas-dias-uteis") {
      for (let i = data.diasUteis[posicao].horarios.length - 1; i >= 0; i--) {
        horarioAnterior = compararHorarioAnterior(
          data.diasUteis[posicao].horarios[i]
        );
        if (horarioAnterior != "-") {
          break;
        }
      }
    } else {
      horarioAnterior = "-";
    }
  } else if (itinerario == "sab") {
    if (itinerarioChamado == "container-linhas-sabado") {
      for (let i = data.sabado[posicao].horarios.length - 1; i >= 0; i--) {
        horarioAnterior = compararHorarioAnterior(
          data.sabado[posicao].horarios[i]
        );
        if (horarioAnterior != "-") {
          break;
        }
      }
    } else {
      horarioAnterior = "-";
    }
  } else if (itinerario == "ferias") {
    if (itinerarioChamado == "container-linhas-ferias-recessos") {
      for (
        let i = data.feriasRecessos[posicao].horarios.length - 1;
        i >= 0;
        i--
      ) {
        horarioAnterior = compararHorarioAnterior(
          data.feriasRecessos[posicao].horarios[i]
        );
        if (horarioAnterior != "-") {
          break;
        }
      }
    } else {
      horarioAnterior = "-";
    }
  } else {
    horarioAnterior = "-";
  }

  return horarioAnterior;
}

// Verifica se o horário passado por parâmetro é o do próximo ônibus
function compararHorarioAnterior(horario) {
  let horas = horario.split(":");

  let agora = new Date();

  let comparado = new Date();

  comparado.setHours(horas[0]);
  comparado.setMinutes(horas[1]);

  if (comparado < agora) {
    return horario;
  } else {
    return "-";
  }
}

function retornaProximoHorario(posicao, itinerarioChamado) {
  let proximoHorario;
  let itinerario = verificaDia();

  if (itinerario == "util") {
    if (itinerarioChamado == "container-linhas-dias-uteis") {
      for (let i = 0; i < data.diasUteis[posicao].horarios.length; i++) {
        proximoHorario = compararProximoHorario(
          data.diasUteis[posicao].horarios[i]
        );
        if (proximoHorario != "-") {
          break;
        }
      }
    } else {
      proximoHorario = "-";
    }
  } else if (itinerario == "sab") {
    if (itinerarioChamado == "container-linhas-sabado") {
      for (let i = 0; i < data.sabado[posicao].horarios.length; i++) {
        proximoHorario = compararProximoHorario(
          data.sabado[posicao].horarios[i]
        );
        if (proximoHorario != "-") {
          break;
        }
      }
    } else {
      proximoHorario = "-";
    }
  } else if (itinerario == "ferias") {
    if (itinerarioChamado == "container-linhas-ferias-recessos") {
      for (let i = 0; i < data.feriasRecessos[posicao].horarios.length; i++) {
        proximoHorario = compararProximoHorario(
          data.feriasRecessos[posicao].horarios[i]
        );
        if (proximoHorario != "-") {
          break;
        }
      }
    } else {
      proximoHorario = "-";
    }
  } else {
    proximoHorario = "-";
  }

  return proximoHorario;
}

// Verifica se o horário passado por parâmetro é o do próximo ônibus
function compararProximoHorario(horario) {
  let horas = horario.split(":");

  let agora = new Date();

  let comparado = new Date();

  comparado.setHours(horas[0]);
  comparado.setMinutes(horas[1]);

  if (comparado > agora) {
    return horario;
  } else {
    return "-";
  }
}

function verificaDia() {
  let dataAtual = new Date();
  let diaSemana = dataAtual.getDay();
  let feriasInicio = new Date().setDate([ferias[0]]);
  let feriasFim = new Date().setDate([ferias[1]]);
  // verifica se é dia útil
  if (diaSemana > 0 && diaSemana < 6) {
    // verifica se está no período de férias
    if (dataAtual > feriasInicio) {
      return "util";
    } else {
      return "ferias";
    }
  }
  // se for sábado e não for férias, exibe o horário
  else if (diaSemana == 6) {
    // verifica se está no período de férias
    if (dataAtual < feriasInicio) {
      return "sab";
    }
  }
  // se não existir horários para o dia retorna um traço para não dar erro e
  // nem mostrar horários incorretos
  else {
    return "-";
  }
}

// function ajustaBottomPadding() {
//   // obtém a altura da barra de navegação do dispositivo
//   let navBarHeight = window.innerHeight - document.documentElement.clientHeight;

//   // ajusta o padding-bottom do elemento principal
//   const main = document.querySelector("main");

//   console.log(navBarHeight);

//   if (navBarHeight < 100) {
//     navBarHeight = 120;
//   }
//   main.style.paddingBottom = navBarHeight + "px";
// }

// ajustaBottomPadding();

// // const bottomSheet = createDraggableBottomSheet();

// Adicionar o evento de arrastar a uma outra alça
document
  .querySelector("#handler-mobile")
  .addEventListener("mousedown", bottomSheet.dragStart);
document.querySelector("body").addEventListener("mouseup", bottomSheet.dragEnd);
document.querySelector("body").addEventListener("mousemove", bottomSheet.drag);

function createDraggableBottomSheet() {
  const bottomSheet = document.querySelector("#menu-lateral");
  const handle = document.querySelector("#handler-mobile");
  let currentY;
  let initialY;
  let yOffset = 0;
  let limite = -window.innerHeight / 2;

  function resetSheetPosition() {
    setTranslate(0, bottomSheet, 0);
    currentY = 0;
    initialY = 0;
    yOffset = 0;
  }

  function dragStart(event) {
    initialY = event.touches[0].clientY - yOffset;
  }

  function dragEnd() {
    initialY = currentY;
  }

  function drag(event) {
    if (!event.touches || event.touches.length === 0) {
      return;
    }

    currentY = event.touches[0].clientY - initialY;
    const windowHeight = window.innerHeight;
    const bottomSheetRect = bottomSheet.getBoundingClientRect();
    if (
      currentY > -bottomSheetRect.height &&
      currentY < windowHeight - bottomSheetRect.top &&
      currentY > limite
    ) {
      yOffset = currentY;
      setTranslate(currentY, bottomSheet);
    }
    setScroll(currentY);
  }

  function setScroll(currentY) {
    // Confere e a BottomSheet chegou no topo para habilitar scroll
    if (currentY > limite) {
      bottomSheet.style.overflowY = "hidden";
    } else {
      bottomSheet.style.overflowY = "auto";
    }
  }

  function setTranslate(yPos, el) {
    el.style.transition = "transform 0.2s ease-out";
    el.style.transform = `translate3d(0, ${yPos}px, 0)`;
  }

  handle.addEventListener("touchstart", dragStart);
  handle.addEventListener("touchend", dragEnd);
  handle.addEventListener("touchmove", drag);

  return {
    dragStart,
    dragEnd,
    drag,
    resetSheetPosition,
  };
}
