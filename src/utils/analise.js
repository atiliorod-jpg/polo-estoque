import { hoje } from './formatters';

const num = (v) => parseFloat(v) || 0;
const DIA_MS = 86400000;

/**
 * Média diária de saídas por produto na janela recente (padrão 14 dias).
 * Diferente das sugestões de mín/máx, funciona desde os primeiros dias de uso
 * (com pelo menos 3 dias de histórico) — serve para prever ruptura.
 */
export function mediaDiariaSaidas(saidas, ref = hoje(), janelaDias = 14) {
  if (!saidas.length) return {};
  const primeira = saidas.reduce((m, s) => (s.data < m ? s.data : m), saidas[0].data);
  const diasObservados = Math.min(janelaDias, Math.round((new Date(ref) - new Date(primeira)) / DIA_MS) + 1);
  if (diasObservados < 3) return {};
  const inicio = new Date(new Date(ref).getTime() - (janelaDias - 1) * DIA_MS).toISOString().slice(0, 10);
  const tot = {};
  saidas.forEach(s => {
    if (s.data < inicio || s.data > ref) return;
    (s.itens || []).forEach(it => {
      tot[it.produtoId] = (tot[it.produtoId] || 0) + num(it.quantidade);
    });
  });
  const m = {};
  Object.entries(tot).forEach(([id, t]) => { m[id] = t / diasObservados; });
  return m;
}

/**
 * Previsão de ruptura: no ritmo atual, em quantos dias o estoque acaba.
 * Retorna só produtos com consumo e estoque positivos, ordenados pelo risco.
 */
export function previsaoRuptura(produtos, estoque, medias) {
  return produtos
    .filter(p => p.ativo && (medias[p.id] || 0) > 0 && (estoque[p.id] ?? 0) > 0)
    .map(p => ({ p, dias: (estoque[p.id] ?? 0) / medias[p.id] }))
    .sort((a, b) => a.dias - b.dias);
}

/**
 * Lista de compras automática: produtos abaixo do mínimo, com a quantidade
 * sugerida para voltar ao máximo (ou ao mínimo, quando não há máximo).
 */
export function listaDeCompras(produtos, estoque) {
  return produtos
    .filter(p => p.ativo && p.min > 0 && (estoque[p.id] ?? 0) < p.min)
    .map(p => {
      const atual = estoque[p.id] ?? 0;
      const alvo = p.max > p.min ? p.max : p.min;
      const bruto = Math.max(alvo - atual, 0);
      const sugerido = p.unidade === 'unid' ? Math.ceil(bruto) : Math.ceil(bruto * 2) / 2;
      return { p, atual, sugerido };
    })
    .sort((a, b) => (a.atual / a.p.min) - (b.atual / b.p.min)); // mais crítico primeiro
}

// Soma de aparas + perdas associadas a cada compra (via compraId)
export function correcoesPorCompra(aparas, desperdicio) {
  const m = {};
  [...aparas, ...desperdicio].forEach(r => {
    if (r.compraId) m[r.compraId] = (m[r.compraId] || 0) + num(r.quantidade);
  });
  return m;
}

/**
 * Rendimento por fornecedor: total comprado, correção (aparas+perdas associadas)
 * e % de rendimento. Quanto maior o rendimento, melhor a matéria-prima entregue.
 */
export function rendimentoPorFornecedor(compras, aparas, desperdicio) {
  const corr = correcoesPorCompra(aparas, desperdicio);
  const porF = {};
  compras.forEach(c => {
    const f = (c.fornecedor || '').trim() || '(sem fornecedor)';
    if (!porF[f]) porF[f] = { fornecedor: f, comprado: 0, correcao: 0, n: 0 };
    porF[f].comprado += num(c.quantidade);
    porF[f].correcao += corr[c.id] || 0;
    porF[f].n++;
  });
  return Object.values(porF)
    .map(x => ({ ...x, rendimento: x.comprado > 0 ? (1 - x.correcao / x.comprado) * 100 : null }))
    .sort((a, b) => b.comprado - a.comprado);
}

/**
 * Fator de correção histórico de uma matéria-prima (proporção 0..1 de
 * aparas/perdas sobre o total comprado). null quando não há dados.
 */
export function fatorCorrecaoItem(materiaPrima, compras, aparas, desperdicio) {
  const corr = correcoesPorCompra(aparas, desperdicio);
  const alvo = (materiaPrima || '').toLowerCase();
  if (!alvo) return null;
  let comprado = 0, correcao = 0;
  compras.forEach(c => {
    const nome = (c.item || '').toLowerCase();
    if (nome && (nome.includes(alvo) || alvo.includes(nome))) {
      comprado += num(c.quantidade);
      correcao += corr[c.id] || 0;
    }
  });
  if (comprado <= 0 || correcao <= 0) return null;
  return Math.min(correcao / comprado, 0.9);
}

// Série diária de saídas no período, separada por polo
export function saidasPorDia(saidas, inicio, fim) {
  const porDia = {};
  saidas.forEach(s => {
    if (s.data < inicio || s.data > fim) return;
    if (!porDia[s.data]) porDia[s.data] = { central: 0, beer: 0 };
    const total = (s.itens || []).reduce((t, i) => t + num(i.quantidade), 0);
    if (s.destino === 'polo_beer') porDia[s.data].beer += total;
    else porDia[s.data].central += total;
  });
  return Object.entries(porDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, v]) => ({ data, ...v, total: v.central + v.beer }));
}

// Top produtos por saída no período, com divisão Central × Beer
export function topProdutosSaida(produtos, saidasFiltradas, limite = 8) {
  const tot = {};
  saidasFiltradas.forEach(s => {
    (s.itens || []).forEach(i => {
      if (!tot[i.produtoId]) tot[i.produtoId] = { central: 0, beer: 0 };
      if (s.destino === 'polo_beer') tot[i.produtoId].beer += num(i.quantidade);
      else tot[i.produtoId].central += num(i.quantidade);
    });
  });
  return Object.entries(tot)
    .map(([id, v]) => {
      const p = produtos.find(x => x.id === id);
      return { nome: p?.nome || id, unidade: p?.unidade || '', ...v, total: v.central + v.beer };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
}

// Agrupa registros por um campo (ex.: motivo da perda, destino da apara)
export function somaPorCampo(registros, campo) {
  const m = {};
  registros.forEach(r => {
    const k = r[campo] || '?';
    m[k] = (m[k] || 0) + num(r.quantidade);
  });
  return Object.entries(m).map(([cod, valor]) => ({ cod, valor })).sort((a, b) => b.valor - a.valor);
}
