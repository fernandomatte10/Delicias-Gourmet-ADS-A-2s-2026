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
// O HTML do site contém os produtos do cardápio.
// O Node.js fica responsável pelo backend e pelo registro do pedido.
// ============================================================

// Número do WhatsApp que receberá os pedidos.
// Formato internacional: 55 + DDD + número, sem espaços ou símbolos.
const WHATSAPP = "554598352808";

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
  checkout.disabled = cart.length === 0;
  clear.disabled = cart.length === 0;

  // Mostra a mensagem de carrinho vazio somente quando necessário.
  empty.hidden = cart.length !== 0;

  // Monta visualmente cada produto do carrinho.
  container.innerHTML = cart
    .map(
      (item, index) => `
    <article class="cart-item">
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <h3>${item.name}</h3>
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
  const price = Number(
    card
      .querySelector("p")
      .textContent.replace(/[^0-9,]/g, "")
      .replace(",", ".")
  );

  // Caminho da imagem do produto.
  const image = card.querySelector("img").getAttribute("src");

  // Verifica se o produto já está no carrinho.
  const found = cart.find((item) => item.name === name);

  if (found) {
    // Se já existe, apenas aumenta a quantidade.
    found.quantity += 1;
  } else {
    // Se é um produto novo, adiciona com quantidade 1.
    cart.push({ name, price, image, quantity: 1 });
  }

  // Salva e atualiza a tela.
  saveCart();
  renderCart();

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
    addToCart(add.closest(".card"));
  }

  // Botões internos do carrinho: +, -, Remover.
  const action = event.target.closest("[data-action]");

  if (action) {
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
  if (!cart.length) return;

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
      throw new Error("Falha ao registrar pedido");
    }

    const saved = await response.json();

    // Monta uma mensagem completa para o WhatsApp.
    const lines = [
      "*Novo pedido - Delícias Gourmet*",
      `Pedido: #${saved.id}`,
      "",
      "*Itens do pedido:*",
      ...cart.map(
        (item) =>
          `${item.quantity}x ${item.name} — ${money(item.price * item.quantity)}`
      ),
      "",
      `*Total: ${money(totalCart())}*`,
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
    alert(
      "Não foi possível registrar o pedido. Verifique se o Node.js está rodando."
    );
  } finally {
    button.disabled = cart.length === 0;
    button.textContent = "Finalizar pedido pelo WhatsApp";
  }
});

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------
// Executa uma primeira renderização quando a página é carregada.
renderCart();
