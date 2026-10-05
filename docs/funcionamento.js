// RF-05: regra isolada para poder ser testada e migrada para o backend Java.
// Sempre usamos o fuso da loja, não o relógio/fuso escolhido pelo cliente.
const FUSO = 'America/Sao_Paulo';
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const PADRAO = DIAS.map((nome, dia) => ({dia, nome, aberto: dia > 0 && dia < 6, abertura: '07:30', fechamento: '21:00'}));
const minutos = (hora) => /^([01]\d|2[0-3]):[0-5]\d$/.test(hora || '')
  ? Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3)) : NaN;

function calcularFuncionamento(config, agora = new Date()) {
  // Até o primeiro salvamento, preserva os horários que já estavam no site.
  const horarios = config == null ? PADRAO : config.horarios;
  const valido = Array.isArray(horarios) && horarios.length === 7 &&
    DIAS.every((_, dia) => horarios.filter(h => h.dia === dia).length === 1) &&
    horarios.every(h => typeof h.aberto === 'boolean' && (!h.aberto ||
      (Number.isFinite(minutos(h.abertura)) && Number.isFinite(minutos(h.fechamento)) && h.abertura !== h.fechamento)));
  if (!valido) return {aceitaPedidos: false, estado: 'indisponivel', mensagem: 'Não foi possível confirmar o horário da loja. Tente novamente em instantes.', horarios: [], fuso: FUSO};
  const semana = [...horarios].sort((a, b) => a.dia - b.dia).map(h => ({...h, nome: DIAS[h.dia]}));
  const partes = new Intl.DateTimeFormat('en-US', {timeZone: FUSO, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(agora);
  const obter = tipo => partes.find(p => p.type === tipo).value;
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(obter('weekday'));
  const atual = Number(obter('hour')) * 60 + Number(obter('minute'));
  const hoje = semana[dia], ontem = semana[(dia + 6) % 7];
  const inicio = minutos(hoje.abertura), fim = minutos(hoje.fechamento);
  // Um fechamento anterior à abertura representa a madrugada do dia seguinte.
  const turnoHoje = hoje.aberto && (fim > inicio ? atual >= inicio && atual < fim : atual >= inicio);
  const turnoOntem = ontem.aberto && minutos(ontem.fechamento) < minutos(ontem.abertura) && atual < minutos(ontem.fechamento);
  const pausada = config?.pausada === true;
  const aceitaPedidos = !pausada && (turnoHoje || turnoOntem);
  return {aceitaPedidos, estado: pausada ? 'pausada' : aceitaPedidos ? 'aberta' : 'fechada',
    mensagem: pausada ? 'Pedidos pausados temporariamente. Voltaremos em breve.' : aceitaPedidos ? 'Loja aberta — estamos recebendo pedidos.' : 'Loja fechada no momento.',
    horarios: semana, fuso: FUSO};
}

async function consultarFuncionamento() {
  const project = process.env.SANITY_PROJECT_ID || '9bplldxn';
  const dataset = process.env.SANITY_DATASET || 'production';
  const url = new URL(`https://${project}.api.sanity.io/v2025-02-19/data/query/${dataset}`);
  url.searchParams.set('perspective', 'published');
  url.searchParams.set('query', '*[_id == "funcionamentoLoja"][0]{pausada,horarios}');
  // Sem cache: cada tentativa de pedido confere a pausa atual no Sanity.
  const response = await fetch(url, {signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw new Error('Falha ao consultar funcionamento');
  const dados = await response.json();
  if (!Object.hasOwn(dados, 'result')) throw new Error('Resposta inválida');
  return calcularFuncionamento(dados.result);
}
module.exports = {calcularFuncionamento, consultarFuncionamento};

