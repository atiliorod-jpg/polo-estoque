import { useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';
import ResponsavelSelect from '../components/ResponsavelSelect';
import { hoje, fmtData, fmtHora, fmtNum } from '../utils/formatters';
import { validarDataRegistro } from '../utils/datas';
import { planejarProducao } from '../utils/producao';

export default function Producao() {
  const { producoes, produtos, addEntrada, addSaida, calcEstoque, listaManual, setListaManual, prefs, setPref } = useApp();
  const { temPermissao } = useAuth();
  const { toast, confirm } = useUI();

  const [data, setData] = useState(hoje());
  const [responsavel, setResponsavel] = useState(prefs.responsavel || '');
  const [receitaId, setReceitaId] = useState(producoes[0]?.id || '');
  const [alvo, setAlvo] = useState('');
  const [armazenamento, setArmazenamento] = useState('congelado');
  const [obs, setObs] = useState('');

  const estoque = calcEstoque();
  const prodNome = (id) => produtos.find(p => p.id === id)?.nome || id;
  const prodUnid = (id) => produtos.find(p => p.id === id)?.unidade || '';

  const receita = producoes.find(r => r.id === receitaId);
  const finalId = receita?.produtoFinalId;
  const alvoNum = parseFloat(alvo) || 0;
  const plano = receita ? planejarProducao(receita, alvoNum || receita.rendimentoBase, estoque) : { itens: [], faltaAlgum: false };

  const registrar = () => {
    const pid = `prc_${Date.now()}`;
    const qtdFinal = alvoNum || parseFloat(receita.rendimentoBase) || 0;
    const obsTxt = `Produção: ${receita.nome}${obs ? ` — ${obs}` : ''}`;
    // ingredientes que ABATEM do estoque (frios/proteínas controlados)
    const abateItens = plano.itens.filter(i => i.abate && i.produtoId && i.quantidade > 0)
      .map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade }));
    // ingredientes SÓ monitorados (estoque seco): registrados, sem baixa
    const monitorados = plano.itens.filter(i => !i.abate && i.quantidade > 0)
      .map(i => ({ nome: i.nome, unidade: i.unidade || '', quantidade: i.quantidade }));
    // 1) saída interna de produção SÓ dos itens controlados
    if (abateItens.length) {
      addSaida({ data, hora: fmtHora(), responsavel, destino: 'producao', producaoId: pid, obs: obsTxt, itens: abateItens });
    }
    // 2) dá entrada no produto final produzido (guarda os monitorados junto)
    addEntrada({
      data, hora: fmtHora(), responsavel, armazenamento, producaoId: pid, obs: obsTxt,
      monitorados,
      itens: [{ produtoId: finalId, quantidade: qtdFinal }],
    });
    if (responsavel) setPref('responsavel', responsavel);
    setAlvo(''); setObs('');
    toast(`Produção registrada: ${fmtNum(qtdFinal)} ${prodUnid(finalId)} de ${prodNome(finalId)}!`, 'sucesso');
  };

  const handleProduzir = async () => {
    if (!receita) { toast('Escolha uma receita.', 'aviso'); return; }
    const qtdFinal = alvoNum || parseFloat(receita.rendimentoBase) || 0;
    if (qtdFinal <= 0) { toast('Informe quanto vai produzir.', 'aviso'); return; }
    const v = validarDataRegistro(data);
    if (!v.ok) { toast('Não é possível registrar em data futura.', 'erro'); return; }
    if (v.confirmar) {
      const ok = await confirm({ titulo: 'Registro antigo', mensagem: `Esta produção é de ${v.dias} dias atrás (${fmtData(data)}). Confirma a data?`, confirmar: 'Sim' });
      if (!ok) return;
    }
    if (plano.faltaAlgum) {
      const lista = plano.itens.filter(i => !i.suficiente)
        .map(i => `• ${prodNome(i.produtoId)}: tem ${fmtNum(i.emEstoque)}, precisa ${fmtNum(i.quantidade)} ${prodUnid(i.produtoId)}`).join('\n');
      const ok = await confirm({
        titulo: 'Ingredientes insuficientes',
        mensagem: `Faltam ingredientes em estoque:\n\n${lista}\n\nProduzir mesmo assim? (o estoque desses itens ficará negativo)`,
        perigo: true, confirmar: 'Produzir assim mesmo',
      });
      if (!ok) return;
    }
    registrar();
  };

  const semReceitas = producoes.length === 0;

  return (
    <Layout title="Produção">
      {semReceitas ? (
          <div className="bg-white rounded-xl p-6 text-center space-y-2">
            <p className="text-3xl">🍲</p>
            <p className="font-semibold text-polo-navy">Nenhuma receita de produção ainda</p>
            <p className="text-sm text-gray-500">
              Aqui você produz itens feitos de vários ingredientes (molhos, caldos, refogados…) e o estoque se atualiza sozinho.
            </p>
            {temPermissao('gerencia')
              ? <Link to="/configuracoes" className="inline-block mt-2 bg-polo-navy text-polo-gold font-bold px-5 py-2.5 rounded-xl text-sm">Criar ficha de produção</Link>
              : <p className="text-xs text-gray-400 mt-2">Peça à gerência para cadastrar as receitas em Configurações.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Receita</label>
                <select value={receitaId} onChange={e => { setReceitaId(e.target.value); const r = producoes.find(x => x.id === e.target.value); if (r?.armazenamento) setArmazenamento(r.armazenamento); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  {producoes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Data</label>
                  <input type="date" value={data} max={hoje()} onChange={e => setData(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Quanto produzir ({prodUnid(finalId)})
                  </label>
                  <input type="number" min="0" step="0.5" value={alvo} onChange={e => setAlvo(e.target.value)}
                    placeholder={receita ? fmtNum(receita.rendimentoBase) : '0'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Armazenamento do produto final</label>
                <div className="flex gap-2">
                  {[['congelado', '❄️ Congelado'], ['resfriado', '🧊 Resfriado']].map(([v, l]) => (
                    <button key={v} onClick={() => setArmazenamento(v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors
                        ${armazenamento === v ? 'border-polo-gold bg-polo-navy text-polo-gold' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsavelSelect value={responsavel} onChange={setResponsavel} />
            </div>

            {/* Produz → resultado */}
            <div className="bg-polo-beige rounded-xl p-4 border border-polo-gold/30">
              <p className="text-sm font-bold text-polo-navy">
                Vai produzir: {fmtNum(alvoNum || receita?.rendimentoBase || 0)} {prodUnid(finalId)} de {prodNome(finalId)}
              </p>
            </div>

            {/* Ingredientes necessários */}
            <div className="bg-white rounded-xl overflow-hidden">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 pt-3">Ingredientes necessários</p>
              {plano.itens.length === 0 && <p className="text-sm text-gray-400 px-4 py-3">Esta receita não tem ingredientes cadastrados.</p>}
              {plano.itens.map((i, idx, arr) => (
                <div key={idx} className={`flex items-center justify-between px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {i.abate ? prodNome(i.produtoId) : i.nome}
                      {!i.abate && <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">só monitora</span>}
                    </div>
                    {i.abate ? (
                      <div className="text-xs text-gray-500">
                        Em estoque: <span className={i.suficiente ? 'text-gray-600 font-semibold' : 'text-red-500 font-semibold'}>{fmtNum(i.emEstoque)} {prodUnid(i.produtoId)}</span>
                        {!i.suficiente && <span className="text-red-500 font-semibold"> • falta {fmtNum(i.falta)}</span>}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Estoque seco — não dá baixa</div>
                    )}
                  </div>
                  <div className="text-sm font-bold text-polo-navy whitespace-nowrap">{fmtNum(i.quantidade)} {i.abate ? prodUnid(i.produtoId) : (i.unidade || '')}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Observação (opcional)</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
                placeholder="Alguma observação..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>

            {plano.faltaAlgum && (
              <button onClick={() => {
                const faltantes = plano.itens.filter(i => i.abate && !i.suficiente && i.falta > 0);
                if (!faltantes.length) return;
                const novos = faltantes.map(i => {
                  const p = produtos.find(x => x.id === i.produtoId);
                  return {
                    id: `lm_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                    produtoId: i.produtoId,
                    nome: p?.nome || i.produtoId,
                    unidade: p?.unidade || '',
                    quantidade: i.falta,
                    origem: `Produção: ${receita.nome}`,
                  };
                });
                setListaManual([...listaManual, ...novos]);
                toast(`${novos.length} item(ns) adicionado(s) à lista de compras.`, 'sucesso');
              }}
                className="w-full border-2 border-polo-gold text-polo-navy font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform">
                🧾 Adicionar faltantes à lista de compras
              </button>
            )}
            <button onClick={handleProduzir}
              className="w-full bg-polo-navy text-polo-gold font-bold py-4 rounded-xl text-base active:scale-95 transition-transform">
              ✓ Registrar Produção
            </button>
            <p className="text-[11px] text-gray-400 text-center -mt-1">
              Isso dá entrada no produto final e abate os ingredientes do estoque automaticamente.
            </p>
          </div>
        )
      }
    </Layout>
  );
}
