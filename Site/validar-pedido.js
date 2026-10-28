// ============================================================
// VALIDAÇÃO DOS ITENS DO PEDIDO - DELÍCIAS GOURMET
// ============================================================
// Este arquivo protege o registro dos pedidos.
//
// Problema que ele resolve:
//   O carrinho fica salvo no navegador do cliente (localStorage).
//   Qualquer pessoa pode alterar esses dados, e um produto pode
//   mudar de preço ou ficar esgotado depois de entrar no carrinho.
//
// Solução:
//   O navegador informa apenas QUAL produto (id) e QUANTAS unidades.
//   O servidor busca no Sanity o nome, o preço e a disponibilidade
//   oficiais de cada produto antes de gravar o pedido.
//
// A regra fica em um arquivo separado (assim como funcionamento.js)
// para poder ser testada sem internet: veja test/validar-pedido.test.cjs.
//
// Usado por: server.js, na rota POST /api/pedidos.
// ============================================================


// Quantidade máxima de unidades de um mesmo produto.
const MAX_QUANTIDADE = 99;

// Quantidade máxima de produtos diferentes em um pedido.
const MAX_ITENS = 50;

// Lista oficial de adicionais e seus preços por unidade.
const ADICIONAIS = {
  "Catupiry": 5,
  "Cheddar": 5,
  "Cream cheese": 5,
  "Calabresa": 5,
  "Bacon": 5,
};

// Converte um número para o formato de moeda brasileiro.
const dinheiro = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ------------------------------------------------------------
// FUNÇÃO: validarItens
// ------------------------------------------------------------
// Confere os itens enviados pelo carrinho usando os dados do Sanity.
function validarItens(itens, produtos) {
  // O pedido precisa ter pelo menos 1 item e no máximo MAX_ITENS.
  if (!Array.isArray(itens) || itens.length === 0 || itens.length > MAX_ITENS) {
    return { erro: "Itens inválidos." };
  }

  // Cria um catálogo para encontrar cada produto pelo seu id.
  const catalogo = new Map(
    (Array.isArray(produtos) ? produtos : []).map((produto) => [produto._id, produto])
  );

  // Listas preenchidas durante a conferência.
  const validos = [];
  const indisponiveis = [];
  const alterados = [];

  // Confere cada item do carrinho.
  for (const item of itens) {
    // A quantidade precisa ser um número inteiro entre 1 e 99.
    const quantidade = Number(item?.quantity);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_QUANTIDADE) {
      return { erro: "Quantidade inválida." };
    }

    // Procura o produto pelo id no catálogo oficial.
    const produto = typeof item.id === "string" ? catalogo.get(item.id) : undefined;

    // Recusa produtos inexistentes, indisponíveis ou com preço inválido.
    if (
      !produto ||
      produto.disponivel !== true ||
      !Number.isFinite(produto.preco) ||
      produto.preco < 0
    ) {
      indisponiveis.push({
        id: typeof item.id === "string" ? item.id : null,
        name: String(item?.name || "Produto").slice(0, 120),
      });
      continue;
    }

    // Confere se os adicionais foram enviados em uma lista.
    const adicionais = item.adicionais ?? [];
    if (!Array.isArray(adicionais)) {
      return { erro: "Adicionais inválidos." };
    }

    // Não permite selecionar o mesmo adicional mais de uma vez.
    if (new Set(adicionais).size !== adicionais.length) {
      return { erro: "Não é permitido repetir um adicional no mesmo item." };
    }

    // Confere se todos os adicionais existem na lista oficial.
    if (
      !adicionais.every((nome) =>
        Object.prototype.hasOwnProperty.call(ADICIONAIS, nome)
      )
    ) {
      return { erro: "Um dos adicionais selecionados é inválido." };
    }

    // Só permite adicionais em produtos cuja categoria seja shawarma.
    if (
      adicionais.length > 0 &&
      !String(produto.categoria || "").toLowerCase().includes("shawarma")
    ) {
      return { erro: "Adicionais só podem ser escolhidos para shawarmas." };
    }

    // Avisa quando o preço do produto mudou no Sanity.
    if (Number(item.price) !== produto.preco) {
      alterados.push({
        id: produto._id,
        name: produto.nome,
        price: produto.preco,
      });
    }

    // Calcula o preço dos adicionais usando os valores oficiais.
    const adicionaisTotal = adicionais.reduce(
      (soma, nome) => soma + ADICIONAIS[nome],
      0
    );

    // Guarda o item com os dados oficiais e os adicionais validados.
    validos.push({
      id: produto._id,
      name: produto.nome,
      price: produto.preco,
      quantity: quantidade,
      image: produto.imagem || "",
      adicionais,
      adicionaisTotal,
    });
  }

  // Mantém o formato de retorno usado pelo server.js.
  return { validos, indisponiveis, alterados };
}

// ------------------------------------------------------------
// FUNÇÃO: mensagemRevisao
// ------------------------------------------------------------
// Monta a mensagem quando há produtos indisponíveis ou preços alterados.
function mensagemRevisao({ indisponiveis, alterados }) {
  const partes = [
    ...indisponiveis.map((item) => `${item.name} não está mais disponível`),
    ...alterados.map((item) => `o preço de ${item.name} agora é ${dinheiro(item.price)}`),
  ];

  return `Seu carrinho foi atualizado: ${partes.join("; ")}. Revise o carrinho e finalize novamente.`;
}

// ------------------------------------------------------------
// FUNÇÃO: consultarProdutos
// ------------------------------------------------------------
// Busca no Sanity os produtos do carrinho, incluindo sua categoria.
async function consultarProdutos(ids) {
  // Remove ids inválidos e repetidos.
  const unicos = [...new Set(ids.filter((id) => typeof id === "string" && id))];

  // Não consulta o Sanity se não houver ids válidos.
  if (!unicos.length) return [];

  // Usa o projeto e o dataset configurados para o site.
  const project = process.env.SANITY_PROJECT_ID || "9bplldxn";
  const dataset = process.env.SANITY_DATASET || "production";

  // Monta a URL da API de consultas do Sanity.
  const url = new URL(`https://${project}.api.sanity.io/v2025-02-19/data/query/${dataset}`);

  // Considera apenas documentos publicados.
  url.searchParams.set("perspective", "published");

  // Busca também a categoria para validar os adicionais.
  url.searchParams.set(
    "query",
    '*[_type == "produto" && _id in $ids]{_id, nome, preco, disponivel, "imagem": imagem.asset->url, "categoria": categoria->nome}'
  );

  // Envia os ids como parâmetro da consulta.
  url.searchParams.set("$ids", JSON.stringify(unicos));

  // Consulta o Sanity com limite de 8 segundos.
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Falha ao consultar produtos");

  // Confere o formato da resposta.
  const dados = await response.json();
  if (!Array.isArray(dados.result)) throw new Error("Resposta inválida");

  return dados.result;
}

// Exporta as funções para o servidor e os testes.
module.exports = { validarItens, mensagemRevisao, consultarProdutos };
