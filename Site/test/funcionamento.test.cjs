const {test} = require('node:test');
const assert = require('node:assert/strict');
const {calcularFuncionamento} = require('../funcionamento');
const data = horario => new Date(`2026-09-09T${horario}:00-03:00`); // quarta-feira
test('horário padrão: abre inclusive às 07:30 e fecha às 21:00', () => {
  assert.equal(calcularFuncionamento(null, data('07:29')).aceitaPedidos, false);
  assert.equal(calcularFuncionamento(null, data('07:30')).aceitaPedidos, true);
  assert.equal(calcularFuncionamento(null, data('20:59')).aceitaPedidos, true);
  assert.equal(calcularFuncionamento(null, data('21:00')).aceitaPedidos, false);
});
const horarios = () => calcularFuncionamento(null, data('12:00')).horarios;
test('pausa prevalece mesmo dentro do horário', () => {
  assert.equal(calcularFuncionamento({horarios: horarios(), pausada: true}, data('12:00')).estado, 'pausada');
});
test('retomar não abre fora do horário', () => {
  assert.equal(calcularFuncionamento({horarios: horarios(), pausada: false}, data('23:00')).aceitaPedidos, false);
});
test('dia fechado não aceita pedidos', () => {
  assert.equal(calcularFuncionamento(null, new Date('2026-09-13T12:00:00-03:00')).aceitaPedidos, false);
});
test('fuso independe do fuso do servidor e do cliente', () => {
  assert.equal(calcularFuncionamento(null, new Date('2026-09-09T10:30:00Z')).aceitaPedidos, true);
  assert.equal(calcularFuncionamento(null, new Date('2026-09-09T10:29:00Z')).aceitaPedidos, false);
});
test('turno noturno cruza domingo para segunda, com limite exclusivo', () => {
  const h = horarios().map(x => ({...x, aberto: x.dia === 0, abertura: '18:00', fechamento: '01:00'}));
  const c = {horarios: h};
  assert.equal(calcularFuncionamento(c, new Date('2026-09-13T18:00:00-03:00')).aceitaPedidos, true);
  assert.equal(calcularFuncionamento(c, new Date('2026-09-14T00:59:00-03:00')).aceitaPedidos, true);
  assert.equal(calcularFuncionamento(c, new Date('2026-09-14T01:00:00-03:00')).aceitaPedidos, false);
});
test('configuração incompleta ou horário inválido bloqueia pedidos', () => {
  for (const c of [{}, {horarios: []}, {horarios: horarios().map(h => ({...h, abertura: '99:00'}))}])
    assert.equal(calcularFuncionamento(c, data('12:00')).estado, 'indisponivel');
});
test('todos os dias fechados é uma configuração válida', () => {
  assert.equal(calcularFuncionamento({horarios: horarios().map(h => ({...h, aberto: false}))}, data('12:00')).estado, 'fechada');
});

test('servidor recusa pedido pausado ou falha de consulta sem gravar arquivo', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const routes = {}; let falhar = false, gravacoes = 0;
  const app = {use(){}, get(){}, post(path, fn){routes[path] = fn}, listen(){}};
  const express = Object.assign(() => app, {json(){}, static(){}});
  vm.runInNewContext(fs.readFileSync(__dirname + '/../server.js', 'utf8'), {
    require: name => name === 'express' ? express : name === './funcionamento' ? {
      consultarFuncionamento: async () => { if (falhar) throw Error('offline'); return {aceitaPedidos: false, mensagem: 'Pausada'}; }
    } : name === './ordenar-produtos' ? {ordenarProdutos: x => x} : name === 'fs/promises' ? {writeFile(){gravacoes++}} : require(name),
    __dirname, process, console, URL, AbortSignal,
  });
  for (falhar of [false, true]) {
    const res = {status(code){this.code=code;return this},json(body){this.body=body}};
    await routes['/api/pedidos']({body: {customer: {nome: 'Teste'}, items: [{name:'Teste',price:10,quantity:1}]}},res);
    assert.equal(res.code, falhar ? 503 : 409);
  }
  assert.equal(gravacoes, 0);
});

