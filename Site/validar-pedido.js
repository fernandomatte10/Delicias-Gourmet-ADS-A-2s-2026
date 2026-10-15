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

// Quantidade máxima de unidades de um mesmo produto em um pedido.
// Evita pedidos absurdos, como 5000 unidades de um item.
const MAX_QUANTIDADE = 99;

// Quantidade máxima de produtos diferentes em um mesmo pedido.
// Evita que alguém envie listas enormes para sobrecarregar o servidor.
const MAX_ITENS = 50;

// Converte um número para o formato de moeda brasileiro.
// Exemplo: 27 -> "R$ 27,00"
const dinheiro = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ------------------------------------------------------------
// FUNÇÃO: validarItens
// ------------------------------------------------------------
// Compara os itens enviados pelo carrinho com os produtos do Sanity.
//
// Parâmetros:
//   itens    -> lista enviada pelo navegador: [{ id, name, price, quantity }]
//   produtos -> lista vinda do Sanity:        [{ _id, nome, preco, disponivel, imagem }]
//
// Retorno:
//   { erro }  -> quando os dados enviados são inválidos (ex.: quantidade 0).
//   ou
//   {
//     validos,        -> itens aprovados, já com nome e preço OFICIAIS do Sanity;
//     indisponiveis,  -> itens esgotados, excluídos ou não publicados;
//     alterados       -> itens cujo preço no carrinho é diferente do Sanity.
//   }
function validarItens(itens, produtos) {
  // O pedido precisa ter pelo menos 1 item e no máximo MAX_ITENS.
  if (!Array.isArray(itens) || itens.length === 0 || itens.length > MAX_ITENS) {
    return { erro: "Itens inválidos." };
  }

  // Transforma a lista do Sanity em um Map (id -> produto).
  // Assim conseguimos encontrar um produto pelo id de forma rápida e simples.
  const catalogo = new Map(
    (Array.isArray(produtos) ? produtos : []).map((produto) => [produto._id, produto])
  );

  // Listas que serão preenchidas durante a conferência.
  const validos = [];
  const indisponiveis = [];
  const alterados = [];

  // Confere cada item do carrinho, um por vez.
  for (const item of itens) {
    // A quantidade precisa ser um número inteiro entre 1 e MAX_QUANTIDADE.
    // Number.isInteger recusa valores como 1.5, "abc" ou vazio.
    const quantidade = Number(item?.quantity);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_QUANTIDADE) {
      return { erro: "Quantidade inválida." };
    }

    // Procura o produto no catálogo do Sanity usando o id enviado pelo carrinho.
    // Se o id não for um texto (ex.: item antigo sem id), o produto não é encontrado.
    const produto = typeof item.id === "string" ? catalogo.get(item.id) : undefined;

    // O produto NÃO pode ser vendido quando:
    //   - não existe mais no Sanity (foi excluído ou despublicado);
    //   - está marcado como indisponível (esgotado);
    //   - está com um preço inválido no cadastro.
    if (
      !produto ||
      produto.disponivel !== true ||
      !Number.isFinite(produto.preco) ||
      produto.preco < 0
    ) {
      indisponiveis.push({
        id: typeof item.id === "string" ? item.id : null,
        // O nome vem do carrinho só para montar a mensagem ao cliente.
        name: String(item?.name || "Produto").slice(0, 120),
      });
      // "continue" pula para o próximo item, sem adicionar este aos válidos.
      continue;
    }

    // Se o preço do carrinho for diferente do preço oficial, avisamos o cliente.
    // Não trocamos o preço "em silêncio": o cliente precisa ver o valor novo
    // antes de enviar o pedido.
    if (Number(item.price) !== produto.preco) {
      alterados.push({ id: produto._id, name: produto.nome, price: produto.preco });
    }

    // Item aprovado: usamos SEMPRE os dados oficiais do Sanity.
    validos.push({
      id: produto._id,
      name: produto.nome,
      price: produto.preco,
      quantity: quantidade,
      image: produto.imagem || "",
    });
  }

  return { validos, indisponiveis, alterados };
}

// ------------------------------------------------------------
// FUNÇÃO: mensagemRevisao
// ------------------------------------------------------------
// Monta o texto mostrado ao cliente quando o carrinho precisa ser revisado.
// Exemplo de resultado:
//   "Seu carrinho foi atualizado: Pastel de Frango não está mais disponível;
//    o preço de Shawarma de Carne agora é R$ 27,00. Revise o carrinho e
//    finalize novamente."
function mensagemRevisao({ indisponiveis, alterados }) {
  // Junta em uma única lista as frases dos itens indisponíveis e dos alterados.
  const partes = [
    ...indisponiveis.map((item) => `${item.name} não está mais disponível`),
    ...alterados.map((item) => `o preço de ${item.name} agora é ${dinheiro(item.price)}`),
  ];

  // join("; ") separa as frases com ponto e vírgula.
  return `Seu carrinho foi atualizado: ${partes.join("; ")}. Revise o carrinho e finalize novamente.`;
}

// ------------------------------------------------------------
// FUNÇÃO: consultarProdutos
// ------------------------------------------------------------
// Busca no Sanity somente os produtos que estão no carrinho.
// Usa a versão PUBLICADA (rascunhos não publicados são ignorados).
//
// Parâmetro:
//   ids -> lista de ids dos produtos do carrinho.
//
// Retorno:
//   lista de produtos encontrados no Sanity.
//   Se a consulta falhar, lança um erro; o server.js responde com
//   status 503 e NÃO grava o pedido.
async function consultarProdutos(ids) {
  // Remove ids inválidos e repetidos (Set guarda cada valor uma única vez).
  const unicos = [...new Set(ids.filter((id) => typeof id === "string" && id))];

  // Se nenhum item tiver id válido, nem precisamos consultar o Sanity.
  if (!unicos.length) return [];

  // Mesmo projeto e dataset usados em server.js e funcionamento.js.
  const project = process.env.SANITY_PROJECT_ID || "9bplldxn";
  const dataset = process.env.SANITY_DATASET || "production";

  // Monta a URL da API de consultas do Sanity.
  const url = new URL(`https://${project}.api.sanity.io/v2025-02-19/data/query/${dataset}`);

  // Considera apenas documentos publicados.
  url.searchParams.set("perspective", "published");

  // Consulta GROQ: produtos cujo _id está na lista $ids.
  // Trazemos apenas os campos necessários para validar o pedido.
  url.searchParams.set(
    "query",
    '*[_type == "produto" && _id in $ids]{_id, nome, preco, disponivel, "imagem": imagem.asset->url}'
  );

  // O valor de $ids é enviado separado da consulta, em formato JSON.
  // Isso evita montar a consulta "colando" textos vindos do navegador.
  url.searchParams.set("$ids", JSON.stringify(unicos));

  // Faz a requisição com limite de 8 segundos de espera.
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Falha ao consultar produtos");

  // A resposta do Sanity vem no formato { result: [...] }.
  const dados = await response.json();
  if (!Array.isArray(dados.result)) throw new Error("Resposta inválida");

  return dados.result;
}

// Exporta as funções para serem usadas pelo server.js e pelos testes.
module.exports = { validarItens, mensagemRevisao, consultarProdutos };
