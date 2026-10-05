const {test} = require('node:test');
const assert = require('node:assert/strict');
const {ordenarProdutos} = require('../ordenar-produtos');
const produtos = [
  {_id: 'a', nome: 'Água', categoria: 'Bebidas', categoriaId: 'b'},
  {_id: 'f', nome: 'Frango', categoria: 'Salgados', categoriaId: 's'},
  {_id: 'c', nome: 'Carne', categoria: 'Salgados', categoriaId: 's'},
  {_id: 'z', nome: 'Café', categoria: 'Bebidas', categoriaId: 'b'},
];
test('ordena categorias e produtos sem misturar os grupos', () => {
  const resultado = ordenarProdutos(produtos, {categorias: ['s', 'b'], produtos: ['f', 'z', 'c', 'a']});
  assert.deepEqual(resultado.map(p => p._id), ['f', 'c', 'z', 'a']);
});
test('preserva ordem alfabética quando nada foi salvo', () => {
  assert.deepEqual(ordenarProdutos(produtos, null).map(p => p._id), ['a', 'z', 'c', 'f']);
});
test('novos cadastros ficam depois dos organizados e IDs excluídos são ignorados', () => {
  assert.deepEqual(ordenarProdutos(produtos, {categorias: ['excluida', 's'], produtos: ['excluido', 'f']}).map(p => p._id), ['f', 'c', 'a', 'z']);
});
test('lista vazia e produto sem categoria não provocam erro', () => {
  assert.deepEqual(ordenarProdutos([], {}), []);
  assert.equal(ordenarProdutos([{_id: 'x', nome: 'Novo'}], {}).length, 1);
});
test('não altera o array original', () => {
  const original = JSON.stringify(produtos);
  ordenarProdutos(produtos, {categorias: ['s']});
  assert.equal(JSON.stringify(produtos), original);
});

