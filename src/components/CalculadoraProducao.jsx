import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { planejarProducao } from '../utils/producao';
import { fmtNum } from '../utils/formatters';

// Calculadora de apoio: dada uma receita e a quantidade-alvo, mostra TODOS os
// ingredientes (abate + monitor) e o que falta no estoque. Não registra nada
// — é só pra produção se organizar antes de começar a fazer.
export default function CalculadoraProducao() {
  const { producoes, produtos, calcEstoque } = useApp();
  const [aberto, setAberto] = useState(false);
  const [receitaId, setReceitaId] = useState(producoes[0]?.id || '');
  const [alvo, setAlvo] = useState('');

  if (!producoes.length) return null;

  const receita = producoes.find(r => r.id === receitaId) || producoes[0];
  const estoque = calcEstoque();
  const prodNome = (id) => produtos.find(p => p.id === id)?.nome || id;
  const prodUnid = (id) => produtos.find(p => p.id === id)?.unidade || '';
  const finalNome = prodNome(receita.produtoFinalId);
  const finalUnid = prodUnid(receita.produtoFinalId);
  const alvoNum = parseFloat(alvo) || 0;
  const usado = alvoNum || receita.rendimentoBase;
  const plano = planejarProducao(receita, usado, estoque);

  return (
    <div className="bg-white rounded-2xl border border-polo-gold/30 mb-3 overflow-hidden">
      <button onClick={() => setAberto(!aberto)}
        className="w-full px-4 py-3 flex items-center justify-between text-left active:bg-polo-beige/50"
        aria-expanded={aberto}>
        <div className="min-w-0">
          <p className="text-sm font-bold text-polo-navy">🧮 Calculadora de produção</p>
          <p className="text-xs text-gray-500">Veja o que precisa antes de começar a produzir</p>
        </div>
        <span className="text-polo-navy text-xl flex-shrink-0 ml-2">{aberto ? '−' : '+'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={receitaId} onChange={e => setReceitaId(e.target.value)}
              aria-label="Receita"
              className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white min-w-0">
              {producoes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
            <div className="flex gap-1.5 items-center">
              <input type="number" min="0" step="0.5" value={alvo} onChange={e => setAlvo(e.target.value)}
                placeholder={fmtNum(receita.rendimentoBase)}
                aria-label={`Quantidade a produzir em ${finalUnid}`}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm" />
              <span className="text-xs text-gray-500 whitespace-nowrap">{finalUnid}</span>
            </div>
          </div>

          <div className="bg-polo-beige/40 rounded-xl p-3">
            <p className="text-xs text-polo-navy mb-2">
              Para produzir <strong>{fmtNum(usado)} {finalUnid}</strong> de {finalNome}, precisa de:
            </p>
            <div className="space-y-1">
              {plano.itens.length === 0 && <p className="text-xs text-gray-500">Receita sem ingredientes cadastrados.</p>}
              {plano.itens.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-2">
                  <span className="text-gray-700 truncate">
                    {i.abate ? prodNome(i.produtoId) : i.nome}
                    {!i.abate && <span className="ml-1 text-amber-700">(seco)</span>}
                  </span>
                  <span className={`font-bold whitespace-nowrap ${i.abate && !i.suficiente ? 'text-red-600' : 'text-polo-navy'}`}>
                    {fmtNum(i.quantidade)} {i.abate ? prodUnid(i.produtoId) : (i.unidade || '')}
                    {i.abate && !i.suficiente && <span className="ml-1 font-semibold">• falta {fmtNum(i.falta)}</span>}
                  </span>
                </div>
              ))}
            </div>
            {plano.faltaAlgum && (
              <p className="text-[11px] text-red-600 mt-2">⚠ Faltam ingredientes controlados em estoque.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
