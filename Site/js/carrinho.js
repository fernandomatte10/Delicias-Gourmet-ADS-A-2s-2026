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


const WHATSAPP = "5544998860173";
const API_URL = "/api/pedidos";
const CART_KEY = "delicias-gourmet-carrinho";

// Adicionais permitidos e seus preços oficiais.
const ADICIONAIS = {
  "Catupiry": 5,
  "Cheddar": 5,
  "Cream cheese": 5,
  "Calabresa": 5,
  "Bacon": 5,
};

// Recupera o carrinho salvo no navegador.
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

// Garante que itens antigos tenham uma lista de adicionais.
cart.forEach((item) => {
  if (!Array.isArray(item.adicionais)) item.adicionais = [];
});

const $ = (id) => document.getElementById(id);

// Formata valores como moeda brasileira.
const money = (value) =>
  Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

// Preço total dos adicionais de uma unidade.
function totalAdicionais(item) {
  return (item.adicionais || []).reduce(
    (sum, nome) => sum + (ADICIONAIS[nome] || 0),
    0
  );
}

// Preço de uma unidade, incluindo os adicionais.
function precoUnitario(item) {
  return Number(item.price) + totalAdicionais(item);
}

// Identifica se o produto é um shawarma.
function ehShawarma(item) {
  return String(item.categoria || "").toLowerCase().includes("shawarma");
}

// Salva o carrinho no navegador.
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Quantidade total de unidades no carrinho.
function totalItems() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Soma os preços dos produtos e seus adicionais.
function totalCart() {
  return cart.reduce(
    (sum, item) => sum + precoUnitario(item) * item.quantity,
    0
  );
}

// Evita que nomes de produtos sejam interpretados como HTML.
function escapeCartText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

// ------------------------------------------------------------
// RENDERIZAÇÃO DO CARRINHO
// ------------------------------------------------------------
function renderCart() {
  const container = $("cart-items");
  const empty = $("cart-empty");
  const total = $("cart-total");
  const count = $("cart-count");
  const clear = $("clear-cart");

  count.textContent = totalItems();
  total.textContent = money(totalCart());

  window.atualizarBotaoPedido();
  clear.disabled = cart.length === 0;
  empty.hidden = cart.length !== 0;

  container.innerHTML = cart.map((item, index) => {
    const adicionais = item.adicionais || [];
    const shawarma = ehShawarma(item);
    const aberto = item.adicionaisAberto === true;

    // Cria as opções de adicionais somente para shawarmas.
    const opcoes = shawarma
      ? Object.entries(ADICIONAIS).map(([nome, preco]) => `
          <label class="cart-addon-option">
            <input
              type="checkbox"
              class="cart-addon-checkbox"
              data-index="${index}"
              value="${escapeCartText(nome)}"
              ${adicionais.includes(nome) ? "checked" : ""}
            />
            <span class="cart-addon-circle"></span>
            <span class="cart-addon-name">${escapeCartText(nome)}</span>
            <span class="cart-addon-price">+ ${money(preco)}</span>
          </label>
        `).join("")
      : "";

    return `
      <article class="cart-item">
        <img
          src="${escapeCartText(item.image || "")}"
          alt="${escapeCartText(item.name)}"
        />

        <div class="cart-item-details">
          <h3>${escapeCartText(item.name)}</h3>

          <div class="cart-item-price">
            ${money(item.price)} cada
          </div>

          ${shawarma ? `
            <button
              type="button"
              class="cart-addons-toggle"
              data-action="toggle-addons"
              data-index="${index}"
              aria-expanded="${aberto}"
            >
              <span>Adicionais</span>
              <img
                src="img/seta.png"
                alt=""
                class="${aberto ? "cart-addons-arrow aberto" : "cart-addons-arrow"}"
              />
            </button>

            <div class="cart-addons-list" ${aberto ? "" : "hidden"}>
              ${opcoes}
            </div>

            ${adicionais.length ? `
              <div class="cart-selected-addons">
                Adicionais escolhidos:
                ${adicionais.map(escapeCartText).join(", ")}
                (+ ${money(totalAdicionais(item))})
              </div>
            ` : ""}
          ` : ""}

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
          >Remover</button>
        </div>

        <div class="cart-item-total">
          ${money(precoUnitario(item) * item.quantity)}
        </div>
      </article>
    `;
  }).join("");
}

// ------------------------------------------------------------
// ADICIONAR PRODUTO
// ------------------------------------------------------------
function addToCart(card) {
  const name = card.querySelector("h3").textContent.trim();

  const price = card.dataset.price !== undefined
    ? Number(card.dataset.price)
    : Number(
        card.querySelector("p").textContent
          .replace(/[^0-9,]/g, "")
          .replace(",", ".")
      );

  const image = card.querySelector("img").getAttribute("src");
  const id = card.dataset.id;

  // Descobre a categoria pelo título que fica antes da grade.
  const grade = card.closest(".divsshawarma");
  const categoria = grade?.previousElementSibling
    ?.querySelector("h2")?.textContent.trim() || "";

  // Shawarmas são separados para permitir adicionais diferentes.
  // Os outros produtos continuam sendo agrupados como antes.
  const found = categoria.toLowerCase().includes("shawarma")
    ? undefined
    : cart.find((item) =>
        id ? item.id === id : item.name === name
      );

  if (found) {
    found.quantity += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      image,
      categoria,
      quantity: 1,
      adicionais: [],
      adicionaisAberto: false,
    });
  }

  saveCart();
  renderCart();
  mostrarPopupCarrinho();
}

// ------------------------------------------------------------
// CLIQUES E SELEÇÃO DOS ADICIONAIS
// ------------------------------------------------------------
document.addEventListener("click", (event) => {
  const add = event.target.closest(".add-to-cart");

  if (add) {
    esconderAvisoCarrinho();
    addToCart(add.closest(".card"));
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  esconderAvisoCarrinho();

  const index = Number(action.dataset.index);
  const item = cart[index];

  if (!item) return;

  if (action.dataset.action === "toggle-addons") {
    item.adicionaisAberto = !item.adicionaisAberto;
  }

  if (action.dataset.action === "increase") {
    item.quantity++;
  }

  if (action.dataset.action === "decrease") {
    item.quantity--;
  }

  if (
    action.dataset.action === "remove" ||
    item.quantity <= 0
  ) {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
});

// Trata a marcação e desmarcação dos adicionais.
document.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".cart-addon-checkbox");
  if (!checkbox) return;

  const index = Number(checkbox.dataset.index);
  const item = cart[index];

  if (!item || !ehShawarma(item)) return;

  const nome = checkbox.value;

  if (checkbox.checked) {
    if (!item.adicionais.includes(nome)) {
      item.adicionais.push(nome);
    }
  } else {
    item.adicionais = item.adicionais.filter(
      (adicional) => adicional !== nome
    );
  }

  esconderAvisoCarrinho();
  saveCart();
  renderCart();
});

// ------------------------------------------------------------
// ABRIR E FECHAR O CARRINHO
// ------------------------------------------------------------
function openCart() {
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

closeCart();

$("cart-button").addEventListener("click", openCart);
$("cart-close").addEventListener("click", closeCart);
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
// FINALIZAR PEDIDO PELO WHATSAPP
// ------------------------------------------------------------
$("checkout-button").addEventListener("click", async () => {
  if (!cart.length || window.pedidoEmEnvio || !window.estadoLoja.aceitaPedidos) return;

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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const falha = await response.json().catch(() => ({}));

      if (falha.funcionamento) {
        window.aplicarEstadoLoja(falha.funcionamento);
      } else if (response.status === 503) {
        window.aplicarEstadoLoja({
          aceitaPedidos: false,
          mensagem: falha.error || "Não foi possível confirmar o funcionamento da loja.",
        });
      }

      if (falha.indisponiveis || falha.alterados) {
        atualizarCarrinhoComServidor(falha);
      }

      throw new Error(falha.error || "Falha ao registrar pedido");
    }

    const saved = await response.json();

    const lines = [
      "*Novo pedido - Delícias Gourmet*",
      `Pedido: #${saved.id}`,
      "",
      "*Itens do pedido:*",
    ];

    // Inclui cada produto e seus adicionais na mensagem.
    for (const item of saved.items) {
      lines.push(
  `${item.quantity}x ${item.name} — ${money(
    item.price * item.quantity
  )}`
);

      for (const nome of item.adicionais || []) {
        lines.push(`   + ${nome}: ${money(ADICIONAIS[nome] || 0)} por unidade`);
      }
    }

    lines.push("", `*Total: ${money(saved.total)}*`);

    if (observations) {
      lines.push("", `*Observações:* ${observations}`);
    }

    const whatsappUrl =
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;

    // Limpa o carrinho após o pedido ser registrado.
    cart = [];
    saveCart();
    $("order-observations").value = "";
    renderCart();
    closeCart();

    window.location.href = whatsappUrl;
  } catch (error) {
    console.error("Erro ao finalizar pedido:", error);
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
function atualizarCarrinhoComServidor({ indisponiveis = [], alterados = [] }) {
  const removidos = new Set(indisponiveis.map((item) => item.id));

  cart = cart.filter(
    (item) => !removidos.has(typeof item.id === "string" ? item.id : null)
  );

  for (const novo of alterados) {
    for (const item of cart.filter((i) => i.id === novo.id)) {
      item.price = novo.price;
      item.name = novo.name;
    }
  }

  saveCart();
  renderCart();
}

// ------------------------------------------------------------
// AVISOS DO CARRINHO
// ------------------------------------------------------------
function mostrarAvisoCarrinho(mensagem) {
  const aviso = $("carrinho-aviso");
  aviso.textContent = mensagem;
  aviso.hidden = false;
}

function esconderAvisoCarrinho() {
  const aviso = $("carrinho-aviso");
  aviso.hidden = true;
  aviso.textContent = "";
}

// ------------------------------------------------------------
// SINCRONIZAR COM O CARDÁPIO ATUAL
// ------------------------------------------------------------
function sincronizarCarrinho(produtos) {
  const atuais = new Map(produtos.map((produto) => [produto._id, produto]));
  const removidos = [];
  const alterados = [];

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

    item.name = produto.nome;
    if (produto.imagem) item.image = produto.imagem;

    // Atualiza a categoria para manter a regra dos adicionais.
    if (produto.categoria) {
      item.categoria = produto.categoria;
    }

    // Remove adicionais caso o produto não seja mais um shawarma.
    if (!ehShawarma(item)) {
      item.adicionais = [];
    }

    return true;
  });

  if (!removidos.length && !alterados.length) return;

  saveCart();
  renderCart();

  mostrarAvisoCarrinho(
    `Atualizamos seu carrinho: ${[...removidos, ...alterados].join("; ")}.`
  );
}

// ------------------------------------------------------------
// ATUALIZAR PREÇOS DO CARDÁPIO
// ------------------------------------------------------------
function atualizarPrecosDoCardapio(produtos) {
  const atuais = new Map(produtos.map((produto) => [produto._id, produto]));

  document.querySelectorAll(".card[data-id]").forEach((card) => {
    const produto = atuais.get(card.dataset.id);
    const botao = card.querySelector(".add-to-cart");
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
let atualizandoCardapio = false;

async function atualizarCardapioECarrinho() {
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
    // Sem conexão: mantém a tela atual.
    // O servidor continuará validando os itens na finalização.
  } finally {
    atualizandoCardapio = false;
  }
}

// Confere o cardápio quando o cliente volta para a aba.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && cart.length) {
    atualizarCardapioECarrinho();
  }
});

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------
renderCart();

// Mostra um aviso quando um produto é adicionado.
function mostrarPopupCarrinho() {
  const popup = document.getElementById("popup-carrinho");
  if (!popup) return;

  popup.classList.add("mostrar");

  setTimeout(() => {
    popup.classList.remove("mostrar");
  }, 2000);
}
