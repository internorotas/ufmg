import data from "./dadosLinhas.js";
import exibeLinha from "./map.js";

const periodoFerias = false;

console.log(data);

// Função que imprime as linhas de ônibus
function imprimeLinhas(data, idContainer) {
  const containerLinhas = document.getElementById(idContainer);
  let conteudoLinhas = "";

  data.forEach((linha, index) => {
    const sublinha = linha.sublinha ? `<p>${linha.sublinha}</p>` : "";

    conteudoLinhas += `
      <section class="linha" id="linha-${linha.tipo}">
        <button id="linha">
          <div id="info-linha">
            <h1>${linha.nome}</h1>
            ${sublinha}
          </div>
          <img src="./src/assets/arrow-icon.svg" alt="Seta para direita">
        </button>
      </section>
      ${criarHorarioHTML(index, idContainer, linha)}
    `;
  });

  containerLinhas.innerHTML = conteudoLinhas;
}

// Função que cria o HTML dos horários
function criarHorarioHTML(index, idContainer, linha) {
  const itinerario = linha.itinerario.map(item => `<li>${item}</li>`).join("");
  const horarios = linha.horarios.map(item => `<li>${item}</li>`).join("");

  // Verifica se a linha possui horários
  if (!linha.horarios || linha.horarios.length === 0) {
    return `
      <div class="exibir-horario">
        <div class="container-buttons">
          <button class="mostrar-itinerario">Itinerário</button>
        </div>
        <div class="itinerario-interno escondido">${itinerario}</div>
      </div>
    `;
  }

  return `
    <div class="exibir-horario">
      <div class="horario-atual">
        <div class="anterior">
          <p>Anterior</p>
          <p>${retornaHorarioAnterior(index, idContainer)}</p>
        </div>
        <div class="proximo">
          <p>Próximo</p>
          <p>${retornaProximoHorario(index, idContainer)}</p>
        </div>
      </div>
      <div class="container-buttons">
        <button class="mostrar-itinerario">Itinerário</button>
        <button class="mais-horarios">Mais horários</button>
      </div>
      <div class="itinerario-interno escondido">${itinerario}</div>
      <div class="horarios-interno escondido">${horarios}</div>
    </div>
  `;
}

// Adiciona os eventos aos botões de linha e itinerário
function configurarEventos() {
  document.querySelectorAll(".linha").forEach((botao, index) => {
    botao.addEventListener("click", () => {
      exibeLinha(index);
      hideMenu();
    });
  });

  document.querySelectorAll(".mostrar-itinerario").forEach((botao, index) => {
    botao.addEventListener("click", () => {
      toggleVisibility(document.getElementsByClassName("itinerario-interno")[index]);
    });
  });

  document.querySelectorAll(".mais-horarios").forEach((botao, index) => {
    botao.addEventListener("click", () => {
      toggleVisibility(document.getElementsByClassName("horarios-interno")[index]);
    });
  });

  const botaoReportarProblema = document.getElementById("reportar-problema");
  botaoReportarProblema?.addEventListener("click", () => {
    toggleVisibility(document.getElementById("container-problema-links"));
  });
}

// Função para alternar a visibilidade
function toggleVisibility(element) {
  element.classList.toggle("escondido");
  element.classList.toggle("aparecido");
}

// Função para retornar o horário anterior
function retornaHorarioAnterior(posicao, itinerarioChamado) {
  return calculaHorario(posicao, itinerarioChamado, "anterior");
}

// Função para retornar o próximo horário
function retornaProximoHorario(posicao, itinerarioChamado) {
  return calculaHorario(posicao, itinerarioChamado, "proximo");
}

// Função genérica para calcular horários anteriores ou próximos
function calculaHorario(posicao, itinerarioChamado, tipo) {
  const itinerario = verificaDia();
  let horarios = [];

  if (itinerario === "util" && itinerarioChamado === "container-linhas-dias-uteis") {
    horarios = data.diasUteis[posicao].horarios;
  } else if (itinerario === "sab" && itinerarioChamado === "container-linhas-sabado") {
    horarios = data.sabado[posicao].horarios;
  } else if (itinerario === "ferias" && itinerarioChamado === "container-linhas-ferias-recessos") {
    horarios = data.feriasRecessos[posicao].horarios;
  }

  return tipo === "anterior"
    ? horarios.slice().reverse().find(horario => compararHorario(horario, tipo)) || "-"
    : horarios.find(horario => compararHorario(horario, tipo)) || "-";
}

// Função para comparar o horário atual com o passado
function compararHorario(horario, tipo) {
  const [horas, minutos] = horario.split(":").map(Number);
  const comparado = new Date();
  comparado.setHours(horas, minutos, 0);

  return tipo === "anterior" ? comparado < new Date() : comparado > new Date();
}

// Verifica o dia da semana e se está em período de férias
function verificaDia() {
  const diaSemana = new Date().getDay();
  if (diaSemana > 0 && diaSemana < 6) return periodoFerias ? "ferias" : "util";
  return diaSemana === 6 ? "sab" : "-";
}

// Mostra e esconde o menu lateral
function showMenu() {
  alterarVisibilidadeMenu("show");
}

function hideMenu() {
  alterarVisibilidadeMenu("hide");
}

// Alterna a visibilidade do menu lateral
function alterarVisibilidadeMenu(acao) {
  const menu = document.getElementById("menu-lateral");
  const headerMenu = document.getElementById("header-menu-mobile");

  if (!menu || !headerMenu) return;

  if (acao === "show") {
    menu.classList.add("show");
    headerMenu.classList.add("show");
    menu.classList.remove("hidden");
  } else if (acao === "hide") {
    menu.classList.remove("show");
    headerMenu.classList.remove("show");
    setTimeout(() => {
      menu.classList.add("hidden");
    }, 300);
  }
}

// Configura os eventos do menu
function configurarEventosMenu() {
  document.getElementById("ver-linhas-horarios")?.addEventListener("click", showMenu);
  document.getElementById("fechar-linhas-horarios")?.addEventListener("click", hideMenu);
}

// Inicializa o aplicativo
imprimeLinhas(data.diasUteis, "container-linhas-dias-uteis");
imprimeLinhas(data.sabado, "container-linhas-sabado");
imprimeLinhas(data.feriasRecessos, "container-linhas-ferias-recessos");
configurarEventos();
configurarEventosMenu();
