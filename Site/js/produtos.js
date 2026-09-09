// Consulta o servidor do site e mantém as classes do cardápio existente.
(async function carregarProdutos() {
  const container = document.getElementById("produtos-sanity");
  const status = document.getElementById("produtos-status");
  const fallback = "img/logo-delicias-gourmet.png";
  try {
    const response = await fetch("/api/produtos", { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Falha ao consultar o cardápio");
    const produtos = await response.json();
    if (!Array.isArray(produtos)) throw new Error("Resposta inválida");
    const fragment = document.createDocumentFragment();
    const categorias = new Map();
    for (const produto of produtos) {
      const categoria = produto.categoria || "Outros produtos";
      if (!categorias.has(categoria)) categorias.set(categoria, []);
      categorias.get(categoria).push(produto);
    }
    for (const [categoria, itens] of categorias) {
      const titulo = document.createElement("div");
      titulo.className = "titulosalgado";
      const heading = document.createElement("h2");
      heading.textContent = categoria;
      titulo.append(heading);
      const grid = document.createElement("div");
      grid.className = "divsshawarma";
      for (const produto of itens) {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.id = produto._id;
        card.dataset.price = produto.preco;
        const img = document.createElement("img");
        img.src = produto.imagem || fallback;
        img.alt = produto.nome;
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => { img.src = fallback; }, { once: true });
        const nome = document.createElement("h3");
        nome.textContent = produto.nome;
        const preco = document.createElement("p");
        preco.textContent = produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        card.append(img, nome, preco);
        if (produto.descricao) {
          const descricao = document.createElement("p");
          descricao.textContent = produto.descricao;
          card.append(descricao);
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button add-to-cart";
        button.textContent = "Adicionar ao carrinho";
        card.append(button);
        grid.append(card);
      }
      fragment.append(titulo, grid);
    }
    container.replaceChildren(fragment);
    status.textContent = produtos.length ? "" : "Nenhum produto disponível no momento.";
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    status.textContent = "Não foi possível carregar o cardápio. ";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "button";
    retry.textContent = "Tentar novamente";
    retry.addEventListener("click", () => {
      status.textContent = "Carregando cardápio...";
      carregarProdutos();
    });
    status.append(retry);
  }
})();
