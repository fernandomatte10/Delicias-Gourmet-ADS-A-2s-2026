// Converte a sequência de IDs salva no painel em posições fáceis de consultar.
// Cadastros sem posição ficam no final. IDs antigos não afetam o resultado.
function posicoes(ids) {
  return new Map((Array.isArray(ids) ? ids : []).map((id, index) => [id, index]));
}

function ordenarProdutos(produtos, ordem) {
  const categorias = posicoes(ordem?.categorias);
  const itens = posicoes(ordem?.produtos);
  const comparar = (a, b) => String(a || "").localeCompare(String(b || ""), "pt-BR");
  const posicao = (mapa, id) => mapa.get(id) ?? mapa.size;

  return [...produtos].sort((a, b) =>
    // Primeiro agrupamos as categorias, para os cards nunca se misturarem.
    posicao(categorias, a.categoriaId) - posicao(categorias, b.categoriaId) ||
    comparar(a.categoria, b.categoria) || comparar(a.categoriaId, b.categoriaId) ||
    // Dentro de cada categoria usamos a ordem escolhida no painel.
    posicao(itens, a._id) - posicao(itens, b._id) ||
    comparar(a.nome, b.nome) || comparar(a._id, b._id)
  );
}

module.exports = {ordenarProdutos};
