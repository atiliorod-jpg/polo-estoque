const num = (v) => parseFloat(v) || 0;

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
