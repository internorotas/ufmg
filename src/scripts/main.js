import data from "./dadosLinhas.js";
import exibeLinha from "./map.js";

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
            <p>${data.diasUteis[i].horarios[0]}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${data.diasUteis[i].horarios[1]}</p>
          </div>
        </div>
        <button class="mais-horarios">+ mais horários</button>

        <div class="horarios-interno">
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
            <p>${data.sabado[i].horarios[0]}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${data.sabado[i].horarios[1]}</p>
          </div>
        </div>
        <button class="mais-horarios">+ mais horários</button>

        <div class="horarios-interno">
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
            <p>${data.feriasRecessos[i].horarios[0]}</p>
          </div>
          <div class="proximo">
            <p>Próximo</p>
            <p>${data.feriasRecessos[i].horarios[1]}</p>
          </div>
        </div>
        <button class="mais-horarios">+ mais horários</button>

        <div class="horarios-interno">
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
    exibeHorario(i);
    exibeLinha(i);
  });
}

// função que imprime os dados na tela
function exibeHorario(posicaoBotao) {
  let containerHorario = document.getElementsByClassName("exibir-horario");

  for (let i = 0; i < containerHorario.length; i++) {
    containerHorario[i].style.display = "none";
  }

  containerHorario[posicaoBotao].style.display = "flex";
  exibeLinha(posicaoBotao);
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
