import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider } from './store/AppContext';
import { UIProvider } from './store/UIContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Compras from './pages/Compras';
import Entradas from './pages/Entradas';
import Saidas from './pages/Saidas';
import Inventario from './pages/Inventario';
import AparasPerdas from './pages/AparasPerdas';
import Relatorio from './pages/Relatorio';
import Auditoria from './pages/Auditoria';
import Configuracoes from './pages/Configuracoes';

// Rota restrita a um cargo mínimo (gerencia/diretoria)
function Restrito({ cargo = 'gerencia', children }) {
  const { temPermissao } = useAuth();
  return temPermissao(cargo) ? children : <Navigate to="/" replace />;
}

function Rotas() {
  const { sessao } = useAuth();
  if (!sessao) return <Login />;
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/entradas" element={<Entradas />} />
        <Route path="/saidas" element={<Saidas />} />
        <Route path="/aparas" element={<AparasPerdas />} />
        <Route path="/desperdicio" element={<Navigate to="/aparas" replace />} />
        <Route path="/fichas" element={<Navigate to="/compras" replace />} />
        <Route path="/inventario" element={<Restrito><Inventario /></Restrito>} />
        <Route path="/relatorio" element={<Restrito><Relatorio /></Restrito>} />
        <Route path="/auditoria" element={<Restrito><Auditoria /></Restrito>} />
        <Route path="/configuracoes" element={<Restrito><Configuracoes /></Restrito>} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <AppProvider>
          <Rotas />
        </AppProvider>
      </AuthProvider>
    </UIProvider>
  );
}
