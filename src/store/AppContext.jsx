import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PRODUTOS_INICIAIS, PESSOAS_INICIAIS } from '../data/produtos';
import { FICHAS_INICIAIS } from '../data/fichas';
import { calcSugestoesMinMax } from '../utils/sugestoes';

const KEY = {
  produtos: 'pe_produtos',
  compras: 'pe_compras',
  entradas: 'pe_entradas',
  saidas: 'pe_saidas',
  aparas: 'pe_aparas',
  desperdicio: 'pe_desperdicio',
  ajustes: 'pe_ajustes',
  pessoas: 'pe_pessoas',
  fichas: 'pe_fichas',
  prefs: 'pe_prefs',
};

const load = (key, fallback) => {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

// Ordering key: prefer explicit ts, fall back to numeric id (ids são Date.now())
const ordemTs = (r) => r.ts || parseInt(r.id, 10) || 0;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [produtos, setProdutosState] = useState(() => load(KEY.produtos, PRODUTOS_INICIAIS));
  const [compras, setComprasState] = useState(() => load(KEY.compras, []));
  const [entradas, setEntradasState] = useState(() => load(KEY.entradas, []));
  const [saidas, setSaidasState] = useState(() => load(KEY.saidas, []));
  const [aparas, setAparasState] = useState(() => load(KEY.aparas, []));
  const [desperdicio, setDesperdicioState] = useState(() => load(KEY.desperdicio, []));
  const [ajustes, setAjustesState] = useState(() => load(KEY.ajustes, []));
  const [pessoas, setPessoasState] = useState(() => load(KEY.pessoas, PESSOAS_INICIAIS));
  const [fichas, setFichasState] = useState(() => load(KEY.fichas, FICHAS_INICIAIS));

  const setFichas = useCallback((val) => {
    setFichasState(val);
    save(KEY.fichas, val);
  }, []);
  const [prefs, setPrefsState] = useState(() => load(KEY.prefs, { responsavel: '', turno: 'Manhã', destino: 'polo_central' }));

  const addPessoa = useCallback((nome) => {
    const n = (nome || '').trim();
    if (!n) return;
    setPessoasState(prev => {
      if (prev.some(p => p.toLowerCase() === n.toLowerCase())) return prev;
      const next = [...prev, n];
      save(KEY.pessoas, next);
      return next;
    });
  }, []);

  const removePessoa = useCallback((nome) => {
    setPessoasState(prev => {
      const next = prev.filter(p => p !== nome);
      save(KEY.pessoas, next);
      return next;
    });
  }, []);

  const setProdutos = useCallback((val) => {
    setProdutosState(val);
    save(KEY.produtos, val);
  }, []);

  const setPref = useCallback((chave, valor) => {
    setPrefsState(prev => {
      const next = { ...prev, [chave]: valor };
      save(KEY.prefs, next);
      return next;
    });
  }, []);

  const makeAdd = (setState, key) => (registro) => {
    setState(prev => {
      const next = [...prev, { ...registro, id: Date.now().toString(), ts: Date.now() }];
      save(key, next);
      return next;
    });
  };

  const makeRemove = (setState, key) => (id) => {
    setState(prev => {
      const next = prev.filter(r => r.id !== id);
      save(key, next);
      return next;
    });
  };

  const addCompra = useCallback(makeAdd(setComprasState, KEY.compras), []);
  const removeCompra = useCallback(makeRemove(setComprasState, KEY.compras), []);
  const addEntrada = useCallback(makeAdd(setEntradasState, KEY.entradas), []);
  const removeEntrada = useCallback(makeRemove(setEntradasState, KEY.entradas), []);
  const addSaida = useCallback(makeAdd(setSaidasState, KEY.saidas), []);
  const removeSaida = useCallback(makeRemove(setSaidasState, KEY.saidas), []);
  const addApara = useCallback(makeAdd(setAparasState, KEY.aparas), []);
  const removeApara = useCallback(makeRemove(setAparasState, KEY.aparas), []);
  const addDesperdicio = useCallback(makeAdd(setDesperdicioState, KEY.desperdicio), []);
  const removeDesperdicio = useCallback(makeRemove(setDesperdicioState, KEY.desperdicio), []);
  const addAjuste = useCallback(makeAdd(setAjustesState, KEY.ajustes), []);
  const removeAjuste = useCallback(makeRemove(setAjustesState, KEY.ajustes), []);

  // Estoque automático: base = Estoque Inicial do produto (ou a última contagem física,
  // se houver). A partir da base, soma entradas e abate saídas, desperdício e aparas.
  const calcEstoque = useCallback(() => {
    const estoque = {};
    const baseTs = {};
    // base inicial = estoqueInicial cadastrado no produto
    produtos.forEach(p => {
      estoque[p.id] = parseFloat(p.estoqueInicial) || 0;
      baseTs[p.id] = 0;
    });

    // se houve contagem física (ajuste), ela vira a nova base a partir do seu momento
    [...ajustes].sort((a, b) => ordemTs(a) - ordemTs(b)).forEach(aj => {
      if (estoque[aj.produtoId] !== undefined) {
        estoque[aj.produtoId] = parseFloat(aj.quantidade) || 0;
        baseTs[aj.produtoId] = ordemTs(aj);
      }
    });

    // soma entradas posteriores à base
    entradas.forEach(e => {
      const t = ordemTs(e);
      (e.itens || []).forEach(item => {
        if (estoque[item.produtoId] !== undefined && t > baseTs[item.produtoId]) {
          estoque[item.produtoId] += parseFloat(item.quantidade) || 0;
        }
      });
    });
    // abate saídas posteriores à base
    saidas.forEach(s => {
      const t = ordemTs(s);
      (s.itens || []).forEach(item => {
        if (estoque[item.produtoId] !== undefined && t > baseTs[item.produtoId]) {
          estoque[item.produtoId] -= parseFloat(item.quantidade) || 0;
        }
      });
    });
    // Perdas (desperdício) abatem SÓ quando a origem é o estoque (item estragou no freezer).
    // Perda no recebimento é fator de correção da compra bruta: não abate.
    // Aparas NUNCA abatem: são subproduto da manipulação (rendimento), não baixa de estoque.
    desperdicio.forEach(r => {
      const t = ordemTs(r);
      if (r.origem === 'estoque' && r.produtoId && estoque[r.produtoId] !== undefined && t > baseTs[r.produtoId]) {
        estoque[r.produtoId] -= parseFloat(r.quantidade) || 0;
      }
    });
    return estoque;
  }, [produtos, entradas, saidas, ajustes, desperdicio]);

  // Modo automático: quando ligado em Configurações, o mín/máx de cada produto
  // acompanha sozinho a média de saídas (3 dias = mín, 6 dias = máx).
  // Converge em uma passada: depois de aplicar, sugestão === valor atual e nada muda.
  useEffect(() => {
    if (!prefs.autoMinMax) return;
    const sug = calcSugestoesMinMax(produtos, saidas);
    let mudou = false;
    const next = produtos.map(p => {
      const s = sug[p.id];
      if (s && (p.min !== s.min || p.max !== s.max)) {
        mudou = true;
        return { ...p, min: s.min, max: s.max };
      }
      return p;
    });
    if (mudou) setProdutos(next);
  }, [produtos, saidas, prefs.autoMinMax, setProdutos]);

  const limparTudo = useCallback(() => {
    setComprasState([]); save(KEY.compras, []);
    setEntradasState([]); save(KEY.entradas, []);
    setSaidasState([]); save(KEY.saidas, []);
    setAparasState([]); save(KEY.aparas, []);
    setDesperdicioState([]); save(KEY.desperdicio, []);
    setAjustesState([]); save(KEY.ajustes, []);
  }, []);

  const resetarProdutos = useCallback(() => {
    setProdutos(PRODUTOS_INICIAIS);
  }, [setProdutos]);

  const exportarBackup = useCallback(() => {
    const dados = {
      versao: 1,
      exportadoEm: new Date().toISOString(),
      produtos, compras, entradas, saidas, aparas, desperdicio, ajustes, pessoas, fichas, prefs,
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_polo_estoque_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [produtos, entradas, saidas, aparas, desperdicio, ajustes, prefs]);

  const importarBackup = useCallback((dados) => {
    if (!dados || typeof dados !== 'object') throw new Error('Arquivo inválido');
    if (dados.produtos) { setProdutosState(dados.produtos); save(KEY.produtos, dados.produtos); }
    if (dados.compras) { setComprasState(dados.compras); save(KEY.compras, dados.compras); }
    if (dados.entradas) { setEntradasState(dados.entradas); save(KEY.entradas, dados.entradas); }
    if (dados.saidas) { setSaidasState(dados.saidas); save(KEY.saidas, dados.saidas); }
    if (dados.aparas) { setAparasState(dados.aparas); save(KEY.aparas, dados.aparas); }
    if (dados.desperdicio) { setDesperdicioState(dados.desperdicio); save(KEY.desperdicio, dados.desperdicio); }
    if (dados.ajustes) { setAjustesState(dados.ajustes); save(KEY.ajustes, dados.ajustes); }
    if (dados.pessoas) { setPessoasState(dados.pessoas); save(KEY.pessoas, dados.pessoas); }
    if (dados.fichas) { setFichasState(dados.fichas); save(KEY.fichas, dados.fichas); }
    if (dados.prefs) { setPrefsState(dados.prefs); save(KEY.prefs, dados.prefs); }
  }, []);

  return (
    <AppContext.Provider value={{
      produtos, setProdutos,
      compras, addCompra, removeCompra,
      entradas, addEntrada, removeEntrada,
      saidas, addSaida, removeSaida,
      aparas, addApara, removeApara,
      desperdicio, addDesperdicio, removeDesperdicio,
      ajustes, addAjuste, removeAjuste,
      pessoas, addPessoa, removePessoa,
      fichas, setFichas,
      prefs, setPref,
      calcEstoque,
      limparTudo, resetarProdutos,
      exportarBackup, importarBackup,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
