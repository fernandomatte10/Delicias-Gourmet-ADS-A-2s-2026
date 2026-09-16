import {useCallback, useEffect, useState} from 'react'
import {useClient} from 'sanity'
import styled from 'styled-components'

type Horario = {_key: string; dia: number; aberto: boolean; abertura: string; fechamento: string}
type Config = {_rev: string; pausada: boolean; horarios: Horario[]}
const ID = 'funcionamentoLoja'
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const PADRAO: Horario[] = DIAS.map((_, dia) => ({_key: `dia-${dia}`, dia, aberto: dia > 0 && dia < 6, abertura: '07:30', fechamento: '21:00'}))

// Espaçamento e controles explícitos evitam os botões sem aparência do reset do Studio.
const Tela = styled.div`
  height: 100%; overflow: auto; padding: 32px; background: #f5f6fa; color: #202638;
  * { box-sizing: border-box; } .conteudo { max-width: 920px; margin: auto; }
  h1 { font-size: 28px; font-weight: 750; margin: 0 0 12px; }
  h2 { font-size: 20px; font-weight: 700; margin: 0 0 12px; }
  p { font-size: 14px; line-height: 1.6; margin: 0 0 18px; }
  section { padding: 24px; background: white; border: 1px solid #dfe3ed; border-radius: 12px; margin: 24px 0; }
  button { min-height: 44px; border: 1px solid #bec6d8; border-radius: 8px; padding: 12px 18px; cursor: pointer; font: inherit; font-weight: 650; background: white; }
  button:hover:not(:disabled) { filter: brightness(.94); } button:disabled { opacity: .45; cursor: not-allowed; }
  .primario { background: #4c50d9; color: white; border-color: #4c50d9; }
  .pausar { background: #a62932; color: white; border-color: #a62932; }
  .retomar { background: #167047; color: white; border-color: #167047; }
  .aviso { padding: 14px 16px; background: #e9edf7; border-radius: 8px; }
  .estado { display: inline-block; border-radius: 20px; padding: 6px 12px; background: #edf0f8; margin-bottom: 16px; font-weight: 650; }
  .linha { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding: 16px 0; border-bottom: 1px solid #e4e7ef; }
  .dia { min-width: 155px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
  input[type=checkbox] { appearance: auto; width: 20px; height: 20px; accent-color: #4c50d9; cursor: pointer; }
  .hora { display: flex; align-items: center; gap: 8px; font-size: 14px; }
  input[type=time] { appearance: auto; padding: 9px; border: 1px solid #b6bfd1; border-radius: 7px; background: white; color: #202638; font: inherit; }
  input:disabled { opacity: .45; } button:focus-visible, input:focus-visible { outline: 3px solid #9296f5; outline-offset: 3px; }
  .acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
  .nota { color: #626e81; } @media(max-width: 640px) { padding: 16px; section { padding: 16px; } .dia { width: 100%; } }
`

export function HorariosLoja() {
  const client = useClient({apiVersion: '2025-02-19'})
  const [horarios, setHorarios] = useState<Horario[]>(PADRAO)
  const [pausada, setPausada] = useState(false)
  const [revisao, setRevisao] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(true)
  const [carregado, setCarregado] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [mensagem, setMensagem] = useState('Carregando configurações...')
  const carregar = useCallback(async () => {
    setOcupado(true)
    try {
      const config = await client.fetch<Config | null>('*[_id == $id][0]', {id: ID}, {perspective: 'published', useCdn: false})
      setHorarios(PADRAO.map(p => ({...p, ...config?.horarios?.find(h => h.dia === p.dia)})))
      setPausada(config?.pausada === true); setRevisao(config?._rev || null)
      setCarregado(true); setAlterado(false); setMensagem('Configurações carregadas. Horário de Brasília.')
    } catch { setMensagem('Não foi possível carregar. Confira a conexão e clique em Recarregar.') }
    finally { setOcupado(false) }
  }, [client])
  useEffect(() => { void carregar() }, [carregar])
  useEffect(() => {
    const avisar = (event: BeforeUnloadEvent) => { if (alterado) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [alterado])

  async function salvar(tipo: 'horarios' | 'pausa') {
    if (tipo === 'horarios' && horarios.some(h => h.aberto &&
      (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h.abertura) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.fechamento) || h.abertura === h.fechamento))) {
      setMensagem('Preencha abertura e fechamento diferentes e válidos em cada dia de atendimento.'); return
    }
    setOcupado(true)
    try {
      // Cada botão altera somente sua parte: pausar não salva horários ainda em edição.
      // A revisão evita sobrescrever alterações simultâneas de outro administrador.
      const valores = tipo === 'pausa' ? {pausada: !pausada} : {horarios}
      const salvo = revisao
        ? await client.patch(ID).ifRevisionId(revisao).set(valores).commit()
        : await client.create({_id: ID, _type: 'funcionamentoLoja', horarios: PADRAO, pausada: false, ...valores})
      setRevisao(salvo._rev)
      if (tipo === 'pausa') { setPausada(!pausada); setMensagem(!pausada ? 'Pedidos pausados. Nenhum novo pedido será aceito pelo site.' : 'Pausa removida. O recebimento volta a seguir os horários salvos.') }
      else { setAlterado(false); setMensagem('Horários salvos e aplicados ao site.') }
    } catch { setMensagem('Não foi possível salvar. Confira a conexão; se outro colega alterou as configurações, recarregue antes de tentar novamente.') }
    finally { setOcupado(false) }
  }
  function editar(dia: number, valores: Partial<Horario>) {
    setHorarios(horarios.map(h => h.dia === dia ? {...h, ...valores} : h)); setAlterado(true)
  }
  return <Tela><div className="conteudo">
    <h1>Horários e pausa</h1>
    <p className="nota">Controle quando a loja recebe pedidos pelo site. O cardápio continua disponível para consulta.</p>
    <p className="aviso" role="status">{mensagem}</p>
    <section><h2>Pausa de emergência</h2>
      <span className="estado">{!carregado ? 'Verificando...' : pausada ? 'Pedidos pausados' : 'Seguindo os horários da loja'}</span>
      <p>Use a pausa em horários de pico ou imprevistos. Ela permanece ativa até você retomar o recebimento.</p>
      <button className={pausada ? 'retomar' : 'pausar'} disabled={ocupado || !carregado} onClick={() => salvar('pausa')}>
        {pausada ? 'Retomar recebimento' : 'Pausar pedidos agora'}
      </button>
      <p className="nota" style={{marginTop: 14}}>A ação é imediata. Retomar não abre a loja fora do horário configurado.</p>
    </section>
    <section><h2>Horários da semana</h2>
      <p className="nota">Marque os dias de atendimento. Todos os horários seguem o fuso de Brasília.</p>
      {horarios.map(h => <div className="linha" key={h.dia}>
        <label className="dia"><input type="checkbox" checked={h.aberto} disabled={ocupado || !carregado} onChange={e => editar(h.dia, {aberto: e.target.checked})}/>{DIAS[h.dia]}</label>
        {h.aberto ? <><label className="hora">Abre<input aria-label={`Abertura ${DIAS[h.dia]}`} type="time" value={h.abertura} disabled={ocupado} onChange={e => editar(h.dia, {abertura: e.target.value})}/></label>
          <label className="hora">Fecha<input aria-label={`Fechamento ${DIAS[h.dia]}`} type="time" value={h.fechamento} disabled={ocupado} onChange={e => editar(h.dia, {fechamento: e.target.value})}/></label></> : <span className="nota">Fechado</span>}
      </div>)}
      <p className="nota" style={{marginTop: 18}}>Se o fechamento for antes da abertura, o atendimento termina na madrugada seguinte. Exemplo: 18:00 até 01:00.</p>
      {alterado && <p className="aviso">Há horários não salvos.</p>}
      <div className="acoes"><button className="primario" disabled={ocupado || !carregado || !alterado} onClick={() => salvar('horarios')}>Salvar horários</button>
        <button disabled={ocupado} onClick={() => { if (!alterado || window.confirm('Descartar os horários não salvos e recarregar?')) void carregar() }}>Recarregar</button></div>
    </section>
  </div></Tela>
}
