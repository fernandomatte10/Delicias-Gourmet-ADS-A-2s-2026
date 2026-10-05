const carrossel = document.querySelector(".carrossel-track");
const setaEsquerda = document.querySelector(".seta-esquerda");
const setaDireita = document.querySelector(".seta-direita");

const produtosEspeciais = Array.from(
    document.querySelectorAll(".carrossel-track img")
);

const quantidadeVisivel = 3;
let posicaoAtual = 0;
let temporizadorCentral = null;


// CRIA OS CLONES

// Clona os primeiros produtos
produtosEspeciais.slice(0, quantidadeVisivel).forEach(function (produto) {
    const copia = produto.cloneNode(true);
    carrossel.appendChild(copia);
});

// Clona os últimos produtos
produtosEspeciais.slice(-quantidadeVisivel).forEach(function (produto) {
    const copia = produto.cloneNode(true);
    carrossel.insertBefore(copia, carrossel.firstChild);
});


// Todos os produtos, incluindo os clones
const produtos = carrossel.querySelectorAll("img");


// Começa mostrando os três produtos originais
posicaoAtual = quantidadeVisivel;


// MOVE O CARROSSEL

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


// ATUALIZA QUAL É A IMAGEM CENTRAL

function atualizarProdutoCentral() {
    produtos.forEach(function (produto) {
        produto.classList.remove("produto-central");
    });

    const indiceCentral = posicaoAtual + 1;

    if (produtos[indiceCentral]) {
        produtos[indiceCentral].classList.add("produto-central");
    }
}


// MOVE PARA A DIREITA

function moverDireita() {

    // Remove o destaque antes de começar o movimento
    produtos.forEach(function (produto) {
        produto.classList.remove("produto-central");
    });

    posicaoAtual++;

    atualizarCarrossel(true);

    clearTimeout(temporizadorCentral);

    // O movimento dura 0.5s.
    // Depois que chegar ao centro, aumenta a imagem.
    temporizadorCentral = setTimeout(function () {

        const quantidadeProdutos = produtosEspeciais.length;

        // Chegou nos clones do começo
        if (posicaoAtual >= quantidadeProdutos + quantidadeVisivel) {

            // Desliga temporariamente a animação das imagens
            produtos.forEach(function (produto) {
                produto.style.transition = "none";
            });

            // Volta para o equivalente original
            posicaoAtual = quantidadeVisivel;

            atualizarCarrossel(false);
            atualizarProdutoCentral();

            // Reativa a animação das imagens
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    produtos.forEach(function (produto) {
                        produto.style.transition = "transform 0.5s ease";
                    });
                });
            });

            return;
        }

        atualizarProdutoCentral();

    }, 500);
}


// MOVE PARA A ESQUERDA

function moverEsquerda() {

    // Remove o destaque antes de começar o movimento
    produtos.forEach(function (produto) {
        produto.classList.remove("produto-central");
    });

    posicaoAtual--;

    atualizarCarrossel(true);

    clearTimeout(temporizadorCentral);

    temporizadorCentral = setTimeout(function () {

        const quantidadeProdutos = produtosEspeciais.length;

        // Chegou nos clones do final
        if (posicaoAtual < quantidadeVisivel) {

            produtos.forEach(function (produto) {
                produto.style.transition = "none";
            });

            posicaoAtual =
                quantidadeProdutos + quantidadeVisivel - 1;

            atualizarCarrossel(false);
            atualizarProdutoCentral();

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    produtos.forEach(function (produto) {
                        produto.style.transition = "transform 0.5s ease";
                    });
                });
            });

            return;
        }

        atualizarProdutoCentral();

    }, 500);
}


// BOTÕES

setaDireita.addEventListener("click", moverDireita);

setaEsquerda.addEventListener("click", moverEsquerda);


// PASSAGEM AUTOMÁTICA

setInterval(function () {
    moverDireita();
}, 5000);


// REDIMENSIONAMENTO

window.addEventListener("resize", function () {
    clearTimeout(temporizadorCentral);

    atualizarCarrossel(false);
    atualizarProdutoCentral();
});


// ESTADO INICIAL

atualizarCarrossel(false);
atualizarProdutoCentral();


// CLIQUE NAS IMAGENS

carrossel.addEventListener("click", function (evento) {
    if (evento.target.tagName !== "IMG") return;

    const grupoDelicias = document.querySelector("#grupo-delicias");

    if (grupoDelicias) {
        const posicao =
            grupoDelicias.getBoundingClientRect().top +
            window.scrollY -250;

        window.scrollTo({
            top: posicao,
            behavior: "smooth"
        });
    }
});