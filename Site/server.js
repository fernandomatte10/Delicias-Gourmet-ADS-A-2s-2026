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
// IMPORTANTE: o total enviado pelo navegador NÃO é considerado
// como fonte de verdade. O servidor recalcula o total usando
// os produtos recebidos.
app.post("/api/pedidos", async (req, res) => {
  try {
    const { customer, items, total, createdAt } = req.body || {};

    // Validação básica do cliente e dos itens.
    if (!customer?.nome || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Pedido inválido." });
    }

    // Limpa e limita os dados dos produtos antes de salvar.
    const cleanItems = items
      .map((item) => ({
        name: String(item.name).slice(0, 120),
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: String(item.image || ""),
      }))
      .filter(
        (item) =>
          item.name &&
          item.price >= 0 &&
          item.quantity > 0 &&
          item.quantity <= 99
      );

    if (!cleanItems.length) {
      return res.status(400).json({ error: "Itens inválidos." });
    }

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
