import { useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<SocketProvider><Outlet /></SocketProvider>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
