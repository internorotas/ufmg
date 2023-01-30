let listaLinhas = {
  diasUteis: [
    {
      linha: 1,
      nome: "Linha 01",
      tipo: "um",
      sublinha: null,
      horarios: [
        "0610",
        "0650",
        "0730",
        "0835",
        "0940",
        "1110",
        "1150",
        "1230",
        "1315",
        "1410",
        "1510",
        "1550",
        "1630",
        "1710",
        "1755",
        "1850",
        "1940",
      ],
    },
    {
      linha: 2,
      nome: "Linha 02",
      tipo: "dois",
      sublinha: null,
      horarios: [
        "0555",
        "0630",
        "0710",
        "0750",
        "0905",
        "1020",
        "1430",
        "1530",
        "1610",
        "1650",
        "1920",
        "2000",
        "2050",
        "2135",
        "2230",
      ],
    },
    {
      linha: 2,
      nome: "Linha 02",
      tipo: "dois",
      sublinha: "Retorno na Área Militar",
      horarios: ["1130", "1210", "1250", "1345", "1730", "1820"],
    },
    {
      linha: 3,
      nome: "Linha 03",
      tipo: "tres",
      sublinha: null,
      horarios: [
        "0540",
        "0620",
        "0700",
        "0740",
        "0820",
        "0920",
        "1000",
        "1040",
        "1455",
        "1600",
        "1640",
        "1905",
        "2030",
        "2110",
        "2150",
        "2210",
      ],
    },
    {
      linha: 3,
      nome: "Linha 03",
      tipo: "tres",
      sublinha: "Retorno na Área Militar",
      horarios: ["1120", "1200", "1240", "1330", "1720", "1810", "2250"],
    },
    {
      linha: 3,
      nome: "Linha 03",
      tipo: "tres",
      sublinha: "Atendimento ao BH-Tec",
      horarios: ["0740", "1720"],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: null,
      horarios: ["0600", "0805", "0850", "1445", "1540", "1620", "2015"],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: "Retorno na Área Militar",
      horarios: [
        "1100",
        "1140",
        "1220",
        "1305",
        "1355",
        "1700",
        "1740",
        "1835",
      ],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: "Atendimento ao Ponto McDonald's",
      horarios: [
        "0640",
        "0720",
        "1100",
        "1140",
        "1220",
        "1305",
        "1355",
        "1700",
        "1740",
      ],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: "Atendimento ao BH-Tec e McDonald's",
      horarios: ["0720", "1220", "1700"],
    },
  ],
  sabado: [
    {
      linha: 5,
      nome: "Linha 02 - Sábado",
      tipo: "dois-sabado",
      sublinha: null,
      horarios: ["1100", "1140", "1220", "1300", "1340"],
    },
  ],
  feriasRecessos: [
    {
      linha: 6,
      nome: "Linha 02 - Férias e Recessos",
      tipo: "dois-ferias",
      sublinha: null,
      horarios: [
        "0555",
        "0640",
        "0720",
        "0805",
        "0910",
        "1040",
        "1130",
        "1210",
        "1250",
        "1350",
        "1440",
        "1530",
        "1610",
        "1650",
        "1730",
        "1820",
        "1920",
        "2000",
      ],
    },
  ],
};

console.log(listaLinhas);

function imprimeDados() {
  let containerLinhas = document.getElementById("container-linhas-dias-uteis");
  let conteudoLinhas = "";

  for (let i = 0; i < listaLinhas.diasUteis.length; i++) {
    if (listaLinhas.diasUteis[i].sublinha == null) {
      conteudoLinhas += `
        <section class="linha" id="linha-${listaLinhas.diasUteis[i].tipo}">
          <Button id="linha">${listaLinhas.diasUteis[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhas += `
        <section class="linha" id="linha-${listaLinhas.diasUteis[i].tipo}">
          <Button>${listaLinhas.diasUteis[i].nome}<p>${listaLinhas.diasUteis[i].sublinha}</p></Button>
        </section>
      `;
    }
  }

  // coloca a variável no HTML da página
  containerLinhas.innerHTML = conteudoLinhas;
}

function imprimeHorario(i) {
  let containerHorario = document.getElementsByClassName("exibir-horario");
  let conteudoHorario = "";

  conteudoHorario += `
    <div class="exibir-horario">
      <div class="horario-atual">
        <div class="anterior">
          <p>Anterior</p>
          <p>${listaLinhas.diasUteis[i].horarios[3]}</p>
        </div>
        <div class="proximo">
          <p>Próximo</p>
          <p>${listaLinhas.diasUteis[i].horarios[4]}</p>
        </div>
      </div>
      
      <button class="mais-horarios">+ mais horários</button>

      <div class="horarios-interno">
        <li>${listaLinhas.diasUteis[i].horarios[i]}</li>
      </div>
    </div>
  `;

  // coloca a variável no HTML da página
  containerHorario.innerHTML = conteudoHorario;
}

// pega todos os botões da página
let botoesLinha = document.querySelectorAll(".linha");

// percorre por todos os botões da página
for (let i = 0; i < botoesLinha.length; i++) {
  // adiciona um Event Listener em cada um deles
  botoesLinha[i].addEventListener("click", function () {
    exibeHorario(i);
  });
}

// função que imprime os dados na tela
function exibeHorario(posicaoBotao) {
  // pega algumas informações do usuário no HTML da página
  // pega o container dos itens para troca
  let containerHorario = document.getElementsByClassName("exibir-horario");

  for (let i = 0; i < containerHorario.length; i++) {
    containerHorario[i].style.display = "none";
  }

  containerHorario[posicaoBotao].style.display = "flex";
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
  // pega algumas informações do usuário no HTML da página
  // pega o container dos itens para troca
  let containerHorarios = document.getElementsByClassName("horarios-interno");

  for (let i = 0; i < containerHorarios.length; i++) {
    containerHorarios[i].style.display = "none";
  }

  containerHorarios[posicaoBotao].style.display = "flex";
}

/* Lateral arrasta - mobile ==================================================*/

// let lateral = document.querySelector("#menu-lateral");
// // header = lateral.querySelector("#menu-lateral");

// function ondDrag({ movementX, movementY }) {
//   let getStyle = window.getComputedStyle(lateral);
//   let left = parseInt(getStyle.left);
//   let top = parseInt(getStyle.top);

//   lateral.style.left = `${left + movementX}px`;
//   lateral.style.top = `${top + movementY}px`;

//   console.log(top);
// }

// lateral.addEventListener("mousedown", () => {
//   lateral.addEventListener("mousemove", ondDrag);
// });

// quando todos os itens da tela terminas de ser carregados, chama a função imprimeDados
window.addEventListener("load", imprimeDados);
