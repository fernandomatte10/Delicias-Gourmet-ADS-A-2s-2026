// ============================================================
// TESTES - VALIDAÇÃO DOS ITENS DO PEDIDO
// ============================================================
// Testa as regras do arquivo validar-pedido.js sem acessar a internet.
// Em vez de consultar o Sanity, usamos uma lista de produtos de exemplo.
//
// Para executar (dentro da pasta Site):
//   node --test test/validar-pedido.test.cjs
// ============================================================

// node:test e node:assert já vêm com o Node.js (não precisa instalar nada).
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validarItens, mensagemRevisao} = require('../validar-pedido');

// Simula a resposta do Sanity:
//   p1 -> produto disponível por R$ 27,00
//   p2 -> produto esgotado (disponivel: false)
const sanity = [
  {_id: 'p1', nome: 'Shawarma de Carne', preco: 27, disponivel: true, imagem: 'a.png'},
  {_id: 'p2', nome: 'Pastel de Frango', preco: 8, disponivel: false},
];

// O nome enviado pelo navegador é ignorado: vale o nome cadastrado no Sanity.
test('usa nome e preço do Sanity, não os do navegador', () => {
  const r = validarItens([{id: 'p1', name: 'Nome adulterado', price: 27, quantity: 2}], sanity);
  assert.deepEqual(r.validos, [{id: 'p1', name: 'Shawarma de Carne', price: 27, quantity: 2, image: 'a.png'}]);
  assert.equal(r.indisponiveis.length + r.alterados.length, 0);
});

// Se o preço do carrinho estiver diferente (alterado ou desatualizado), o item é sinalizado.
test('preço diferente do Sanity é sinalizado para o cliente revisar', () => {
  const r = validarItens([{id: 'p1', name: 'Shawarma de Carne', price: 1, quantity: 1}], sanity);
  assert.deepEqual(r.alterados, [{id: 'p1', name: 'Shawarma de Carne', price: 27}]);
});

// Produto esgotado, excluído do Sanity ou sem id não pode ser vendido.
test('produto esgotado, excluído ou sem id é recusado', () => {
  const r = validarItens([
    {id: 'p2', name: 'Pastel de Frango', price: 8, quantity: 1},
    {id: 'apagado', name: 'Antigo', price: 5, quantity: 1},
    {name: 'Sem id', price: 5, quantity: 1},
  ], sanity);
  assert.deepEqual(r.indisponiveis.map(i => i.id), ['p2', 'apagado', null]);
});

// Quantidades inválidas: zero, negativa, acima de 99, fracionada ou texto.
test('quantidade fora de 1 a 99 ou fracionada é inválida', () => {
  for (const quantity of [0, -1, 100, 1.5, 'abc']) {
    assert.equal(validarItens([{id: 'p1', price: 27, quantity}], sanity).erro, 'Quantidade inválida.');
  }
});

// Um pedido sem nenhum item é recusado.
test('carrinho vazio é inválido', () => {
  assert.equal(validarItens([], sanity).erro, 'Itens inválidos.');
});

// A mensagem mostrada ao cliente deve citar o que mudou.
test('mensagem lista o que mudou', () => {
  const msg = mensagemRevisao({indisponiveis: [{name: 'Pastel de Frango'}], alterados: [{name: 'Shawarma de Carne', price: 27}]});
  assert.match(msg, /Pastel de Frango não está mais disponível/);
  assert.match(msg, /Shawarma de Carne agora é R\$\s?27,00/);
});
