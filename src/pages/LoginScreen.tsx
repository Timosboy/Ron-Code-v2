import { useState } from 'react';
import { Mail, Lock, LogIn, Building2 } from 'lucide-react';
import SegmentedControl from '../components/SegmentedControl';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (!success) {
      setError('Credenciales inválidas. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-800" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.3),transparent_50%)]" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-violet-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/15 backdrop-blur-md mb-4 shadow-xl">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">PropTech-Flow</h1>
          <p className="text-violet-200 text-sm mt-1">Gestión Inmobiliaria Transparente</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Segmented Control */}
          <div className="flex justify-center mb-7">
            <SegmentedControl
              options={['Soy Cliente', 'Soy Agente']}
              value={roleIndex}
              onChange={setRoleIndex}
            />
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-violet-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-violet-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all"
              />
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-medium text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-xl shadow-black/10 hover:bg-violet-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-violet-300 text-[11px] font-medium text-center mb-2">Credenciales de demostración:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setEmail('maria@client.com'); setPassword('1234'); setRoleIndex(0); }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-violet-200 transition-all cursor-pointer text-center"
              >
                maria@client.com
              </button>
              <button
                onClick={() => { setEmail('ana@agent.com'); setPassword('1234'); setRoleIndex(1); }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-violet-200 transition-all cursor-pointer text-center"
              >
                ana@agent.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
