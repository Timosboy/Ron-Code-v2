import { useAuthStore } from './store/authStore';
import LoginScreen from './pages/LoginScreen';
import ClientPortal from './pages/client/ClientPortal';
import AgentPortal from './pages/agent/AgentPortal';

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  if (user.role === 'agent') {
    return <AgentPortal />;
  }

  return <ClientPortal />;
}
