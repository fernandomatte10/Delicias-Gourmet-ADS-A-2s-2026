// Estado compartilhado com o carrinho. Começa bloqueado até confirmar o servidor.
window.estadoLoja = {aceitaPedidos: false, mensagem: 'Verificando funcionamento da loja...'};
window.pedidoEmEnvio = false;
window.atualizarBotaoPedido = function () {
  const button = document.getElementById('checkout-button');
  if (!button) return;
  const temItens = Number(document.getElementById('cart-count').textContent) > 0;
  button.disabled = window.pedidoEmEnvio || !temItens || !window.estadoLoja.aceitaPedidos;
  button.textContent = window.pedidoEmEnvio ? 'Preparando pedido...' : window.estadoLoja.aceitaPedidos ? 'Finalizar pedido pelo WhatsApp' : 'Pedidos indisponíveis no momento';
};
window.aplicarEstadoLoja = function (estado) {
  window.estadoLoja = estado;
  for (const id of ['loja-status', 'carrinho-loja-status']) {
    const aviso = document.getElementById(id);
    // Loja aberta não precisa de faixa; os avisos voltam ao fechar ou pausar.
    aviso.hidden = estado.aceitaPedidos === true;
    aviso.textContent = aviso.hidden ? '' : estado.mensagem;
    aviso.dataset.estado = estado.estado || 'indisponivel';
  }
  const horarios = document.getElementById('loja-horarios');
  if (Array.isArray(estado.horarios)) {
    horarios.replaceChildren();
    for (const h of estado.horarios) {
      const linha = document.createElement('p');
      linha.textContent = `${h.nome}: ${h.aberto ? `${h.abertura} – ${h.fechamento}${h.fechamento < h.abertura ? ' (dia seguinte)' : ''}` : 'Fechado'}`;
      horarios.append(linha);
    }
    if (!estado.horarios.length) horarios.textContent = 'Horários temporariamente indisponíveis.';
  }
  window.atualizarBotaoPedido();
};
let consultando = false;
window.consultarEstadoLoja = async function () {
  if (consultando) return;
  consultando = true;
  try {
    const response = await fetch('/api/funcionamento', {cache: 'no-store', signal: AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('Falha ao consultar loja');
    const estado = await response.json();
    if (typeof estado.aceitaPedidos !== 'boolean') throw new Error('Resposta inválida');
    window.aplicarEstadoLoja(estado);
  } catch {
    // Sem confirmação atual, não libera pedidos com um estado antigo de loja aberta.
    window.aplicarEstadoLoja({aceitaPedidos: false, estado: 'indisponivel', mensagem: 'Não foi possível confirmar se a loja está aberta. Tentaremos novamente em instantes.'});
  } finally { consultando = false; }
};
window.consultarEstadoLoja();
// O servidor também confere na finalização. A consulta periódica mantém o aviso atualizado.
setInterval(() => { if (!document.hidden) window.consultarEstadoLoja(); }, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) window.consultarEstadoLoja(); });
window.addEventListener('focus', () => window.consultarEstadoLoja());

