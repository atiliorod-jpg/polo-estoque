import { NavLink } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { statusEstoque } from '../utils/calculos';

const NAV = [
  { to: '/',             icon: '📊', label: 'Início' },
  { to: '/compras',      icon: '🛒', label: 'Compras' },
  { to: '/entradas',     icon: '⬆️', label: 'Entradas' },
  { to: '/saidas',       icon: '⬇️', label: 'Saídas' },
  { to: '/aparas',       icon: '✂️', label: 'Aparas/Perdas' },
  { to: '/fichas',       icon: '🍽️', label: 'Fichas' },
  { to: '/relatorio',    icon: '📋', label: 'Relatório' },
  { to: '/configuracoes',icon: '⚙️', label: 'Config.' },
];

export default function NavBar() {
  const { produtos, calcEstoque } = useApp();
  const estoque = calcEstoque();
  const alertas = produtos.filter(p => {
    const s = statusEstoque(estoque[p.id] ?? 0, p.min, p.max);
    return s === 'critico' || s === 'zerado';
  }).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-polo-navy border-t border-polo-gold/30 z-50">
      <div className="flex">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors relative
               ${isActive ? 'text-polo-gold' : 'text-gray-400 hover:text-gray-200'}`
            }
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="leading-none">{label}</span>
            {to === '/' && alertas > 0 && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {alertas > 9 ? '9+' : alertas}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
