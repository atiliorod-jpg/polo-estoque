import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { UIProvider } from './store/UIContext';
import Dashboard from './pages/Dashboard';
import Compras from './pages/Compras';
import Entradas from './pages/Entradas';
import Saidas from './pages/Saidas';
import Inventario from './pages/Inventario';
import AparasPerdas from './pages/AparasPerdas';
import Fichas from './pages/Fichas';
import Relatorio from './pages/Relatorio';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <UIProvider>
      <AppProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/entradas" element={<Entradas />} />
            <Route path="/saidas" element={<Saidas />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/aparas" element={<AparasPerdas />} />
            <Route path="/desperdicio" element={<Navigate to="/aparas" replace />} />
            <Route path="/fichas" element={<Fichas />} />
            <Route path="/relatorio" element={<Relatorio />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </UIProvider>
  );
}
