import data from "./dadosLinhas.js";
import exibeLinha from "./map.js";

const ferias = {
  inicio: "December 23, 2022",
  fim: "March 6, 2023",
};

console.log(data);

function imprimeLinhasDiasUteis() {
  let containerLinhasDiasUteis = document.getElementById(
    "container-linhas-dias-uteis"
  );
  let conteudoLinhasDiasUteis = "";

  for (let i = 0; i < data.diasUteis.length; i++) {
    if (data.diasUteis[i].sublinha == null) {
      conteudoLinhasDiasUteis += `
        <section class="linha" id="linha-${data.diasUteis[i].tipo}">
          <Button id="linha">${data.diasUteis[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhasDiasUteis += `
        <section class="linha" id="linha-${data.diasUteis[i].tipo}">
          <Button>${data.diasUteis[i].nome}<p>${data.diasUteis[i].sublinha}</p></Button>
        </section>
      `;
    }

    conteudoLinhasDiasUteis += `
      <div class="exibir-horario">
        <div class="horario-atual">
          <div class="anterior">
            <p>Anterior</p>
            <p>${retornaHorarioAnterior(i, "uteis")}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${retornaProximoHorario(i, "uteis")}</p>
            </div>
            </div>
    
            <div class="container-buttons">
              <button class="mostrar-itinerario">itinerário</button>
              <button class="mais-horarios">mais horários</button>
            </div>
    
            <div class="itinerario-interno escondido">
        `;

    for (let j = 0; j < data.diasUteis[i].itinerario.length; j++) {
      conteudoLinhasDiasUteis += ` 
                <li>${data.diasUteis[i].itinerario[j]}</li>
          `;
    }

    conteudoLinhasDiasUteis += `
            </div>
    
              <div class="horarios-interno escondido">
        `;

    for (let j = 0; j < data.diasUteis[i].horarios.length; j++) {
      conteudoLinhasDiasUteis += ` 
                <li>${data.diasUteis[i].horarios[j]}</li>
          `;
    }

    conteudoLinhasDiasUteis += `
            </div>
          </div>
        `;
  }

  // coloca a variável no HTML da página
  containerLinhasDiasUteis.innerHTML = conteudoLinhasDiasUteis;

  imprimeLinhasSabado();
  imprimeLinhasFeriasRecessos();
}

imprimeLinhasDiasUteis();

function imprimeLinhasSabado() {
  let containerLinhasSabado = document.getElementById(
    "container-linhas-sabado"
  );
  let conteudoLinhasSabado = "";

  for (let i = 0; i < data.sabado.length; i++) {
    if (data.sabado[i].sublinha == null) {
      conteudoLinhasSabado += `
        <section class="linha" id="linha-${data.sabado[i].tipo}">
          <Button id="linha">${data.sabado[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhasSabado += `
        <section class="linha" id="linha-${data.sabado[i].tipo}">
          <Button>${data.sabado[i].nome}<p>${data.sabado[i].sublinha}</p></Button>
        </section>
      `;
    }

    conteudoLinhasSabado += `
      <div class="exibir-horario">
        <div class="horario-atual">
          <div class="anterior">
            <p>Anterior</p>
            <p>${retornaHorarioAnterior(i, "sabado")}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${retornaProximoHorario(i, "sabado")}</p>
          </div>
          </div>

          <div class="container-buttons">
            <button class="mostrar-itinerario">itinerário</button>
            <button class="mais-horarios">mais horários</button>
          </div>
  
          <div class="itinerario-interno escondido">
      `;

    for (let j = 0; j < data.sabado[i].itinerario.length; j++) {
      conteudoLinhasSabado += ` 
              <li>${data.sabado[i].itinerario[j]}</li>
        `;
    }

    conteudoLinhasSabado += `
          </div>
  
            <div class="horarios-interno escondido">
      `;

    for (let j = 0; j < data.sabado[i].horarios.length; j++) {
      conteudoLinhasSabado += ` 
              <li>${data.sabado[i].horarios[j]}</li>
        `;
    }

    conteudoLinhasSabado += `
          </div>
        </div>
      `;
  }

  // coloca a variável no HTML da página
  containerLinhasSabado.innerHTML = conteudoLinhasSabado;
}

function imprimeLinhasFeriasRecessos() {
  let containerLinhasFeriasRecessos = document.getElementById(
    "container-linhas-ferias-recessos"
  );
  let conteudoLinhasFeriasRecessos = "";

  for (let i = 0; i < data.feriasRecessos.length; i++) {
    if (data.feriasRecessos[i].sublinha == null) {
      conteudoLinhasFeriasRecessos += `
        <section class="linha" id="linha-${data.feriasRecessos[i].tipo}">
          <Button id="linha">${data.feriasRecessos[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhasFeriasRecessos += `
        <section class="linha" id="linha-${data.feriasRecessos[i].tipo}">
          <Button>${data.feriasRecessos[i].nome}<p>${data.feriasRecessos[i].sublinha}</p></Button>
        </section>
      `;
    }

    conteudoLinhasFeriasRecessos += `
      <div class="exibir-horario">
        <div class="horario-atual">
          <div class="anterior">
            <p>Anterior</p>
            <p>${retornaHorarioAnterior(i, "ferias")}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${retornaProximoHorario(i, "ferias")}</p>
          </div>
        </div>

        <div class="container-buttons">
          <button class="mostrar-itinerario">itinerário</button>
          <button class="mais-horarios">mais horários</button>
        </div>

        <div class="itinerario-interno escondido">
    `;

    for (let j = 0; j < data.feriasRecessos[i].itinerario.length; j++) {
      conteudoLinhasFeriasRecessos += ` 
            <li>${data.feriasRecessos[i].itinerario[j]}</li>
      `;
    }

    conteudoLinhasFeriasRecessos += `
        </div>

          <div class="horarios-interno escondido">
    `;

    for (let j = 0; j < data.feriasRecessos[i].horarios.length; j++) {
      conteudoLinhasFeriasRecessos += ` 
            <li>${data.feriasRecessos[i].horarios[j]}</li>
      `;
    }

    conteudoLinhasFeriasRecessos += `
        </div>
      </div>
    `;
  }

  // coloca a variável no HTML da página
  containerLinhasFeriasRecessos.innerHTML = conteudoLinhasFeriasRecessos;
}

// pega todos os botões da página
let botoesLinha = document.querySelectorAll(".linha");

// percorre por todos os botões da página
for (let i = 0; i < botoesLinha.length; i++) {
  // adiciona um Event Listener em cada um deles
  botoesLinha[i].addEventListener("click", function () {
    // exibeHorario(i);
    exibeLinha(i);
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

// função que imprime os dados na tela
function exibeItinerario(posicaoBotao) {
  let containerItinerario =
    document.getElementsByClassName("itinerario-interno");

  if (containerItinerario[posicaoBotao].classList.contains("escondido")) {
    containerItinerario[posicaoBotao].classList.remove("escondido");
    containerItinerario[posicaoBotao].classList.add("aparecido");
  } else {
    containerItinerario[posicaoBotao].classList.remove("aparecido");
    containerItinerario[posicaoBotao].classList.add("escondido");
  }
}

// pega todos os botões da página
let botoesHorarios = document.getElementsByClassName("mais-horarios");

// percorre por todos os botões da página
for (let i = 0; i < botoesHorarios.length; i++) {
  // adiciona um Event Listener em cada um deles
  botoesHorarios[i].addEventListener("click", function () {
    exibeMaisHorarios(i);
  });
}

// função que imprime os dados na tela
function exibeMaisHorarios(posicaoBotao) {
  let containerHorarios = document.getElementsByClassName("horarios-interno");

  if (containerHorarios[posicaoBotao].classList.contains("escondido")) {
    containerHorarios[posicaoBotao].classList.remove("escondido");
    containerHorarios[posicaoBotao].classList.add("aparecido");
  } else {
    containerHorarios[posicaoBotao].classList.remove("aparecido");
    containerHorarios[posicaoBotao].classList.add("escondido");
  }
}

function retornaHorarioAnterior(posicao, funcaoChamada) {
  let horarioAnterior;
  let itinerario = verificaDia();

  if (itinerario == "util") {
    if (funcaoChamada == "uteis") {
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
    if (funcaoChamada == "sabado") {
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
    if (funcaoChamada == "ferias") {
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

function retornaProximoHorario(posicao, funcaoChamada) {
  let proximoHorario;
  let itinerario = verificaDia();

  if (itinerario == "util") {
    if (funcaoChamada == "uteis") {
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
    if (funcaoChamada == "sabado") {
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
    if (funcaoChamada == "ferias") {
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
  let diaAtual = new Date().getDay();
  let feriasInicio = new Date().setDate([ferias[0]]);
  let feriasFim = new Date().setDate([ferias[1]]);

  // verifica se é dia útil
  if (diaAtual > 0 && diaAtual < 6) {
    // verifica se está no período de férias
    if (diaAtual < feriasInicio && diaAtual > feriasFim) {
      return "util";
    } else {
      return "ferias";
    }
  }
  // se for sábado e não for férias, exibe o horário
  else if (diaAtual == 6 && diaAtual < feriasInicio && diaAtual > feriasFim) {
    return "sab";
  }
  // se não existir horários para o dia retorna um traço para não dar erro e
  // nem mostrar horários incorretos
  else {
    return "-";
  }
}





// Selecionar o elemento da ActionSheet e a alça (handle)
const actionsheet = document.querySelector("#menu-lateral");
const handle = document.querySelector("#handler-mobile");

// Variáveis para armazenar a posição atual da ActionSheet
let currentY;
let initialY;
let yOffset = 0;

// Adicionar um evento touchstart à alça para começar a arrastar a ActionSheet
handle.addEventListener("touchstart", dragStart);

// Adicionar um evento touchend à alça para parar de arrastar a ActionSheet
handle.addEventListener("touchend", dragEnd);

// Adicionar um evento touchmove à alça para mover a ActionSheet
handle.addEventListener("touchmove", drag);

// Função para começar a arrastar a ActionSheet
function dragStart(event) {
  initialY = event.touches[0].clientY - yOffset;
}

// Função para parar de arrastar a ActionSheet
function dragEnd(event) {
  initialY = currentY;
}

// Função para mover a ActionSheet
function drag(event) {
  currentY = event.touches[0].clientY - initialY;

  const windowHeight = window.innerHeight;
  const actionsheetHeight = actionsheet.offsetHeight;

  // Verificar se a posição atual é menor que a altura da janela menos a altura da ActionSheet
  if (currentY < windowHeight - actionsheetHeight) {
    yOffset = currentY;
    setTranslate(currentY, actionsheet);
  }
}

// Função para definir a posição da ActionSheet
function setTranslate(yPos, el) {
  el.style.transform = `translate3d(0, ${yPos}px, 0)`;
}
