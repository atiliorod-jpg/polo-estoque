// Lógica das Fichas de Produção (receitas): produtos que são PRODUZIDOS a
// partir de vários ingredientes (molhos, caldos, refogados…), com rendimento.
//
// Uma receita guarda os ingredientes para um "lote padrão" que rende
// `rendimentoBase` do produto final. Para produzir uma quantidade-alvo,
// escala tudo proporcionalmente — mesma ideia do planejador de compras.

// Quanto de cada ingrediente é preciso para produzir `alvo` do produto final.
export function ingredientesParaProduzir(receita, alvo) {
  const base = parseFloat(receita?.rendimentoBase) || 0;
  const fator = base > 0 ? (parseFloat(alvo) || 0) / base : 0;
  return (receita?.ingredientes || []).map(i => ({
    produtoId: i.produtoId,
    quantidade: Math.round((parseFloat(i.quantidade) || 0) * fator * 1000) / 1000,
  }));
}

// Junta a necessidade com o estoque atual: o que tem e o que falta.
// estoque = { [produtoId]: quantidadeAtual }
export function planejarProducao(receita, alvo, estoque = {}) {
  const itens = ingredientesParaProduzir(receita, alvo).map(i => {
    const emEstoque = parseFloat(estoque[i.produtoId]) || 0;
    const falta = Math.max(0, Math.round((i.quantidade - emEstoque) * 1000) / 1000);
    return { ...i, emEstoque, falta, suficiente: emEstoque >= i.quantidade };
  });
  return { itens, faltaAlgum: itens.some(i => !i.suficiente) };
}
