import { Routes, Route, Outlet } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import Settings from './pages/Settings';
import UIShowcase from './pages/UIShowcase';
import ProtectedRoute from './components/ProtectedRoute';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './components/ui/Toast';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ui-showcase" element={<UIShowcase />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<SocketProvider><Outlet /></SocketProvider>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/room/:id" element={<Room />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;
