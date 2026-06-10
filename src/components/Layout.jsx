import { Link } from 'react-router-dom';
import NavBar from './NavBar';
import { useAuth } from '../store/AuthContext';
import { useUI } from '../store/UIContext';

export default function Layout({ title, children, actions }) {
  const { sessao, logout, temPermissao } = useAuth();
  const { confirm } = useUI();

  const sair = async () => {
    const ok = await confirm({ titulo: 'Sair', mensagem: `Encerrar a sessão de ${sessao?.nome}?`, confirmar: 'Sair' });
    if (ok) logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-polo-beige pb-24">
      <header className="bg-gradient-to-r from-polo-navy via-polo-navy to-[#24375456] bg-polo-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-polo-gold/15 ring-1 ring-polo-gold/30 flex items-center justify-center text-base flex-shrink-0">🍺</span>
          <h1 className="text-base font-bold text-polo-gold tracking-wide truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          {sessao && (
            <div className="flex items-center gap-1.5">
              {temPermissao('gerencia') && (
                <Link to="/auditoria" title="Histórico de mudanças"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm active:scale-90 transition-transform">
                  🕘
                </Link>
              )}
              <button onClick={sair} title={`${sessao.nome} — sair`}
                className="flex items-center gap-1.5 bg-white/10 rounded-full pl-2.5 pr-3 py-1.5 active:scale-95 transition-transform">
                <span className="w-5 h-5 rounded-full bg-polo-gold text-polo-navy text-[10px] font-bold flex items-center justify-center">
                  {sessao.nome.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[10px] font-semibold text-white/80 max-w-16 truncate">{sessao.nome.split(' ')[0]}</span>
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <NavBar />
    </div>
  );
}
