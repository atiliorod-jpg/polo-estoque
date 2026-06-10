import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../store/AppContext';
import { useUI } from '../store/UIContext';
import { CATEGORIAS } from '../data/produtos';
import { calcSugestoesMinMax, DIAS_MIN, DIAS_MAX } from '../utils/sugestoes';

function ModalProduto({ produto, sugestao, onSalvar, onFechar }) {
  const [form, setForm] = useState(produto || {
    nome: '', categoria: CATEGORIAS[0], unidade: 'kg', estoqueInicial: 0, min: 0, max: 0, ativo: true,
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto overscroll-contain p-4 flex">
      <div className="bg-white w-full max-w-lg m-auto rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-polo-navy">{produto ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onFechar} className="text-2xl text-gray-400">×</button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do produto</label>
          <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
            placeholder="Ex: Filé de tilápia"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
          <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Unidade de medida</label>
          <div className="flex gap-2">
            {['kg', 'unid', 'g', 'L'].map(u => (
              <button key={u} onClick={() => set('unidade', u)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors
                  ${form.unidade === u ? 'border-polo-gold bg-polo-navy text-polo-gold' : 'border-gray-200 text-gray-600'}`}>
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Estoque Inicial (ponto de partida)
          </label>
          <input type="number" min="0" step="0.5" value={form.estoqueInicial ?? 0} onChange={e => set('estoqueInicial', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <p className="text-xs text-gray-400 mt-1">Quanto há hoje. A partir daqui, entradas/saídas/perdas calculam sozinhas.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Estoque Mínimo (3 dias)
            </label>
            <input type="number" min="0" step="0.5" value={form.min} onChange={e => set('min', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Estoque Máximo (6 dias)
            </label>
            <input type="number" min="0" step="0.5" value={form.max} onChange={e => set('max', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Mín/Máx: 0 = sem meta definida (não exibe alerta)</p>

        {sugestao && (
          <div className="flex items-center justify-between bg-polo-beige border border-polo-gold/50 rounded-xl px-3 py-2 -mt-1">
            <p className="text-xs text-polo-navy">
              💡 Pelo consumo dos últimos {sugestao.dias} dias:{' '}
              <strong>mín {sugestao.min} / máx {sugestao.max}</strong>
            </p>
            <button onClick={() => setForm(prev => ({ ...prev, min: sugestao.min, max: sugestao.max }))}
              className="text-xs font-bold text-polo-navy border border-polo-navy/30 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2">
              Aplicar
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <span className="text-sm text-gray-700 flex-1">Produto ativo</span>
          <button onClick={() => set('ativo', !form.ativo)}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.ativo ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.ativo ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onFechar}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">
            Cancelar
          </button>
          <button onClick={() => onSalvar(form)} disabled={!form.nome.trim()}
            className="flex-1 bg-polo-navy text-polo-gold font-bold py-3 rounded-xl disabled:opacity-40">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const { produtos, setProdutos, saidas, limparTudo, resetarProdutos, exportarBackup, importarBackup,
          pessoas, addPessoa, removePessoa, prefs, setPref } = useApp();
  const { toast, confirm } = useUI();
  const sugestoes = calcSugestoesMinMax(produtos, saidas);
  const [catAtiva, setCatAtiva] = useState('TODOS');
  const [editando, setEditando] = useState(null);
  const [criando, setCriando] = useState(false);
  const [busca, setBusca] = useState('');
  const [novaPessoa, setNovaPessoa] = useState('');
  const fileRef = useRef(null);

  const handleAddPessoa = () => {
    const n = novaPessoa.trim();
    if (!n) return;
    if (pessoas.some(p => p.toLowerCase() === n.toLowerCase())) {
      toast('Essa pessoa já está cadastrada.', 'aviso');
      return;
    }
    addPessoa(n);
    setNovaPessoa('');
    toast('Pessoa cadastrada.', 'sucesso');
  };

  const handleImportar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dados = JSON.parse(ev.target.result);
        const ok = await confirm({
          titulo: 'Restaurar backup',
          mensagem: 'Isso vai SUBSTITUIR todos os dados atuais pelos do arquivo. Continuar?',
          perigo: true,
          confirmar: 'Restaurar',
        });
        if (ok) {
          importarBackup(dados);
          toast('Backup restaurado com sucesso!', 'sucesso');
        }
      } catch {
        toast('Arquivo inválido. Selecione um backup válido.', 'erro');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const produtosFiltrados = produtos.filter(p => {
    const matchCat = catAtiva === 'TODOS' || p.categoria === catAtiva;
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  const handleSalvar = (form) => {
    if (editando) {
      setProdutos(produtos.map(p => p.id === editando.id ? { ...p, ...form } : p));
      toast('Produto atualizado.', 'sucesso');
    } else {
      const newId = `custom_${Date.now()}`;
      setProdutos([...produtos, { ...form, id: newId }]);
      toast('Produto adicionado.', 'sucesso');
    }
    setEditando(null);
    setCriando(false);
  };

  const toggleAtivo = (id) => {
    setProdutos(produtos.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
  };

  const excluir = async (id) => {
    const ok = await confirm({
      titulo: 'Excluir produto',
      mensagem: 'Excluir este produto? Os registros históricos não serão afetados.',
      perigo: true,
      confirmar: 'Excluir',
    });
    if (ok) {
      setProdutos(produtos.filter(p => p.id !== id));
      toast('Produto excluído.', 'sucesso');
    }
  };

  return (
    <Layout
      title="Configurações"
      actions={
        <button onClick={() => setCriando(true)}
          className="bg-polo-gold text-polo-navy text-xs font-bold px-3 py-1.5 rounded-lg">
          + Produto
        </button>
      }
    >
      {/* Busca */}
      <div className="mb-3">
        <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
      </div>

      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
        {['TODOS', ...CATEGORIAS].map(c => (
          <button key={c} onClick={() => setCatAtiva(c)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0
              ${catAtiva === c ? 'bg-polo-navy text-polo-gold' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {c === 'TODOS' ? 'Todos' : c}
          </button>
        ))}
      </div>

      {/* Lista de produtos */}
      <div className="bg-white rounded-xl overflow-hidden mb-4">
        {produtosFiltrados.map((p, i, arr) => (
          <div key={p.id} className={`flex items-center px-4 py-3 gap-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''} ${!p.ativo ? 'opacity-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-800 truncate">{p.nome}</div>
              <div className="text-xs text-gray-400">
                {p.categoria} • {p.unidade}
                {(p.estoqueInicial > 0) && ` • Inicial ${p.estoqueInicial}`}
                {(p.min > 0 || p.max > 0) && ` • Mín ${p.min} / Máx ${p.max}`}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditando(p)}
                className="text-xs text-polo-navy font-semibold px-2 py-1.5 rounded-lg bg-gray-100">
                Editar
              </button>
              <button onClick={() => toggleAtivo(p.id)}
                className={`text-xs font-semibold px-2 py-1.5 rounded-lg ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => excluir(p.id)}
                className="text-xs text-red-400 font-semibold px-2 py-1.5 rounded-lg bg-red-50">
                ×
              </button>
            </div>
          </div>
        ))}
        {produtosFiltrados.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">Nenhum produto encontrado.</div>
        )}
      </div>

      {/* Ajuste automático de mín/máx */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-polo-navy">🤖 Ajuste automático de Mín/Máx</p>
            <p className="text-xs text-gray-500 mt-0.5">
              O sistema recalcula sozinho o estoque mínimo ({DIAS_MIN} dias de consumo) e máximo ({DIAS_MAX} dias)
              de cada produto pela média de saídas dos últimos 30 dias. Desligado, ele apenas sugere e você aprova.
            </p>
          </div>
          <button onClick={() => {
              const novo = !prefs.autoMinMax;
              setPref('autoMinMax', novo);
              toast(novo ? 'Ajuste automático LIGADO — mín/máx acompanham o consumo.' : 'Ajuste automático desligado — voltam as sugestões manuais.', 'sucesso');
            }}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${prefs.autoMinMax ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs.autoMinMax ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Contagem física */}
      <Link to="/inventario"
        className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 mb-4 active:scale-[0.99] transition-transform">
        <div>
          <p className="text-sm font-bold text-polo-navy">📐 Contagem física / conferência</p>
          <p className="text-xs text-gray-500 mt-0.5">Use quando conferir o estoque real e ele divergir do calculado.</p>
        </div>
        <span className="text-polo-navy text-lg">›</span>
      </Link>

      {/* Equipe */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4">
        <div>
          <p className="text-xs font-bold text-polo-navy uppercase tracking-wide">Equipe / Responsáveis</p>
          <p className="text-xs text-gray-500 mt-1">Quem aparece para selecionar ao registrar entradas, saídas, aparas e perdas.</p>
        </div>
        <div className="flex gap-2">
          <input type="text" value={novaPessoa} onChange={e => setNovaPessoa(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddPessoa(); }}
            placeholder="Nome da pessoa"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleAddPessoa}
            className="bg-polo-navy text-polo-gold font-bold px-4 rounded-lg text-sm">+ Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {pessoas.length === 0 && <span className="text-xs text-gray-400">Nenhuma pessoa cadastrada ainda.</span>}
          {pessoas.map(p => (
            <span key={p} className="inline-flex items-center gap-2 bg-polo-beige rounded-full pl-3 pr-2 py-1 text-sm font-medium text-polo-navy">
              {p}
              <button onClick={async () => {
                  const ok = await confirm({ titulo: 'Remover pessoa', mensagem: `Remover ${p} da equipe? Registros antigos não mudam.`, perigo: true, confirmar: 'Remover' });
                  if (ok) { removePessoa(p); toast('Pessoa removida.', 'sucesso'); }
                }}
                className="text-red-400 font-bold text-base leading-none">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4">
        <div>
          <p className="text-xs font-bold text-polo-navy uppercase tracking-wide">Backup dos Dados</p>
          <p className="text-xs text-gray-500 mt-1">
            Exporte um arquivo de segurança regularmente. Se trocar de tablet ou limpar o navegador, restaure por aqui.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { exportarBackup(); toast('Backup exportado!', 'sucesso'); }}
            className="flex-1 bg-polo-navy text-polo-gold font-bold py-2.5 rounded-xl text-sm">
            ↓ Exportar backup
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex-1 border border-polo-navy text-polo-navy font-semibold py-2.5 rounded-xl text-sm">
            ↑ Restaurar backup
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportar} className="hidden" />
      </div>

      {/* Zona de perigo */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Zona de Perigo</p>
        <button onClick={async () => {
          const ok = await confirm({ titulo: 'Restaurar produtos padrão', mensagem: 'Restaurar a lista de produtos padrão? Os valores de mín/máx personalizados serão redefinidos.', perigo: true, confirmar: 'Restaurar' });
          if (ok) { resetarProdutos(); toast('Produtos restaurados ao padrão.', 'sucesso'); }
        }}
          className="w-full border border-red-300 text-red-600 font-semibold py-2.5 rounded-xl text-sm">
          Restaurar produtos padrão
        </button>
        <button onClick={async () => {
          const ok = await confirm({ titulo: 'Apagar todos os registros', mensagem: 'ATENÇÃO: isso apaga entradas, saídas, aparas, desperdício e contagens. Esta ação não pode ser desfeita.\n\nDica: exporte um backup antes.', perigo: true, confirmar: 'Apagar tudo' });
          if (ok) { limparTudo(); toast('Todos os registros foram apagados.', 'sucesso'); }
        }}
          className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm">
          Apagar todos os registros
        </button>
      </div>

      {(editando || criando) && (
        <ModalProduto
          produto={editando}
          sugestao={editando ? sugestoes[editando.id] : null}
          onSalvar={handleSalvar}
          onFechar={() => { setEditando(null); setCriando(false); }}
        />
      )}
    </Layout>
  );
}
