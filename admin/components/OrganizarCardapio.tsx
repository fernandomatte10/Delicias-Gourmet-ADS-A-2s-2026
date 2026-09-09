import {useCallback, useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'
import styled from 'styled-components'

type Item = {_id: string; nome: string; categoria?: string}
type Ordem = {_rev: string; categorias?: string[]; produtos?: string[]}
type Dados = {categorias: Item[]; produtos: Item[]; ordem: Ordem | null}
const DOCUMENTO = 'ordemCardapio'

// O estilo fica limitado a esta tela, sem alterar os formulários do Studio.
// Medidas explícitas evitam que o reset de CSS do Sanity deixe tudo colado.
const Painel = styled.div`
  height: 100%; overflow: auto; box-sizing: border-box;
  background: #f5f6fa; color: #202638; padding: 32px;
  * { box-sizing: border-box; }
  .conteudo { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 28px; line-height: 1.25; font-weight: 750; margin: 0 0 12px; }
  h2 { font-size: 20px; line-height: 1.4; font-weight: 700; margin: 0; }
  p { font-size: 14px; line-height: 1.6; margin: 0; }
  .introducao { color: #596174; max-width: 650px; margin-bottom: 24px; }
  .acoes { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  button { font: inherit; font-size: 14px; font-weight: 650; min-height: 44px;
    padding: 11px 18px; border: 1px solid #c5cada; border-radius: 8px;
    background: #fff; color: #303a54; cursor: pointer; transition: background .15s, box-shadow .15s; }
  button:hover:not(:disabled) { background: #eef0ff; border-color: #6266db; }
  button:focus-visible, select:focus-visible { outline: 3px solid #9296f5; outline-offset: 3px; }
  button:disabled { cursor: not-allowed; opacity: .45; }
  .salvar { background: #4c50d9; border-color: #4c50d9; color: #fff; box-shadow: 0 2px 5px #292e681a; }
  .salvar:hover:not(:disabled) { background: #393dbc; border-color: #393dbc; }
  .aviso { margin: 18px 0 28px; padding: 12px 16px; border-radius: 8px;
    background: #e9edf7; color: #384565; border-left: 3px solid #8997bf; }
  .pendente { color: #855000; background: #fff3d6; border-color: #d99b2c; }
  .secao { padding: 24px; margin-bottom: 24px; border: 1px solid #e0e4ee;
    background: #fff; border-radius: 12px; box-shadow: 0 2px 6px #20263805; }
  .titulo-secao { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .etapa { display: grid; place-items: center; flex: 0 0 32px; height: 32px;
    border-radius: 50%; background: #eeefff; color: #4c50d9; font-size: 14px; font-weight: 750; }
  .ajuda { color: #657084; margin-bottom: 20px; }
  ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
  .item { display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    border: 1px solid #dce1ec; border-radius: 9px; background: #fff; }
  .item[draggable='true'] { cursor: grab; }
  .item[draggable='true']:hover { background: #f8f9ff; border-color: #9a9fda; }
  .item[draggable='true']:active { cursor: grabbing; }
  .alca { font-size: 24px; color: #7a8399; }
  .nome-item { flex: 1; min-width: 0; font-size: 15px; line-height: 1.4; font-weight: 550; overflow-wrap: anywhere; }
  .seta { width: 44px; min-width: 44px; padding: 0; font-size: 21px; background: #f4f5fa; }
  .campo { display: block; margin: 22px 0; font-size: 14px; font-weight: 650; }
  select { display: block; appearance: auto; width: 100%; max-width: 420px; margin-top: 10px;
    padding: 12px 14px; min-height: 48px; border: 1px solid #aeb7cb; border-radius: 8px;
    background: #fff; color: #202638; font: inherit; cursor: pointer; }
  .nota { margin-top: 20px; color: #657084; font-size: 13px; }
  @media (max-width: 640px) { padding: 16px; .secao { padding: 16px; }
    h1 { font-size: 24px; } .item { gap: 8px; padding: 10px; }
    .acoes button { flex: 1; } }
`


// IDs salvos vêm primeiro. Cadastros novos ficam no final, em ordem alfabética.
// Guardamos apenas IDs: reorganizar não altera nomes, preços nem publicações.
function ordenar(itens: Item[], ids: string[] = []) {
  return [...itens].sort((a, b) => {
    const posicao = (id: string) => ids.includes(id) ? ids.indexOf(id) : ids.length
    return posicao(a._id) - posicao(b._id) || a.nome.localeCompare(b.nome, 'pt-BR') || a._id.localeCompare(b._id)
  })
}

// Uma única função atende ao mouse e aos botões de teclado/toque.
function mover(itens: Item[], origem: string, destino: string) {
  const de = itens.findIndex((item) => item._id === origem)
  const para = itens.findIndex((item) => item._id === destino)
  if (de < 0 || para < 0 || de === para) return itens
  const copia = [...itens]
  copia.splice(para, 0, copia.splice(de, 1)[0])
  return copia
}

function Lista({itens, bloqueada, onMove}: {
  itens: Item[]; bloqueada: boolean; onMove: (origem: string, destino: string) => void
}) {
  const origem = useRef<string | null>(null)
  return <ul>
    {itens.map((item, index) => <li key={item._id}
      draggable={!bloqueada}
      onDragStart={(event) => { origem.current = item._id; event.dataTransfer.effectAllowed = 'move' }}
      onDragEnd={() => { origem.current = null }}
      onDragOver={(event) => { if (!bloqueada) event.preventDefault() }}
      onDrop={(event) => {
        event.preventDefault()
        if (!bloqueada && origem.current) onMove(origem.current, item._id)
        origem.current = null
      }}
      className="item">
      <span className="alca" aria-hidden="true" title="Arraste para reordenar">⠿</span><span className="nome-item">{item.nome}</span>
      <button className="seta" type="button" disabled={bloqueada || index === 0}
        title="Mover para cima" aria-label={`Subir ${item.nome}`} onClick={() => onMove(item._id, itens[index - 1]._id)}>↑</button>
      <button className="seta" type="button" disabled={bloqueada || index === itens.length - 1}
        title="Mover para baixo" aria-label={`Descer ${item.nome}`} onClick={() => onMove(item._id, itens[index + 1]._id)}>↓</button>
    </li>)}
  </ul>
}

export function OrganizarCardapio() {
  const client = useClient({apiVersion: '2025-02-19'})
  const [categorias, setCategorias] = useState<Item[]>([])
  const [produtos, setProdutos] = useState<Item[]>([])
  const [categoria, setCategoria] = useState('')
  const [revisao, setRevisao] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(true)
  const [alterado, setAlterado] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const [mensagem, setMensagem] = useState('Carregando cardápio...')

  const carregar = useCallback(async () => {
    setOcupado(true)
    try {
      // A mesma perspectiva usada pelo site evita organizar versões em rascunho.
      const dados = await client.fetch<Dados>(`{
        "categorias": *[_type == "categoria"]{_id, nome},
        "produtos": *[_type == "produto"]{_id, nome, "categoria": categoria._ref},
        "ordem": *[_id == "ordemCardapio"][0]
      }`, {}, {perspective: 'published', useCdn: false})
      const lista = ordenar(dados.categorias, dados.ordem?.categorias)
      setCategorias(lista)
      setProdutos(ordenar(dados.produtos, dados.ordem?.produtos))
      setCategoria((atual) => lista.some((item) => item._id === atual) ? atual : lista[0]?._id || '')
      setRevisao(dados.ordem?._rev || null)
      setAlterado(false)
      setCarregado(true)
      setMensagem('Arraste os itens ou use as setas. Depois clique em Salvar ordem.')
    } catch {
      setMensagem('Não foi possível carregar. Confira sua conexão e clique em Recarregar lista.')
    } finally { setOcupado(false) }
  }, [client])

  useEffect(() => { void carregar() }, [carregar])
  // Avisa ao fechar ou atualizar a aba se ainda houver uma ordem não salva.
  useEffect(() => {
    const avisar = (event: BeforeUnloadEvent) => {
      if (alterado) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [alterado])

  async function salvar() {
    setOcupado(true)
    try {
      const valores = {categorias: categorias.map((item) => item._id), produtos: produtos.map((item) => item._id)}
      // Um documento separado guarda a ordem do cardápio inteiro.
      // A revisão impede sobrescrever uma ordem salva por outro colega nesse intervalo.
      // Na primeira gravação, create falha se outro usuário já criou o documento.
      const salvo = revisao
        ? await client.patch(DOCUMENTO).ifRevisionId(revisao).set(valores).commit()
        : await client.create({_id: DOCUMENTO, _type: 'ordemCardapio', ...valores})
      setRevisao(salvo._rev)
      setAlterado(false)
      setMensagem('Ordem salva! Atualize o site para ver o resultado.')
    } catch {
      setMensagem('Não foi possível salvar. Confira a conexão. Se outro colega salvou uma ordem, recarregue a lista antes de tentar novamente.')
    } finally { setOcupado(false) }
  }

  function moverProduto(origem: string, destino: string) {
    // Substitui só as posições da categoria escolhida, preservando as outras.
    const grupo = mover(produtos.filter((item) => item.categoria === categoria), origem, destino)
    let indice = 0
    setProdutos(produtos.map((item) => item.categoria === categoria ? grupo[indice++] : item))
    setAlterado(true)
  }

  // Seções em cartões e botões destacados tornam a sequência de ações visível.
  return <Painel><div className="conteudo">
    <h1>Organizar cardápio</h1>
    <p className="introducao">Escolha o que aparece primeiro no site. Arraste os itens pela alça ⠿ ou use os botões de seta.</p>
    <div className="acoes">
      <button className="salvar" type="button" disabled={ocupado || !alterado || !carregado} onClick={salvar}>
        {ocupado && alterado ? 'Salvando...' : 'Salvar ordem'}
      </button>
      <button type="button" disabled={ocupado} onClick={() => {
        if (!alterado || window.confirm('Descartar a ordem não salva e recarregar?')) void carregar()
      }}>↻ Recarregar lista</button>
    </div>
    <p className={alterado ? 'aviso pendente' : 'aviso'} role="status">
      {alterado && !ocupado && !mensagem.startsWith('Não foi possível') ? 'Você alterou a ordem. Clique em Salvar ordem para aplicar no site.' : mensagem}
    </p>
    <section className="secao" aria-labelledby="titulo-categorias">
      <div className="titulo-secao"><span className="etapa" aria-hidden="true">1</span><h2 id="titulo-categorias">Ordem das categorias</h2></div>
      <p className="ajuda">A categoria no topo desta lista aparece primeiro no cardápio.</p>
      <Lista itens={categorias} bloqueada={ocupado} onMove={(de, para) => {
        setCategorias(mover(categorias, de, para)); setAlterado(true)
      }}/>
      {!categorias.length && !ocupado && <p>Nenhuma categoria publicada.</p>}
    </section>
    <section className="secao" aria-labelledby="titulo-produtos">
      <div className="titulo-secao"><span className="etapa" aria-hidden="true">2</span><h2 id="titulo-produtos">Ordem dos produtos</h2></div>
      <p className="ajuda">Escolha uma categoria e organize os produtos dentro dela.</p>
      <label className="campo">Categoria
        <select value={categoria} disabled={ocupado} onChange={(event) => setCategoria(event.target.value)}>
          {!categorias.length && <option value="">Nenhuma categoria</option>}
          {categorias.map((item) => <option key={item._id} value={item._id}>{item.nome}</option>)}
        </select>
      </label>
      <Lista itens={produtos.filter((item) => item.categoria === categoria)} bloqueada={ocupado} onMove={moverProduto}/>
      {!ocupado && !produtos.some((item) => item.categoria === categoria) && <p>Nenhum produto publicado nesta categoria.</p>}
      <p className="nota">Não encontrou um produto novo? Publique no cadastro e clique em Recarregar lista. Os indisponíveis só aparecem no site quando forem ativados.</p>
    </section>
  </div></Painel>
}
