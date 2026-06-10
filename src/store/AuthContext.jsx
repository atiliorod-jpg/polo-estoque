import { createContext, useContext, useState, useCallback } from 'react';

// Níveis de permissão: quanto maior, mais acesso.
export const CARGOS = [
  { id: 'cozinha', label: 'Cozinha', nivel: 0 },
  { id: 'gerencia', label: 'Gerência', nivel: 1 },
  { id: 'diretoria', label: 'Diretoria', nivel: 2 },
];

export const nivelDoCargo = (cargo) => CARGOS.find(c => c.id === cargo)?.nivel ?? 0;

const KEY_USUARIOS = 'pe_usuarios';
const KEY_SESSAO = 'pe_sessao';

const load = (k, fb) => {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; }
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarios, setUsuariosState] = useState(() => load(KEY_USUARIOS, []));
  const [sessao, setSessaoState] = useState(() => load(KEY_SESSAO, null));

  const setUsuarios = useCallback((val) => {
    setUsuariosState(val);
    save(KEY_USUARIOS, val);
  }, []);

  const criarUsuario = useCallback((nome, pin, cargo) => {
    const novo = { id: `u_${Date.now()}`, nome: nome.trim(), pin: String(pin), cargo };
    setUsuariosState(prev => {
      const next = [...prev, novo];
      save(KEY_USUARIOS, next);
      return next;
    });
    return novo;
  }, []);

  const login = useCallback((usuarioId, pin) => {
    const u = load(KEY_USUARIOS, []).find(x => x.id === usuarioId);
    if (!u || String(u.pin) !== String(pin)) return false;
    const s = { usuarioId: u.id, nome: u.nome, cargo: u.cargo, ts: Date.now() };
    setSessaoState(s);
    save(KEY_SESSAO, s);
    return true;
  }, []);

  const logout = useCallback(() => {
    setSessaoState(null);
    localStorage.removeItem(KEY_SESSAO);
  }, []);

  // temPermissao('gerencia') => true se o cargo logado for gerência ou acima
  const temPermissao = useCallback((cargoMinimo) => {
    if (!sessao) return false;
    return nivelDoCargo(sessao.cargo) >= nivelDoCargo(cargoMinimo);
  }, [sessao]);

  return (
    <AuthContext.Provider value={{ usuarios, setUsuarios, criarUsuario, sessao, login, logout, temPermissao }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
