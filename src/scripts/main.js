import data from "./dadosLinhas.js";
import exibeLinha from "./map.js";

const periodoFerias = true;

// Função principal para inicializar o aplicativo
function init() {
  imprimeLinhas(data.diasUteis, "container-linhas-dias-uteis");
  imprimeLinhas(data.sabado, "container-linhas-sabado");
  imprimeLinhas(data.feriasRecessos, "container-linhas-ferias-recessos");

  configurarEventosBotoes();
  configurarEventosMenu();
}

// Função para exibir as linhas no container especificado
function imprimeLinhas(data, idContainer) {
  const containerLinhas = document.getElementById(idContainer);
  if (!containerLinhas) return;

  const conteudoLinhas = data
    .map((linha, index) => criarHTMLLinha(linha, index, idContainer))
    .join("");
  containerLinhas.innerHTML = conteudoLinhas;
}

// Função para criar o HTML de cada linha
function criarHTMLLinha(linha, index, idContainer) {
  const sublinhaInfo = linha.sublinha ? `<p>${linha.sublinha}</p>` : "";

  return `
    <section class="linha" id="linha-${linha.tipo}">
      <button id="linha">
        <div id="info-linha">
          <h1>${linha.nome}</h1>
          ${sublinhaInfo}
        </div>
        <img src="./src/assets/arrow-icon.svg" alt="Seta para direita">
      </button>
      ${criarHTMLHorario(index, idContainer, linha)}
    </section>
  `;
}

// Função para criar o HTML dos horários e botões adicionais
function criarHTMLHorario(index, idContainer, linha) {
  const itinerario = linha.itinerario
    .map((item) => `<li>${item}</li>`)
    .join("");
  const horarios = linha.horarios.map((item) => `<li>${item}</li>`).join("");

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
      <div class="itinerario-interno escondido">
        ${itinerario}
      </div>
      <div class="horarios-interno escondido">
        ${horarios}
      </div>
    </div>
  `;
}

// Configuração dos eventos para os botões das linhas e itinerários
function configurarEventosBotoes() {
  document.querySelectorAll(".linha").forEach((botao, index) => {
    botao.addEventListener("click", () => {
      exibeLinha(index);
      hideMenu();
    });
  });

  document.querySelectorAll(".mostrar-itinerario").forEach((botao, index) => {
    botao.addEventListener("click", () => {
      toggleVisibility(
        document.getElementsByClassName("itinerario-interno")[index]
      );
    });
  });

  document.querySelectorAll(".mais-horarios").forEach((botao, index) => {
    botao.addEventListener("click", () => {
      toggleVisibility(
        document.getElementsByClassName("horarios-interno")[index]
      );
    });
  });

  const botaoReportarProblema = document.getElementById("reportar-problema");
  botaoReportarProblema?.addEventListener("click", () => {
    toggleVisibility(document.getElementById("container-problema-links"));
  });
}

// Função para alternar a visibilidade dos elementos
function toggleVisibility(element) {
  element.classList.toggle("escondido");
  element.classList.toggle("aparecido");
}

// Funções de cálculo dos horários anteriores e próximos
function retornaHorarioAnterior(posicao, itinerarioChamado) {
  return calculaHorario(posicao, itinerarioChamado, "anterior");
}

function retornaProximoHorario(posicao, itinerarioChamado) {
  return calculaHorario(posicao, itinerarioChamado, "proximo");
}

// Função genérica para calcular horários anteriores ou próximos
function calculaHorario(posicao, itinerarioChamado, tipo) {
  const itinerario = verificaDia();
  let horarios = [];

  if (
    itinerario === "util" &&
    itinerarioChamado === "container-linhas-dias-uteis"
  ) {
    horarios = data.diasUteis[posicao].horarios;
  } else if (
    itinerario === "sab" &&
    itinerarioChamado === "container-linhas-sabado"
  ) {
    horarios = data.sabado[posicao].horarios;
  } else if (
    itinerario === "ferias" &&
    itinerarioChamado === "container-linhas-ferias-recessos"
  ) {
    horarios = data.feriasRecessos[posicao].horarios;
  }

  return tipo === "anterior"
    ? horarios
        .slice()
        .reverse()
        .find((horario) => compararHorario(horario, tipo)) || "-"
    : horarios.find((horario) => compararHorario(horario, tipo)) || "-";
}

// Função para comparar os horários
function compararHorario(horario, tipo) {
  const [horas, minutos] = horario.split(":").map(Number);
  const comparado = new Date();
  comparado.setHours(horas, minutos, 0);

  return tipo === "anterior" ? comparado < new Date() : comparado > new Date();
}

// Função para verificar o dia da semana e período
function verificaDia() {
  const diaSemana = new Date().getDay();
  if (diaSemana > 0 && diaSemana < 6) return periodoFerias ? "ferias" : "util";
  return diaSemana === 6 ? "sab" : "-";
}

// Funções para mostrar e esconder o menu
function showMenu() {
  alterarVisibilidadeMenu("show");
}

function hideMenu() {
  alterarVisibilidadeMenu("hide");
}

// Função genérica para alterar a visibilidade do menu
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
    }, 300); // Delay should match CSS transition duration
  }
}

// Configuração dos eventos do menu
function configurarEventosMenu() {
  document
    .getElementById("ver-linhas-horarios")
    ?.addEventListener("click", showMenu);
  document
    .getElementById("fechar-linhas-horarios")
    ?.addEventListener("click", hideMenu);
}

// Inicializa o aplicativo
init();
