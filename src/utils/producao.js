// Lógica das Fichas de Produção (receitas): produtos PRODUZIDOS a partir de
// vários ingredientes (molhos, caldos, refogados…), com rendimento.
//
// Cada ingrediente da receita pode ser:
//  • abate: true  → é um produto controlado (frios/proteínas) e dá baixa no estoque
//  • abate: false → vem do estoque seco (não controlado aqui): SÓ monitora o uso,
//                   não dá baixa. Guarda { nome, unidade } livres.
//
// A receita guarda os ingredientes para um "lote padrão" que rende
// `rendimentoBase` do produto final; produzir escala proporcionalmente.

const arred = (v) => Math.round((parseFloat(v) || 0) * 1000) / 1000;

// Quanto de cada ingrediente para produzir `alvo` do produto final.
export function ingredientesParaProduzir(receita, alvo) {
  const base = parseFloat(receita?.rendimentoBase) || 0;
  const fator = base > 0 ? (parseFloat(alvo) || 0) / base : 0;
  return (receita?.ingredientes || []).map(i => ({
    ...i,
    abate: i.abate !== false, // padrão antigo (sem o campo) = abate
    quantidade: arred((parseFloat(i.quantidade) || 0) * fator),
  }));
}

// Junta a necessidade com o estoque atual. Só os ingredientes que abatem
// estoque entram na checagem de falta; os monitorados são só informativos.
// estoque = { [produtoId]: quantidadeAtual }
export function planejarProducao(receita, alvo, estoque = {}) {
  const itens = ingredientesParaProduzir(receita, alvo).map(i => {
    if (i.abate && i.produtoId) {
      const emEstoque = parseFloat(estoque[i.produtoId]) || 0;
      const falta = Math.max(0, arred(i.quantidade - emEstoque));
      return { ...i, emEstoque, falta, suficiente: emEstoque >= i.quantidade };
    }
    return { ...i, monitor: true };
  });
  return { itens, faltaAlgum: itens.some(i => i.abate && i.produtoId && !i.suficiente) };
}
