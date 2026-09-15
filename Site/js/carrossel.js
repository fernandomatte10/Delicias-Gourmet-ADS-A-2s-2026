const carrossel = document.querySelector(".carrossel-track");

const setaEsquerda = document.querySelector(".seta-esquerda");
const setaDireita = document.querySelector(".seta-direita");

const produtosEspeciais = Array.from(
    document.querySelectorAll(".carrossel-track img")
);

const quantidadeVisivel = 3;

let posicaoAtual = 0;

// Criando cópias dos primeiros produtos
produtosEspeciais.slice(0, quantidadeVisivel).forEach(function (produto) {

    const copia = produto.cloneNode(true);

    carrossel.appendChild(copia);

});

// Criando cópias dos últimos produtos
produtosEspeciais.slice(-quantidadeVisivel).forEach(function (produto) {

    const copia = produto.cloneNode(true);

    carrossel.insertBefore(copia, carrossel.firstChild);

});

// Pegando todos os produtos depois das cópias
const produtos = carrossel.querySelectorAll("img");

// Começa mostrando os produtos especiais
posicaoAtual = quantidadeVisivel;

function atualizarCarrossel(animacao = true) {

    const larguraProduto = produtos[0].offsetWidth;

    const estilo = window.getComputedStyle(carrossel);

    const gap = parseFloat(estilo.gap);

    const deslocamento =
        posicaoAtual * (larguraProduto + gap);

    if (animacao) {
        carrossel.style.transition = "transform 0.5s ease";
    } else {
        carrossel.style.transition = "none";
    }

    carrossel.style.transform =
        `translateX(-${deslocamento}px)`;
}

// Avançar
setaDireita.addEventListener("click", function () {

    posicaoAtual++;

    atualizarCarrossel();

});

// Voltar
setaEsquerda.addEventListener("click", function () {

    posicaoAtual--;

    atualizarCarrossel();

});

// Quando chegar nas cópias do final
carrossel.addEventListener("transitionend", function () {

    const quantidadeProdutos = produtosEspeciais.length;

    if (posicaoAtual >= quantidadeProdutos + quantidadeVisivel) {

        posicaoAtual = quantidadeVisivel;

        atualizarCarrossel(false);
    }

    if (posicaoAtual < quantidadeVisivel) {

        posicaoAtual = quantidadeProdutos + quantidadeVisivel - 1;

        atualizarCarrossel(false);
    }

});

// Movimento automático
setInterval(function () {

    posicaoAtual++;

    atualizarCarrossel();

}, 5000);

// Posiciona o carrossel no início
atualizarCarrossel(false);