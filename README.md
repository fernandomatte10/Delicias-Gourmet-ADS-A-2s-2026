# 🍴 Delícias Gourmet - Projeto Integrador

Projeto Integrador desenvolvido no **2º semestre do curso de Análise e Desenvolvimento de Sistemas (ADS) da Faculdade Donaduzzi**.

O projeto consiste no desenvolvimento de um site de pedidos para a **Delícias Gourmet**, com o objetivo de modernizar o atendimento e tornar o processo de escolha e realização dos pedidos mais simples, organizado e interativo.

---

## 📌 1. Sobre o projeto

O sistema permite que o cliente visualize o cardápio da Delícias Gourmet, navegue pelos produtos disponíveis, adicione itens ao carrinho, altere quantidades, faça observações e finalize o pedido pelo WhatsApp.

O projeto também prevê uma área administrativa para facilitar o gerenciamento do catálogo, produtos, categorias, preços, disponibilidade e horário de funcionamento da loja.

---

## 🛒 2. Funcionalidades

### Funcionalidades atuais

- Visualização do cardápio;
- Produtos organizados por categorias;
- Adição de produtos ao carrinho;
- Aumento e diminuição da quantidade;
- Remoção de produtos;
- Limpeza do carrinho;
- Cálculo automático do valor total;
- Campo para observações do pedido;
- Salvamento do carrinho no `localStorage`;
- Mensagem de confirmação ao adicionar um produto;
- Registro do pedido pelo servidor;
- Finalização do pedido pelo WhatsApp.

### Funcionalidades previstas

- Área administrativa;
- Login para administrador;
- Cadastro, edição e exclusão de produtos;
- Gerenciamento de categorias;
- Alteração de preços;
- Controle de disponibilidade dos produtos;
- Configuração do horário de funcionamento;
- Pausa temporária no recebimento de pedidos;
- Persistência dos dados em banco de dados.

---

## 💻 3. Tecnologias utilizadas

### Front-end

- HTML;
- CSS;
- JavaScript.

### Implementação atual do servidor

- Node.js;
- Express;
- JSON para armazenamento dos pedidos durante o desenvolvimento.

### Tecnologias previstas na especificação do projeto

- Java;
- PostgreSQL.

---

## 📂 4. Estrutura do projeto

O código da aplicação está localizado dentro da pasta `Site`.

```text
Delicias-Gourmet-ADS-A-2s-2026/
│
├── README.md
│
└── Site/
    ├── index.html              # Página principal do site
    ├── server.js               # Servidor Node.js + Express
    ├── package.json            # Configuração e dependências
    ├── favicon.png
    │
    ├── js/
    │   └── carrinho.js         # Lógica do carrinho e checkout
    │
    ├── css/                    # Arquivos de estilo
    ├── img/                    # Imagens do site e dos produtos
    ├── fonts/                  # Fontes utilizadas
    │
    └── data/
        └── pedidos.json        # Pedidos registrados pelo backend
```

---

## 📥 5. Como baixar o projeto

Existem duas formas de baixar o projeto.

### Opção 1 - Download ZIP

No GitHub:

1. Clique no botão **Code**;
2. Clique em **Download ZIP**;
3. Aguarde o download;
4. Extraia o arquivo ZIP para uma pasta do computador;
5. Abra a pasta extraída no Visual Studio Code.

### Opção 2 - Clonar com Git

Para quem já possui o Git instalado, o projeto também pode ser clonado.

No GitHub, clique no botão **Code** e copie o link HTTPS do repositório.

Depois, abra o terminal e execute:

```bash
git clone LINK_DO_REPOSITORIO
```

Após a clonagem, abra a pasta do projeto no Visual Studio Code.

---

## ⚙️ 6. Como instalar

É necessário ter o **Node.js** instalado no computador.

Com o projeto aberto no VS Code, abra o terminal e acesse a pasta `Site`:

```bash
cd Site
```

Depois execute:

```bash
npm install
```

Esse comando instala as dependências definidas no arquivo `package.json`.

---

## ▶️ 7. Como iniciar o projeto

Ainda dentro da pasta `Site`, execute:

```bash
npm start
```

Depois abra no navegador:

```text
http://localhost:3000
```

Para desenvolvimento, também existe o comando:

```bash
npm run dev
```

---

## 🛍️ 8. Como o carrinho funciona

O arquivo principal responsável pelo carrinho é:

```text
Site/js/carrinho.js
```

Ele controla:

1. Adição de produtos;
2. Aumento da quantidade;
3. Diminuição da quantidade;
4. Remoção de produtos;
5. Limpeza do carrinho;
6. Cálculo do valor total;
7. Salvamento no `localStorage`;
8. Abertura e fechamento do carrinho;
9. Formulário de checkout;
10. Envio do pedido para o servidor;
11. Abertura do WhatsApp com o pedido pronto.

O carrinho permanece fechado quando o site é iniciado e pode ser aberto pelo usuário através do botão **Carrinho**.

Quando um produto é adicionado, o site também exibe uma mensagem de confirmação.

---

## 💾 9. localStorage

O navegador salva temporariamente as informações do carrinho utilizando o `localStorage`.

A chave utilizada é:

```text
delicias-gourmet-carrinho
```

Dessa forma, atualizar a página não apaga automaticamente os produtos que já foram adicionados ao carrinho.

---

## 🖥️ 10. Como o Node.js funciona

Atualmente, o arquivo responsável pelo servidor é:

```text
Site/server.js
```

Ele utiliza Node.js e Express e inicia o servidor na porta `3000`.

### Página do site

```text
GET /
```

Entrega a página principal da aplicação para o navegador.

### Registrar pedido

```text
POST /api/pedidos
```

Recebe os dados enviados pelo carrinho e registra o pedido.

### Consultar pedidos

```text
GET /api/pedidos
```

Retorna os pedidos registrados.

> Esta rota é utilizada durante o desenvolvimento. Antes de disponibilizar dados de pedidos em um ambiente de produção, será necessário implementar os controles de acesso adequados.

---

## 🔄 11. Fluxo completo de um pedido

```text
Cliente acessa o site
        ↓
Visualiza o cardápio
        ↓
Escolhe um produto
        ↓
Clica em "Adicionar ao carrinho"
        ↓
JavaScript adiciona o produto
        ↓
Carrinho é salvo no localStorage
        ↓
Cliente abre o carrinho
        ↓
Confere os produtos e quantidades
        ↓
Adiciona observações, se necessário
        ↓
Finaliza o pedido
        ↓
JavaScript envia os dados ao servidor
        ↓
Servidor valida e registra o pedido
        ↓
Sistema prepara a mensagem
        ↓
WhatsApp é aberto com o pedido
```

---

## 📲 12. Onde alterar o WhatsApp

A configuração utilizada para a integração com o WhatsApp está no arquivo:

```text
Site/js/carrinho.js
```

Procure pela constante responsável pelo número do WhatsApp:

```javascript
const WHATSAPP = "NUMERO_DO_WHATSAPP";
```

O número deve utilizar o formato internacional, sem espaços, `+`, parênteses ou hífens.

---

## 📁 13. Onde os pedidos ficam salvos

Na implementação atual, os pedidos são armazenados em:

```text
Site/data/pedidos.json
```

O formato JSON está sendo utilizado durante o desenvolvimento para facilitar os testes e a leitura dos registros.

A especificação do projeto prevê posteriormente a utilização do **PostgreSQL** para persistência dos dados.

> O arquivo de pedidos pode conter informações fornecidas pelos clientes e, por isso, não deve ser enviado publicamente ao GitHub com dados reais.

---

## 🧩 14. Onde modificar o comportamento do carrinho

Quase toda a lógica do carrinho está documentada dentro de:

```text
Site/js/carrinho.js
```

As principais funções são:

```text
saveCart()      -> salva o carrinho
totalItems()    -> calcula a quantidade de itens
totalCart()     -> calcula o valor total
renderCart()    -> atualiza a exibição do carrinho
addToCart()     -> adiciona produtos
openCart()      -> abre o carrinho
closeCart()     -> fecha o carrinho
```

O arquivo possui comentários no código para facilitar a compreensão e manutenção pela equipe.

---

## 🔧 15. Onde modificar o backend

A implementação atual do backend está concentrada no arquivo:

```text
Site/server.js
```

Esse arquivo é responsável por iniciar o servidor Express e controlar as rotas utilizadas pela aplicação.

A principal rota relacionada ao registro dos pedidos é:

```text
POST /api/pedidos
```

Ela recebe os dados enviados pelo carrinho, realiza as validações necessárias e registra o pedido.

Para consultar os pedidos durante o desenvolvimento, existe a rota:

```text
GET /api/pedidos
```

O arquivo utilizado atualmente para armazenar os pedidos é:

```text
Site/data/pedidos.json
```

Alterações relacionadas ao funcionamento do servidor, validação dos pedidos e rotas da API devem ser realizadas no `server.js`.

> A implementação atual utiliza Node.js e Express. Conforme a evolução do Projeto Integrador, a arquitetura prevista na especificação utiliza Java no backend e PostgreSQL para persistência dos dados.

---

## 🌿 16. Git e GitHub

O projeto utiliza **Git e GitHub** para controle de versão e colaboração entre os integrantes da equipe.

### Verificar atualizações antes de começar

Antes de iniciar uma alteração, é recomendado verificar se algum integrante enviou mudanças para o GitHub:

```bash
git fetch origin
git status
```

O `git fetch` busca informações sobre as atualizações do repositório remoto sem alterar os arquivos locais.

Para verificar especificamente se existem commits novos no GitHub:

```bash
git log HEAD..origin/main --oneline
```

Se aparecerem commits, significa que existem alterações na `main` remota que ainda não estão na versão local.

### Baixar alterações da equipe

Quando existirem alterações remotas que precisam ser trazidas para o computador:

```bash
git pull origin main
```

Antes de executar o `pull`, é recomendado conferir o estado dos arquivos com:

```bash
git status
```

### Verificar arquivos modificados

Depois de realizar alterações no projeto:

```bash
git status
```

Esse comando mostra arquivos modificados, adicionados ou removidos.

### Preparar um arquivo para o commit

Para adicionar um arquivo específico:

```bash
git add caminho/do/arquivo
```

Por exemplo:

```bash
git add Site/js/carrinho.js
```

Para adicionar todas as alterações:

```bash
git add .
```

> Antes de utilizar `git add .`, é importante conferir o `git status` para evitar adicionar arquivos que não deveriam fazer parte do commit.

### Criar um commit

Depois de preparar os arquivos:

```bash
git commit -m "Descrição da alteração realizada"
```

A mensagem deve explicar de forma simples o que foi alterado.

Exemplo:

```bash
git commit -m "Corrige abertura automática do carrinho"
```

### Verificar novamente antes do push

Como vários integrantes podem trabalhar no mesmo repositório, antes de enviar o commit é recomendado executar novamente:

```bash
git fetch origin
git status
```

Também é possível verificar se surgiram novos commits:

```bash
git log HEAD..origin/main --oneline
```

Se existirem alterações remotas, elas devem ser verificadas antes de enviar o seu trabalho.

### Enviar as alterações para o GitHub

Quando a versão local estiver atualizada:

```bash
git push origin main
```

No Visual Studio Code, as etapas de preparação, commit e sincronização também podem ser realizadas pela aba **Source Control**.

### ⚠️ Importante

Antes de realizar `pull` ou `push`, sempre verifique:

```bash
git status
```

Isso ajuda a identificar alterações pendentes e reduz o risco de conflitos, principalmente porque o projeto é desenvolvido em equipe.

---

## 🎨 17. Interface e responsividade

A interface busca seguir a identidade visual da **Delícias Gourmet**, mantendo uma aparência simples, moderna e de fácil utilização.

O site também é desenvolvido pensando na utilização em diferentes dispositivos, como:

- Smartphones;
- Tablets;
- Notebooks;
- Computadores.

---

## 🚧 18. Próximos passos

Durante a evolução do Projeto Integrador, estão previstas melhorias como:

- Desenvolvimento da área administrativa;
- Autenticação do administrador;
- Gerenciamento de produtos e categorias;
- Controle de disponibilidade dos produtos;
- Configuração do funcionamento da loja;
- Integração com banco de dados PostgreSQL;
- Melhorias de responsividade;
- Testes e validações;
- Melhorias gerais na experiência do usuário.

---

## 🎓 19. Informações acadêmicas

**Projeto:** Site de Pedidos - Delícias Gourmet  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS)  
**Instituição:** Faculdade Donaduzzi  
**Semestre:** 2º semestre  
**Cliente:** Delícias Gourmet  

---

## 📌 Status do projeto

🚧 **Em desenvolvimento**

O sistema continuará recebendo novas funcionalidades, correções e melhorias durante o desenvolvimento do Projeto Integrador.