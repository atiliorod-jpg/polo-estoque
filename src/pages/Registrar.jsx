import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

// Hub central de lançamentos — junta num lugar só as ações do dia a dia.
const ACOES = [
  { to: '/entradas',  emoji: '📥', titulo: 'Entrada',       desc: 'Produção pronta entrando no estoque' },
  { to: '/saidas',    emoji: '📤', titulo: 'Saída',         desc: 'Envio para Polo Central / Polo Beer' },
  { to: '/producao',  emoji: '🍲', titulo: 'Produção',      desc: 'Produzir molhos, caldos, refogados…' },
  { to: '/compras',   emoji: '🛒', titulo: 'Compra',        desc: 'Recebimento de matéria-prima' },
  { to: '/aparas',    emoji: '✂️', titulo: 'Apara / Perda', desc: 'Aproveitamento e descarte' },
];

export default function Registrar() {
  return (
    <Layout title="Registrar">
      <p className="text-sm text-gray-500 mb-4">O que você quer registrar agora?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACOES.map(a => (
          <Link key={a.to} to={a.to}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform border border-gray-100
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-polo-gold">
            <span className="w-12 h-12 rounded-xl bg-polo-beige flex items-center justify-center text-2xl flex-shrink-0">{a.emoji}</span>
            <div className="min-w-0">
              <div className="font-bold text-polo-navy">{a.titulo}</div>
              <div className="text-xs text-gray-500">{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
