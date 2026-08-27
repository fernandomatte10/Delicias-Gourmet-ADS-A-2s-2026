# Delícias Gourmet - Site + Carrinho + Node.js

Este projeto é o site da **Delícias Gourmet** com um carrinho de pedidos integrado.

A aplicação foi dividida em duas partes:

- **Frontend:** HTML + CSS + JavaScript. É a parte que o cliente vê e utiliza.
- **Backend:** Node.js + Express. É responsável por receber e salvar os pedidos.

## 1. Estrutura do projeto

```text
Site Antigo/
├── index.html              # Página principal do site
├── server.js               # Servidor Node.js + Express
├── package.json            # Configuração e dependências do Node.js
│
├── js/
│   └── carrinho.js         # Toda a lógica do carrinho e checkout
│
├── css/                    # Arquivos de estilo do site
├── img/                    # Imagens dos produtos e elementos do site
├── fonts/                  # Fontes utilizadas no site
│
└── data/
    └── pedidos.json        # Pedidos registrados pelo backend
```

## 2. Como instalar

É necessário ter o **Node.js 18 ou superior** instalado.

Abra o terminal dentro da pasta `Site Antigo` e execute:

```bash
npm install
```

Esse comando instala o Express definido no `package.json`.

## 3. Como iniciar

Para iniciar normalmente:

```bash
npm start
```

Para desenvolvimento, também existe:

```bash
npm run dev
```

Depois abra no navegador:

```text
http://localhost:3000
```

## 4. Como o carrinho funciona

O arquivo principal do carrinho é:

```text
js/carrinho.js
```

Ele controla:

1. Adição de produtos.
2. Aumento da quantidade.
3. Diminuição da quantidade.
4. Remoção de produtos.
5. Limpeza do carrinho.
6. Cálculo do total.
7. Salvamento no `localStorage`.
8. Formulário de checkout.
9. Envio do pedido para o Node.js.
10. Abertura do WhatsApp com o pedido pronto.

### localStorage

O navegador salva o carrinho usando a chave:

```text
delicias-gourmet-carrinho
```

Por isso, atualizar a página não apaga automaticamente os produtos.

## 5. Como o Node.js funciona

O arquivo responsável pelo backend é:

```text
server.js
```

Ele cria um servidor Express na porta `3000`.

### Página do site

```text
GET /
```

Entrega o `index.html` para o navegador.

### Registrar pedido

```text
POST /api/pedidos
```

Recebe os dados enviados pelo carrinho e salva o pedido em:

```text
data/pedidos.json
```

### Consultar pedidos

```text
GET /api/pedidos
```

Retorna os pedidos salvos.

> Essa rota é útil para testes e para um futuro painel administrativo. Antes de publicar o sistema na internet, é importante adicionar autenticação para impedir que qualquer pessoa consulte os pedidos.

## 6. Fluxo completo de um pedido

```text
Cliente escolhe um produto
        ↓
Clica em "Adicionar ao carrinho"
        ↓
js/carrinho.js adiciona o produto
        ↓
Carrinho é salvo no localStorage
        ↓
Cliente clica em "Finalizar pedido"
        ↓
Preenche nome, entrega/retirada, endereço e observações
        ↓
JavaScript envia POST /api/pedidos
        ↓
Node.js valida e salva o pedido
        ↓
Node.js gera o número do pedido
        ↓
JavaScript monta a mensagem
        ↓
WhatsApp é aberto com o pedido pronto
```

## 7. Onde alterar o WhatsApp

No arquivo:

```text
js/carrinho.js
```

procure:

```javascript
const WHATSAPP = "554598352808";
```

Substitua pelo número correto, mantendo o formato internacional e sem espaços, `+`, parênteses ou hífens.

## 8. Onde os pedidos ficam salvos

Os pedidos são armazenados em:

```text
data/pedidos.json
```

O arquivo é JSON para facilitar a leitura durante o desenvolvimento.

Para um sistema comercial em produção, é recomendável substituir esse arquivo por um banco de dados, como PostgreSQL ou MySQL.

## 9. Onde modificar o comportamento do carrinho

Quase toda a lógica está documentada dentro de:

```text
js/carrinho.js
```

As principais funções são:

```text
saveCart()       -> salva o carrinho
 totalItems()    -> calcula a quantidade de itens
 totalCart()     -> calcula o valor total
 renderCart()    -> atualiza a tela do carrinho
 addToCart()     -> adiciona produtos
 openCart()      -> abre o carrinho
 closeCart()     -> fecha o carrinho
```

## 10. Onde modificar o backend

As partes principais estão documentadas dentro de:

```text
server.js
```

A rota mais importante é:

```text
POST /api/pedidos
```

Ela recebe o pedido, valida os dados, calcula o total e salva o registro.

## 11. Próximos passos recomendados

Depois que o carrinho estiver funcionando corretamente, podemos evoluir o projeto para:

- painel administrativo;
- login para administrador;
- alteração de status do pedido;
- banco de dados PostgreSQL/MySQL;
- controle de produtos e preços pelo painel;
- impressão dos pedidos;
- histórico de pedidos;
- taxa de entrega;
- formas de pagamento;
- integração com Pix;
- fechamento automático de pedidos;
- publicação do sistema na internet.
