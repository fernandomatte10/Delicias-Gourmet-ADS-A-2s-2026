// ============================================================
// CARRINHO DE PEDIDOS - DELÍCIAS GOURMET
// ============================================================
// Este arquivo controla toda a parte interativa do carrinho:
//   - adicionar produtos;
//   - aumentar/diminuir quantidade;
//   - remover produtos;
//   - calcular o total;
//   - salvar o carrinho no navegador;
//   - enviar o pedido para o Node.js;
//   - abrir o WhatsApp com o resumo do pedido.
//
// O cardápio é carregado do Sanity pelo arquivo produtos.js.
// O Node.js fica responsável pelo backend e pelo registro do pedido.
// ============================================================

// Número do WhatsApp que receberá os pedidos.
// Formato internacional: 55 + DDD + número, sem espaços ou símbolos.
const WHATSAPP = "5544998860173";

// Endpoint do backend Node.js que registra os pedidos.
const API_URL = "/api/pedidos";

// Nome usado pelo localStorage para guardar o carrinho.
const CART_KEY = "delicias-gourmet-carrinho";

// ------------------------------------------------------------
// ESTADO DO CARRINHO
// ------------------------------------------------------------
// Primeiro tentamos recuperar um carrinho que já estava salvo.
// Caso não exista, começamos com um array vazio.
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

// Atalho para buscar elementos pelo ID.
const $ = (id) => document.getElementById(id);

// Converte um número para o formato de moeda brasileiro.
// Exemplo: 25.5 -> R$ 25,50
const money = (value) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

// ------------------------------------------------------------
// FUNÇÕES DE CÁLCULO E PERSISTÊNCIA
// ------------------------------------------------------------

// Salva o estado atual do carrinho no navegador.
// O localStorage permite manter os produtos mesmo se a página for atualizada.
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Retorna a quantidade total de produtos no carrinho.
// Exemplo: 2 hambúrgueres + 3 pastéis = 5 itens.
function totalItems() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Calcula o valor total de todos os produtos.
function totalCart() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ------------------------------------------------------------
// RENDERIZAÇÃO DO CARRINHO
// ------------------------------------------------------------
// Atualiza a interface sempre que alguma coisa muda no carrinho.
function escapeCartText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function renderCart() {
  const container = $("cart-items");
  const empty = $("cart-empty");
  const total = $("cart-total");
  const count = $("cart-count");
  const checkout = $("checkout-button");
  const clear = $("clear-cart");

  // Atualiza contador e total.
  count.textContent = totalItems();
  total.textContent = money(totalCart());

  // Desabilita os botões quando não há produtos.
  window.atualizarBotaoPedido();
  clear.disabled = cart.length === 0;

  // Mostra a mensagem de carrinho vazio somente quando necessário.
  empty.hidden = cart.length !== 0;

  // Monta visualmente cada produto do carrinho.
  container.innerHTML = cart
    .map(
      (item, index) => `
    <article class="cart-item">
      <img src="${escapeCartText(item.image)}" alt="${escapeCartText(item.name)}" />
      <div>
        <h3>${escapeCartText(item.name)}</h3>
        <div class="cart-item-price">${money(item.price)} cada</div>

        <div class="quantity-controls">
          <button
            type="button"
            data-action="decrease"
            data-index="${index}"
            aria-label="Diminuir"
          >−</button>

          <strong>${item.quantity}</strong>

          <button
            type="button"
            data-action="increase"
            data-index="${index}"
            aria-label="Aumentar"
          >+</button>
        </div>

        <button
          class="remove-item"
          type="button"
          data-action="remove"
          data-index="${index}"
        >
          Remover
        </button>
      </div>

      <div class="cart-item-total">
        ${money(item.price * item.quantity)}
      </div>
    </article>`
    )
    .join("");
}

// ------------------------------------------------------------
// ADICIONAR PRODUTO
// ------------------------------------------------------------
// Recebe o card do produto clicado e transforma as informações
// do HTML em um item do carrinho.
function addToCart(card) {
  // Nome do produto.
  const name = card.querySelector("h3").textContent.trim();

  // Preço exibido no cardápio.
  // Exemplo: "R$ 25,90" vira o número 25.90.
  const price = card.dataset.price !== undefined ? Number(card.dataset.price) : Number(
    card
      .querySelector("p")
      .textContent.replace(/[^0-9,]/g, "")
      .replace(",", ".")
  );

  // Caminho da imagem do produto.
  const image = card.querySelector("img").getAttribute("src");

  // Verifica se o produto já está no carrinho.
  const id = card.dataset.id;
  const found = cart.find((item) => id ? item.id === id : item.name === name);

  if (found) {
    // Se já existe, apenas aumenta a quantidade.
    found.quantity += 1;
  } else {
    // Se é um produto novo, adiciona com quantidade 1.
    cart.push({ id, name, price, image, quantity: 1 });
  }

  // Salva e atualiza a tela.
  saveCart();
  renderCart();

  mostrarPopupCarrinho();

  // O carrinho permanece fechado. O cliente pode abri-lo pelo botão do cabeçalho.
}

// ------------------------------------------------------------
// CLIQUES DO CARRINHO
// ------------------------------------------------------------
// Usamos um único listener no document para controlar os botões
// criados dinamicamente dentro do carrinho.
document.addEventListener("click", (event) => {
  // Botão "Adicionar ao carrinho" do cardápio.
  const add = event.target.closest(".add-to-cart");

  if (add) {
    esconderAvisoCarrinho();
    addToCart(add.closest(".card"));
  }

  // Botões internos do carrinho: +, -, Remover.
  const action = event.target.closest("[data-action]");

  if (action) {
    esconderAvisoCarrinho();
    const index = Number(action.dataset.index);

    if (action.dataset.action === "increase") {
      cart[index].quantity++;
    }

    if (action.dataset.action === "decrease") {
      cart[index].quantity--;
    }

    // Remove o produto se o cliente clicar em Remover
    // ou se a quantidade chegar a zero.
    if (
      action.dataset.action === "remove" ||
      cart[index]?.quantity <= 0
    ) {
      cart.splice(index, 1);
    }

    saveCart();
    renderCart();
  }
});

// ------------------------------------------------------------
// ABRIR E FECHAR O CARRINHO
// ------------------------------------------------------------
function openCart() {
  // Sempre que o carrinho é aberto, conferimos preços e disponibilidade atuais.
  atualizarCardapioECarrinho();
  $("cart-drawer").setAttribute("aria-hidden", "false");
  $("cart-drawer").hidden = false;
  $("cart-overlay").hidden = false;
  document.body.classList.add("cart-open");
}

function closeCart() {
  $("cart-drawer").setAttribute("aria-hidden", "true");
  $("cart-drawer").hidden = true;
  $("cart-overlay").hidden = true;
  document.body.classList.remove("cart-open");
}

// Garante que o carrinho comece fechado ao carregar o site.
closeCart();

// Botão do carrinho no cabeçalho.
$("cart-button").addEventListener("click", openCart);

// Botão X para fechar o carrinho.
$("cart-close").addEventListener("click", closeCart);

// Também fecha quando o cliente clica no fundo escuro.
$("cart-overlay").addEventListener("click", closeCart);

// ------------------------------------------------------------
// LIMPAR CARRINHO
// ------------------------------------------------------------
$("clear-cart").addEventListener("click", () => {
  esconderAvisoCarrinho();
  cart = [];
  saveCart();
  renderCart();
});

// ------------------------------------------------------------
// FINALIZAÇÃO DO PEDIDO PELO WHATSAPP
// ------------------------------------------------------------
// A observação é preenchida diretamente no carrinho.
// Ao clicar no botão, o pedido é registrado no Node.js e depois
// o WhatsApp é aberto com todos os itens, quantidades, total e observação.
$("checkout-button").addEventListener("click", async () => {
  if (!cart.length || window.pedidoEmEnvio || !window.estadoLoja.aceitaPedidos) return;

  // Uma nova tentativa de finalizar apaga o aviso anterior.
  esconderAvisoCarrinho();

  const observations = $("order-observations").value.trim();

  const order = {
    customer: {
      nome: "Pedido pelo site",
      tipo: "não informado",
      endereco: "",
      observacoes: observations,
    },
    items: cart,
    total: totalCart(),
    createdAt: new Date().toISOString(),
  };

  const button = $("checkout-button");
  window.pedidoEmEnvio = true;
  button.disabled = true;
  button.textContent = "Preparando pedido...";

  try {
    // Registra o pedido no backend Node.js.
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const falha = await response.json().catch(() => ({}));
      if (falha.funcionamento) window.aplicarEstadoLoja(falha.funcionamento);
      else if (response.status === 503) window.aplicarEstadoLoja({aceitaPedidos: false, mensagem: falha.error || "Não foi possível confirmar o funcionamento da loja."});
      // O servidor conferiu os itens no Sanity e algo mudou: atualiza o carrinho para o cliente revisar.
      if (falha.indisponiveis || falha.alterados) atualizarCarrinhoComServidor(falha);
      throw new Error(falha.error || "Falha ao registrar pedido");
    }

    const saved = await response.json();

    // Monta uma mensagem completa para o WhatsApp.
    const lines = [
      "*Novo pedido - Delícias Gourmet*",
      `Pedido: #${saved.id}`,
      "",
      "*Itens do pedido:*",
      // Usa os itens e o total confirmados pelo servidor (dados oficiais do Sanity).
      ...saved.items.map(
        (item) =>
          `${item.quantity}x ${item.name} — ${money(item.price * item.quantity)}`
      ),
      "",
      `*Total: ${money(saved.total)}*`,
    ];

    if (observations) {
      lines.push("", `*Observações:* ${observations}`);
    }

    // Abre diretamente o WhatsApp com o pedido preenchido.
    const whatsappUrl =
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;

    window.location.href = whatsappUrl;

    // Limpa o carrinho depois de preparar o pedido.
    cart = [];
    saveCart();
    $("order-observations").value = "";
    renderCart();
    closeCart();
  } catch (error) {
    console.error("Erro ao finalizar pedido:", error);
    // Mostra o motivo dentro do próprio carrinho (em vez do alert() do navegador).
    mostrarAvisoCarrinho(
      error.message || "Não foi possível registrar o pedido. Tente novamente."
    );
  } finally {
    window.pedidoEmEnvio = false;
    window.atualizarBotaoPedido();
  }
});

// ------------------------------------------------------------
// ATUALIZAR CARRINHO COM A RESPOSTA DO SERVIDOR
// ------------------------------------------------------------
// Remove itens que não estão mais disponíveis e aplica os preços atuais do Sanity.
// O cliente vê o carrinho corrigido e decide se finaliza novamente.
function atualizarCarrinhoComServidor({ indisponiveis = [], alterados = [] }) {
  const removidos = new Set(indisponiveis.map((item) => item.id));
  cart = cart.filter((item) => !removidos.has(typeof item.id === "string" ? item.id : null));
  for (const novo of alterados) {
    const item = cart.find((i) => i.id === novo.id);
    if (item) {
      item.price = novo.price;
      item.name = novo.name;
    }
  }
  saveCart();
  renderCart();
}

// ------------------------------------------------------------
// AVISO DENTRO DO CARRINHO
// ------------------------------------------------------------
// Mostra uma mensagem no próprio carrinho (elemento #carrinho-aviso do index.html),
// no lugar da janela alert() do navegador.
// O aviso fica visível até o cliente mexer no carrinho ou tentar finalizar de novo.
function mostrarAvisoCarrinho(mensagem) {
  const aviso = $("carrinho-aviso");
  aviso.textContent = mensagem;
  aviso.hidden = false;
}

// Esconde o aviso do carrinho.
function esconderAvisoCarrinho() {
  const aviso = $("carrinho-aviso");
  aviso.hidden = true;
  aviso.textContent = "";
}

// ------------------------------------------------------------
// SINCRONIZAR O CARRINHO COM O CARDÁPIO ATUAL
// ------------------------------------------------------------
// Recebe a lista de produtos disponíveis (a mesma da rota /api/produtos)
// e compara com o carrinho salvo no navegador:
//   - produto que não está mais na lista (esgotado/excluído) sai do carrinho;
//   - produto com preço diferente recebe o preço atual.
// Se algo mudar, o cliente vê um aviso dentro do carrinho.
// Também é chamada pelo produtos.js quando o cardápio termina de carregar.
function sincronizarCarrinho(produtos) {
  // Map: id do produto -> dados atuais vindos do Sanity.
  const atuais = new Map(produtos.map((produto) => [produto._id, produto]));
  const removidos = [];
  const alterados = [];

  // filter mantém no carrinho só os itens que continuam disponíveis.
  cart = cart.filter((item) => {
    const produto = atuais.get(item.id);

    if (!produto) {
      removidos.push(`${item.name} não está mais disponível`);
      return false;
    }

    if (produto.preco !== item.price) {
      alterados.push(`${produto.nome} agora custa ${money(produto.preco)}`);
      item.price = produto.preco;
    }

    // Mantém nome e imagem iguais aos do cardápio.
    item.name = produto.nome;
    if (produto.imagem) item.image = produto.imagem;
    return true;
  });

  // Nada mudou: não precisa salvar nem avisar.
  if (!removidos.length && !alterados.length) return;

  saveCart();
  renderCart();
  mostrarAvisoCarrinho(
    `Atualizamos seu carrinho: ${[...removidos, ...alterados].join("; ")}.`
  );
}

// ------------------------------------------------------------
// ATUALIZAR PREÇOS DO CARDÁPIO NA TELA
// ------------------------------------------------------------
// Atualiza o preço exibido em cada card sem recarregar a página.
// Se o produto ficou indisponível, o botão "Adicionar ao carrinho" é desativado;
// se voltou a ficar disponível, o botão é reativado.
function atualizarPrecosDoCardapio(produtos) {
  const atuais = new Map(produtos.map((produto) => [produto._id, produto]));

  document.querySelectorAll(".card[data-id]").forEach((card) => {
    const produto = atuais.get(card.dataset.id);
    const botao = card.querySelector(".add-to-cart");
    // O preço é o primeiro parágrafo direto do card (criado pelo produtos.js).
    const preco = card.querySelector(":scope > p");

    if (!produto) {
      if (botao) {
        botao.disabled = true;
        botao.textContent = "Indisponível no momento";
      }
      return;
    }

    card.dataset.price = produto.preco;
    if (preco) preco.textContent = money(produto.preco);
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Adicionar ao carrinho";
    }
  });
}

// ------------------------------------------------------------
// BUSCAR O CARDÁPIO ATUAL NO SERVIDOR
// ------------------------------------------------------------
// Consulta /api/produtos (dados atuais do Sanity) e atualiza
// os preços na tela e o carrinho, sem recarregar a página.
// É chamada ao abrir o carrinho e quando o cliente volta para a aba do site.
let atualizandoCardapio = false;

async function atualizarCardapioECarrinho() {
  // Evita duas consultas ao mesmo tempo.
  if (atualizandoCardapio) return;
  atualizandoCardapio = true;

  try {
    const response = await fetch("/api/produtos", {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return;

    const produtos = await response.json();
    if (!Array.isArray(produtos)) return;

    atualizarPrecosDoCardapio(produtos);
    sincronizarCarrinho(produtos);
  } catch {
    // Sem conexão no momento: mantemos a tela como está.
    // A conferência final no servidor (validar-pedido.js) continua protegendo o pedido.
  } finally {
    atualizandoCardapio = false;
  }
}

// Quando o cliente volta para a aba do site, confere se algo mudou
// (somente se houver itens no carrinho, para evitar consultas desnecessárias).
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && cart.length) atualizarCardapioECarrinho();
});

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------
// Executa uma primeira renderização quando a página é carregada.
renderCart();
// Mostra uma mensagem quando o produto é adicionado ao carrinho
function mostrarPopupCarrinho() {

    // Procura no HTML o elemento que possui o id "popup-carrinho"
    const popup = document.getElementById("popup-carrinho");

    // Adiciona a classe "mostrar", deixando o popup visível
    popup.classList.add("mostrar");

    // Espera 2 segundos antes de esconder novamente
    setTimeout(function() {

        // Remove a classe "mostrar"
        popup.classList.remove("mostrar");

    }, 2000);
}
