let linhas = [
  {
    linha: 1,
    horarios: ["0610", "0610", "0610", "0610", "0610", "0610", "0610", "0610"],
  },
  {
    linha: 2,
    horarios: ["0610", "0610", "0610", "0610", "0610", "0610", "0610", "0610"],
  },
];

// pega todos os botões da página
let botoesLinha = document.querySelectorAll(".linha");

// percorre por todos os botões da página
for (let i = 0; i < botoesLinha.length; i++) {
  // adiciona um Event Listener em cada um deles
  botoesLinha[i].addEventListener("click", function () {
    /*
    // confere se o valor do item da a troca é maior do que o saldo do usuário
    if (dadosUser.produtosTrocas[i].preco > dadosUser.pontos) {
      // caso seja, exibe uma mensagem de alerta avisando o usuário
      alert(
        "Saldo insuficiente para trocar " +
          '"' +
          dadosUser.produtosTrocas[i].titulo +
          '"'
      );
    } else {
      // caso tenha saldo, mostra o produto e o valor dele
      alert(
        '"' +
          dadosUser.produtosTrocas[i].titulo +
          '"' +
          " trocado por " +
          dadosUser.produtosTrocas[i].preco +
          " pontos"
      );
      // chama a função que troca pontos, passando o objeto de dados e a posição do botão
      trocaPontos(dadosUser, i);
    }*/

    // alert("O botão " + [i] + " foi clicado.");

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

  /*

  // declara variável que irá receber os itens
  let conteudoHorario = "";

  // define o objeto de dados como o retorno da função de ler dados
  //let dadosUser = JSON.parse(localStorage.getItem("usuarioCorrente"));

  console.log(linhas);
  
  conteudoHorario += `
    <div class="horario-atual">
      <div class="anterior">
        <p>Anterior</p>
        <p>12:30</p>
      </div>
      <div class="proximo">
        <p>Próximo</p>
        <p>13:15</p>
      </div>
    </div>
  `;
  */

  /*

  // executa item por item e salva dentro da variável
  for (let i = 0; i < produtosTroca.length; i++) {
    conteudoTroca += `
          <article class="item">
            <img src=${produtosTroca[i].imagem} alt="Imagem ilustrativa">
            <span>${produtosTroca[i].titulo}</span>
            <p>${produtosTroca[i].descricao}</p>
            <span>Preço: ${produtosTroca[i].preco} pontos</span>
            <button type="button" id="button" class=button-${i}>Trocar</button>
            </article>
  `;
  }*/

  // coloca a variável no HTML da página
  //containerHorario.innerHTML = conteudoHorario;
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
