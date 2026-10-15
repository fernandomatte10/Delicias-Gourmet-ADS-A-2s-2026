// ============================================================
// SERVIDOR DA DELÍCIAS GOURMET
// ============================================================
// Este arquivo é o backend da aplicação.
// Ele usa Node.js + Express para:
//   1. Servir o site (HTML, CSS, JavaScript e imagens).
//   2. Receber os pedidos enviados pelo carrinho.
//   3. Salvar os pedidos no arquivo data/pedidos.json.
//   4. Disponibilizar uma rota para consultar os pedidos.
//
// Para iniciar o servidor:
//   npm install
//   npm start
//
// Depois acesse:
//   http://localhost:3000
// ============================================================

const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const {consultarFuncionamento} = require("./funcionamento");
const {ordenarProdutos} = require("./ordenar-produtos");
const {validarItens, mensagemRevisao, consultarProdutos} = require("./validar-pedido");

// Cria a aplicação Express.
const app = express();

// Permite alterar a porta por variável de ambiente.
// Se nenhuma porta for informada, usamos a 3000.
const PORT = process.env.PORT || 3000;

// Caminhos usados para armazenar os pedidos.
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "pedidos.json");

// Permite que o servidor receba dados JSON enviados pelo frontend.
// O limite evita receber requisições exageradamente grandes.
app.use(express.json({ limit: "100kb" }));

// Publica a pasta do projeto.
// Assim o Express consegue entregar index.html, CSS, JS, imagens etc.
app.use(express.static(__dirname));

// ------------------------------------------------------------
// PÁGINA PRINCIPAL
// ------------------------------------------------------------
// Quando o cliente acessar http://localhost:3000,
// mostramos o index.html do site.
// Lê somente produtos publicados e disponíveis, sem instalar dependências.
// A consulta acontece no servidor: o navegador acessa apenas /api/produtos.
app.get("/api/produtos", async (_req, res) => {
  try {
    const projectId = process.env.SANITY_PROJECT_ID || "9bplldxn";
    const dataset = process.env.SANITY_DATASET || "production";
    const url = new URL(`https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}`);
    url.searchParams.set("perspective", "published");
    // Uma consulta traz os produtos publicados e a ordem salva pelo painel.
    // A ordenação em arquivo separado mantém a regra fácil de estudar e testar.
    url.searchParams.set("query", '{"produtos": *[_type == "produto" && disponivel == true] {_id, nome, descricao, preco, "imagem": imagem.asset->url, "categoria": categoria->nome, "categoriaId": categoria._ref}, "ordem": *[_id == "ordemCardapio"][0]{categorias, produtos}}');
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Sanity respondeu com status ${response.status}`);
    const { result } = await response.json();
    if (!Array.isArray(result?.produtos)) throw new Error("Resposta inválida do Sanity");
    const produtos = result.produtos.filter((produto) =>
      typeof produto._id === "string" && typeof produto.nome === "string" &&
      produto.nome.trim() && Number.isFinite(produto.preco) && produto.preco >= 0
    );
    res.set("Cache-Control", "no-store").json(ordenarProdutos(produtos, result.ordem));
  } catch (error) {
    console.error("Erro ao consultar produtos:", error.message);
    res.status(502).json({ error: "Não foi possível carregar o cardápio." });
  }
});


// Consulta pública apenas do status e dos horários da loja.
app.get("/api/funcionamento", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  try { res.json(await consultarFuncionamento()); }
  catch { res.status(503).json({aceitaPedidos: false, mensagem: "Não foi possível confirmar o funcionamento da loja."}); }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ------------------------------------------------------------
// FUNÇÃO: readOrders
// ------------------------------------------------------------
// Lê o arquivo que contém os pedidos.
// Se o arquivo ainda não existir ou estiver vazio/inválido,
// retornamos um array vazio para o sistema continuar funcionando.
async function readOrders() {
  try {
    return JSON.parse(await fs.readFile(ORDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

// ------------------------------------------------------------
// POST /api/pedidos
// ------------------------------------------------------------
// Recebe um novo pedido enviado pelo carrinho.
//
// Exemplo de dados recebidos:
// {
//   customer: { nome, tipo, endereco, observacoes },
//   items: [{ name, price, quantity, image }],
//   total: 50,
//   createdAt: "..."
// }
//
// IMPORTANTE: o total, os nomes e os preços enviados pelo navegador
// NÃO são considerados como fonte de verdade. O servidor busca cada
// produto no Sanity (validar-pedido.js) e recalcula o total.
app.post("/api/pedidos", async (req, res) => {
  try {
    const { customer, items, total, createdAt } = req.body || {};

    // Validação básica do cliente e dos itens.
    if (!customer?.nome || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Pedido inválido." });
    }

    // RF-05: bloquear no servidor é obrigatório; desabilitar o botão sozinho não basta.
    // Se a consulta falhar, nenhum pedido é gravado e o cliente mantém seu carrinho.
    let funcionamento;
    try { funcionamento = await consultarFuncionamento(); }
    catch { return res.status(503).json({error: "Não foi possível confirmar se a loja está aberta. Tente novamente."}); }
    if (!funcionamento.aceitaPedidos) {
      return res.status(409).json({error: funcionamento.mensagem, funcionamento});
    }

    // SEGURANÇA: confere no Sanity cada item do carrinho antes de gravar.
    // O navegador informa só o id e a quantidade de cada produto;
    // nome, preço e disponibilidade gravados são os oficiais do Sanity.
    // A regra completa está explicada em validar-pedido.js.
    let verificacao;
    try {
      // 1. Busca no Sanity os produtos que estão no carrinho (pelos ids).
      const produtosSanity = await consultarProdutos(items.map((item) => item?.id));
      // 2. Compara o carrinho com os dados oficiais.
      verificacao = validarItens(items, produtosSanity);
    } catch {
      // Se o Sanity não responder, NÃO gravamos o pedido sem conferir.
      // Status 503 = serviço temporariamente indisponível.
      return res.status(503).json({ error: "Não foi possível confirmar os produtos do pedido. Tente novamente." });
    }

    // Dados enviados inválidos (ex.: quantidade 0 ou acima de 99).
    // Status 400 = requisição inválida.
    if (verificacao.erro) {
      return res.status(400).json({ error: verificacao.erro });
    }

    // Algum item está esgotado/excluído ou mudou de preço:
    // nada é gravado e o carrinho.js atualiza o carrinho para o cliente revisar.
    // Status 409 = conflito entre o carrinho e os dados atuais.
    if (verificacao.indisponiveis.length || verificacao.alterados.length) {
      return res.status(409).json({
        error: mensagemRevisao(verificacao),
        indisponiveis: verificacao.indisponiveis,
        alterados: verificacao.alterados,
      });
    }
    // Itens aprovados, já com nome e preço oficiais do Sanity.
    const cleanItems = verificacao.validos;

    // Recalcula o valor total no servidor.
    const calculatedTotal = cleanItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Cria o pedido que será salvo.
    // crypto.randomUUID() gera um identificador único para o pedido.
    const order = {
      id: crypto.randomUUID().slice(0, 8).toUpperCase(),
      customer: {
        nome: String(customer.nome).slice(0, 80),
        tipo: customer.tipo === "entrega" ? "entrega" : "retirada",
        endereco: String(customer.endereco || "").slice(0, 180),
        observacoes: String(customer.observacoes || "").slice(0, 300),
      },
      items: cleanItems,
      total: Number(calculatedTotal.toFixed(2)),
      createdAt: createdAt || new Date().toISOString(),
    };

    // Busca os pedidos existentes e adiciona o novo pedido.
    const orders = await readOrders();
    orders.push(order);

    // Cria a pasta data caso ela ainda não exista.
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Salva todos os pedidos novamente no arquivo JSON.
    // O null, 2 deixa o arquivo formatado e fácil de ler.
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));

    // Responde ao navegador informando que o pedido foi criado.
    res.status(201).json(order);
  } catch (error) {
    console.error("Erro ao registrar pedido:", error);
    res.status(500).json({ error: "Erro interno ao registrar pedido." });
  }
});

// ------------------------------------------------------------
// GET /api/pedidos
// ------------------------------------------------------------
// Retorna todos os pedidos salvos.
// Esta rota é útil para testes e para um futuro painel administrativo.
// Em produção, ela deve ter autenticação.
app.get("/api/pedidos", async (_req, res) => {
  res.json(await readOrders());
});

// ------------------------------------------------------------
// INICIA O SERVIDOR
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Delícias Gourmet rodando em http://localhost:${PORT}`);
});
