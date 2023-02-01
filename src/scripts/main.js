let listaLinhas = {
  diasUteis: [
    {
      linha: 1,
      nome: "Linha 01",
      tipo: "um",
      sublinha: null,
      horarios: [
        "06:10",
        "06:50",
        "07:30",
        "08:35",
        "09:40",
        "11:10",
        "11:50",
        "12:30",
        "13:15",
        "14:10",
        "15:10",
        "15:50",
        "16:30",
        "17:10",
        "17:55",
        "18:50",
        "19:40",
      ],
    },
    {
      linha: 2,
      nome: "Linha 02",
      tipo: "dois",
      sublinha: null,
      horarios: [
        "05:55",
        "06:30",
        "07:10",
        "07:50",
        "09:05",
        "10:20",
        "14:30",
        "15:30",
        "16:10",
        "16:50",
        "19:20",
        "20:00",
        "20:50",
        "21:35",
        "22:30",
      ],
    },
    {
      linha: 2,
      nome: "Linha 02",
      tipo: "dois",
      sublinha: "Retorno na Área Militar",
      horarios: ["11:30", "12:10", "12:50", "13:45", "17:30", "18:20"],
    },
    {
      linha: 3,
      nome: "Linha 03",
      tipo: "tres",
      sublinha: null,
      horarios: [
        "05:40",
        "06:20",
        "07:00",
        "07:40",
        "08:20",
        "09:20",
        "10:00",
        "10:40",
        "14:55",
        "16:00",
        "16:40",
        "19:05",
        "20:30",
        "21:10",
        "21:50",
        "22:10",
      ],
    },
    {
      linha: 3,
      nome: "Linha 03",
      tipo: "tres",
      sublinha: "Retorno na Área Militar",
      horarios: ["11:20", "12:00", "12:40", "13:30", "17:20", "18:10", "22:50"],
    },
    {
      linha: 3,
      nome: "Linha 03",
      tipo: "tres",
      sublinha: "Atendimento ao BH-Tec",
      horarios: ["07:40", "17:20"],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: null,
      horarios: ["06:00", "08:05", "08:50", "14:45", "15:40", "16:20", "20:15"],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: "Retorno na Área Militar",
      horarios: [
        "11:00",
        "11:40",
        "12:20",
        "13:05",
        "13:55",
        "17:00",
        "17:40",
        "18:35",
      ],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: "Atendimento ao Ponto McDonald's",
      horarios: [
        "06:40",
        "07:20",
        "11:00",
        "11:40",
        "12:20",
        "13:05",
        "13:55",
        "17:00",
        "17:40",
      ],
    },
    {
      linha: 4,
      nome: "Linha 04",
      tipo: "quatro",
      sublinha: "Atendimento ao BH-Tec e McDonald's",
      horarios: ["07:20", "12:20", "17:00"],
    },
  ],
  sabado: [
    {
      linha: 5,
      nome: "Linha 02",
      tipo: "dois-sabado",
      sublinha: "Sábado",
      horarios: ["11:00", "11:40", "12:20", "13:00", "13:40"],
    },
  ],
  feriasRecessos: [
    {
      linha: 6,
      nome: "Linha 02",
      tipo: "dois-ferias",
      sublinha: "Férias e Recessos",
      horarios: [
        "05:55",
        "06:40",
        "07:20",
        "08:05",
        "09:10",
        "10:40",
        "11:30",
        "12:10",
        "12:50",
        "13:50",
        "14:40",
        "15:30",
        "16:10",
        "16:50",
        "17:30",
        "18:20",
        "19:20",
        "20:00",
      ],
    },
  ],
};

console.log(listaLinhas);

function imprimeLinhasDiasUteis() {
  let containerLinhasDiasUteis = document.getElementById(
    "container-linhas-dias-uteis"
  );
  let conteudoLinhasDiasUteis = "";

  let containerLinhasSabado = document.getElementById(
    "container-linhas-sabado"
  );
  let conteudoLinhasSabado = "";

  for (let i = 0; i < listaLinhas.diasUteis.length; i++) {
    if (listaLinhas.diasUteis[i].sublinha == null) {
      conteudoLinhasDiasUteis += `
        <section class="linha" id="linha-${listaLinhas.diasUteis[i].tipo}">
          <Button id="linha">${listaLinhas.diasUteis[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhasDiasUteis += `
        <section class="linha" id="linha-${listaLinhas.diasUteis[i].tipo}">
          <Button>${listaLinhas.diasUteis[i].nome}<p>${listaLinhas.diasUteis[i].sublinha}</p></Button>
        </section>
      `;
    }

    conteudoLinhasDiasUteis += `
      <div class="exibir-horario">
        <div class="horario-atual">
          <div class="anterior">
            <p>Anterior</p>
            <p>${listaLinhas.diasUteis[i].horarios[0]}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${listaLinhas.diasUteis[i].horarios[1]}</p>
          </div>
        </div>
        <button class="mais-horarios">+ mais horários</button>

        <div class="horarios-interno">
    `;

    for (let j = 0; j < listaLinhas.diasUteis[i].horarios.length; j++) {
      conteudoLinhasDiasUteis += ` 
            <li>${listaLinhas.diasUteis[i].horarios[j]}</li>
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

  for (let i = 0; i < listaLinhas.sabado.length; i++) {
    if (listaLinhas.sabado[i].sublinha == null) {
      conteudoLinhasSabado += `
        <section class="linha" id="linha-${listaLinhas.sabado[i].tipo}">
          <Button id="linha">${listaLinhas.sabado[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhasSabado += `
        <section class="linha" id="linha-${listaLinhas.sabado[i].tipo}">
          <Button>${listaLinhas.sabado[i].nome}<p>${listaLinhas.sabado[i].sublinha}</p></Button>
        </section>
      `;
    }

    conteudoLinhasSabado += `
      <div class="exibir-horario">
        <div class="horario-atual">
          <div class="anterior">
            <p>Anterior</p>
            <p>${listaLinhas.sabado[i].horarios[0]}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${listaLinhas.sabado[i].horarios[1]}</p>
          </div>
        </div>
        <button class="mais-horarios">+ mais horários</button>

        <div class="horarios-interno">
    `;

    for (let j = 0; j < listaLinhas.sabado[i].horarios.length; j++) {
      conteudoLinhasSabado += ` 
            <li>${listaLinhas.sabado[i].horarios[j]}</li>
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

  for (let i = 0; i < listaLinhas.feriasRecessos.length; i++) {
    if (listaLinhas.feriasRecessos[i].sublinha == null) {
      conteudoLinhasFeriasRecessos += `
        <section class="linha" id="linha-${listaLinhas.feriasRecessos[i].tipo}">
          <Button id="linha">${listaLinhas.feriasRecessos[i].nome}</Button>
        </section>
      `;
    } else {
      conteudoLinhasFeriasRecessos += `
        <section class="linha" id="linha-${listaLinhas.feriasRecessos[i].tipo}">
          <Button>${listaLinhas.feriasRecessos[i].nome}<p>${listaLinhas.feriasRecessos[i].sublinha}</p></Button>
        </section>
      `;
    }

    conteudoLinhasFeriasRecessos += `
      <div class="exibir-horario">
        <div class="horario-atual">
          <div class="anterior">
            <p>Anterior</p>
            <p>${listaLinhas.feriasRecessos[i].horarios[0]}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${listaLinhas.feriasRecessos[i].horarios[1]}</p>
          </div>
        </div>
        <button class="mais-horarios">+ mais horários</button>

        <div class="horarios-interno">
    `;

    for (let j = 0; j < listaLinhas.feriasRecessos[i].horarios.length; j++) {
      conteudoLinhasFeriasRecessos += ` 
            <li>${listaLinhas.feriasRecessos[i].horarios[j]}</li>
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
    exibeHorario(i);
  });
}

// função que imprime os dados na tela
function exibeHorario(posicaoBotao) {
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
  let containerHorarios = document.getElementsByClassName("horarios-interno");

  for (let i = 0; i < containerHorarios.length; i++) {
    containerHorarios[i].style.display = "none";
  }

  containerHorarios[posicaoBotao].style.display = "flex";
}
