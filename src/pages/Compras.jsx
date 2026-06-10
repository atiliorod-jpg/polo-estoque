import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../store/AppContext';
import { useUI } from '../store/UIContext';
import ResponsavelSelect from '../components/ResponsavelSelect';
import { hoje, fmtData, fmtHora, fmtNum } from '../utils/formatters';
import { validarDataRegistro } from '../utils/datas';
import { listaDeCompras } from '../utils/analise';

export default function Compras() {
  const { compras, addCompra, removeCompra, restaurarRegistro, aparas, desperdicio, fichas, calcEstoque, produtos, prefs, setPref } = useApp();
  const { toast, confirm } = useUI();
  const location = useLocation();
  const [form, setForm] = useState({
    data: hoje(), fornecedor: '', item: '', quantidade: '', unidade: 'kg', responsavel: prefs.responsavel || '',
  });
  const [tab, setTab] = useState(location.state?.tab || 'novo'); // novo | lista | historico
  const [fornecedorAuto, setFornecedorAuto] = useState(false);

  const estoque = calcEstoque();
  const lista = useMemo(() => listaDeCompras(produtos, estoque), [produtos, estoque]);

  const copiarLista = async () => {
    const texto = [
      `🧾 LISTA DE COMPRAS — ${fmtData(hoje())}`,
      ...lista.map(({ p, atual, sugerido }) => `• ${p.nome}: comprar ${fmtNum(sugerido)} ${p.unidade} (tem ${fmtNum(atual)}, mín ${p.min})`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      toast('Lista copiada! Cole onde precisar.', 'sucesso');
    } catch {
      toast('Não foi possível copiar automaticamente.', 'aviso');
    }
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Sugestões de itens: matérias-primas das fichas técnicas + itens já comprados
  const itensSugeridos = useMemo(() => {
    const m = new Map();
    fichas.forEach(f => m.set(f.materiaPrima.toLowerCase(), f.materiaPrima));
    compras.forEach(c => c.item && m.set(c.item.toLowerCase(), c.item));
    return [...m.values()].sort((a, b) => a.localeCompare(b));
  }, [fichas, compras]);

  const fornecedoresSugeridos = useMemo(() => {
    const m = new Map();
    compras.forEach(c => {
      const f = (c.fornecedor || '').trim();
      if (f) m.set(f.toLowerCase(), f);
    });
    return [...m.values()].sort((a, b) => a.localeCompare(b));
  }, [compras]);

  // Ao escolher um item já conhecido, pré-preenche o fornecedor do último recebimento dele
  const onItemChange = (valor) => {
    setForm(prev => {
      const ultima = [...compras]
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .find(c => (c.item || '').toLowerCase() === valor.toLowerCase() && (c.fornecedor || '').trim());
      if (ultima && (!prev.fornecedor || fornecedorAuto)) {
        setFornecedorAuto(true);
        return { ...prev, item: valor, fornecedor: ultima.fornecedor, unidade: ultima.unidade || prev.unidade };
      }
      return { ...prev, item: valor };
    });
  };

  const handleSalvar = async () => {
    if (!form.item.trim() || !form.quantidade) {
      toast('Preencha o item e a quantidade.', 'aviso');
      return;
    }
    const v = validarDataRegistro(form.data);
    if (!v.ok) { toast('Não é possível registrar compra em data futura.', 'erro'); return; }
    if (v.confirmar) {
      const ok = await confirm({ titulo: 'Registro antigo', mensagem: `Esta compra é de ${v.dias} dias atrás (${fmtData(form.data)}). Confirma a data?`, confirmar: 'Sim, registrar' });
      if (!ok) return;
    }
    addCompra({ ...form, hora: fmtHora(), quantidade: parseFloat(form.quantidade) });
    if (form.responsavel) setPref('responsavel', form.responsavel);
    setForm(prev => ({ ...prev, item: '', quantidade: '', fornecedor: '' }));
    toast('Compra registrada!', 'sucesso');
  };

  const comprasOrdenadas = [...compras].sort((a, b) => (b.ts || 0) - (a.ts || 0));

  // soma de aparas + desperdício associados a cada compra (monitoramento de rendimento)
  const correcaoDaCompra = (compraId) => {
    const items = [...aparas, ...desperdicio].filter(r => r.compraId === compraId);
    return items.reduce((s, r) => s + (parseFloat(r.quantidade) || 0), 0);
  };

  return (
    <Layout title="Compras / Recebimento">
      <div className="flex bg-white rounded-xl mb-4 p-1 gap-1">
        {[['novo', '+ Nova'], ['lista', `🧾 Lista${lista.length ? ` (${lista.length})` : ''}`], ['historico', '📋 Histórico']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors
              ${tab === v ? 'bg-polo-navy text-polo-gold' : 'text-gray-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'lista' && (
        <div className="space-y-3">
          <div className="bg-polo-beige border border-polo-gold/40 rounded-xl p-3 text-xs text-polo-navy">
            Gerada automaticamente: produtos <strong>abaixo do estoque mínimo</strong>, com a quantidade sugerida para voltar ao máximo.
          </div>
          {lista.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-semibold text-gray-700">Nada para comprar!</p>
              <p className="text-xs text-gray-500 mt-1">Nenhum produto está abaixo do mínimo.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="bg-polo-navy px-4 py-2.5 flex justify-between items-center">
                  <h2 className="text-polo-gold text-sm font-bold">Lista de Compras — {fmtData(hoje())}</h2>
                  <span className="text-white/70 text-xs">{lista.length} itens</span>
                </div>
                {lista.map(({ p, atual, sugerido }, i) => (
                  <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i < lista.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div>
                      <div className="font-medium text-sm text-gray-800">{p.nome}</div>
                      <div className="text-xs text-gray-500">
                        tem <span className={atual <= 0 ? 'text-red-600 font-bold' : 'font-semibold'}>{fmtNum(atual)}</span> • mín {p.min} • máx {p.max || '—'}
                      </div>
                    </div>
                    <span className="font-bold text-polo-navy text-sm bg-polo-beige px-3 py-1.5 rounded-lg">
                      {fmtNum(sugerido)} {p.unidade}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={copiarLista}
                  className="flex-1 bg-polo-navy text-polo-gold font-bold py-3 rounded-xl text-sm">
                  📋 Copiar lista
                </button>
                <button onClick={() => window.print()}
                  className="flex-1 border border-polo-navy text-polo-navy font-semibold py-3 rounded-xl text-sm">
                  🖨️ Imprimir
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'novo' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            Registre o que <strong>chegou bruto</strong> do fornecedor (ex: 25 kg de filé). Isso <strong>não entra no estoque</strong> automaticamente — serve para monitorar compras e o rendimento (aparas/perdas de limpeza associadas a este recebimento).
          </div>

          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data</label>
                <input type="date" value={form.data} max={hoje()} onChange={e => set('data', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Fornecedor (opcional)
                  {fornecedorAuto && form.fornecedor && (
                    <span className="ml-1 text-[10px] font-bold text-polo-gold bg-polo-navy px-1.5 py-0.5 rounded">auto</span>
                  )}
                </label>
                <input type="text" list="lista-fornecedores" value={form.fornecedor}
                  onChange={e => { setFornecedorAuto(false); set('fornecedor', e.target.value); }}
                  placeholder="Nome do fornecedor"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <datalist id="lista-fornecedores">
                  {fornecedoresSugeridos.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item comprado</label>
              <input type="text" list="lista-itens-compra" value={form.item} onChange={e => onItemChange(e.target.value)}
                placeholder="Ex: Filé Mignon, Frango Filé, Picanha..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <datalist id="lista-itens-compra">
                {itensSugeridos.map(i => <option key={i} value={i} />)}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">Digite e escolha da lista — o fornecedor do último recebimento deste item entra sozinho.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade bruta</label>
                <input type="number" min="0" step="0.1" value={form.quantidade} onChange={e => set('quantidade', e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unidade</label>
                <select value={form.unidade} onChange={e => set('unidade', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="kg">kg</option>
                  <option value="unid">unid</option>
                  <option value="cx">caixa</option>
                </select>
              </div>
            </div>

            <ResponsavelSelect value={form.responsavel} onChange={v => set('responsavel', v)} />
          </div>

          <button onClick={handleSalvar}
            className="w-full bg-polo-navy text-polo-gold font-bold py-4 rounded-xl text-base active:scale-95 transition-transform">
            ✓ Registrar Compra
          </button>
        </div>
      ) : tab === 'historico' ? (
        <div className="space-y-3">
          {comprasOrdenadas.length === 0 && (
            <div className="text-center text-gray-500 py-12">Nenhuma compra registrada ainda.</div>
          )}
          {comprasOrdenadas.map(c => {
            const correcao = correcaoDaCompra(c.id);
            const rend = correcao > 0 && c.quantidade > 0 ? (100 - (correcao / c.quantidade) * 100) : null;
            return (
              <div key={c.id} className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{c.item}</div>
                    <div className="text-xs text-gray-500">
                      {fmtData(c.data)} {c.fornecedor && `• ${c.fornecedor}`} {c.responsavel && `• ${c.responsavel}`}
                    </div>
                    <div className="text-xs mt-1">
                      <span className="font-bold text-polo-navy">{fmtNum(c.quantidade)} {c.unidade}</span>
                      {correcao > 0 && (
                        <span className="text-amber-600 ml-2">
                          − {fmtNum(correcao)} {c.unidade} de correção{rend !== null && ` (rend. ${fmtNum(rend)}%)`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={async () => {
                      const ok = await confirm({ titulo: 'Remover compra', mensagem: 'Remover este recebimento?', perigo: true, confirmar: 'Remover' });
                      if (ok) {
                        removeCompra(c.id);
                        toast('Compra removida.', 'sucesso', { acao: { label: 'Desfazer', onClick: () => restaurarRegistro('compra', c) } });
                      }
                    }}
                    className="text-red-400 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 ml-2">
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Layout>
  );
}
