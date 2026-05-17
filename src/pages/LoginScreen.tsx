import { useState } from 'react';
import { Mail, Lock, Building2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <div className="absolute inset-0">
          <img 
            src="/login-bg.png" 
            alt="Modern Corporate Building" 
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
        </div>
        
        {/* Content on Image */}
        <div className="relative z-10 flex flex-col justify-end p-12 w-full">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mb-6 border border-white/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">PropTech-Flow</h1>
          <p className="text-xl text-gray-300 font-medium max-w-md">
            El futuro de la gestión inmobiliaria. Conecta clientes y propiedades con total transparencia.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-y-auto overflow-x-hidden scrollbar-hide">
        {/* Mobile background image */}
        <div className="absolute inset-0 lg:hidden">
          <img 
            src="/login-bg.png" 
            alt="Modern Corporate Building" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 w-full max-w-md my-auto py-6">
          <div className="text-center lg:text-left mb-6">
            <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 mb-4">
              <Building2 className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Bienvenido</h2>
            <p className="text-gray-500 mt-1.5 font-medium text-sm sm:text-base">Ingresa tus datos para acceder a tu cuenta.</p>
          </div>

          <div className="mb-6">
            <SegmentedControl
              options={['Soy Cliente', 'Soy Agente']}
              value={roleIndex}
              onChange={setRoleIndex}
            />
          </div>

          {/* Form */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full mt-2 py-3.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar a la plataforma
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400 font-medium lg:bg-white bg-transparent">Credenciales de prueba</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => { setEmail('maria@client.com'); setPassword('1234'); setRoleIndex(0); }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all cursor-pointer shadow-sm group"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-violet-500 mb-0.5">Cliente</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-violet-700">maria@client.com</span>
              </button>
              <button
                onClick={() => { setEmail('ana@agent.com'); setPassword('1234'); setRoleIndex(1); }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all cursor-pointer shadow-sm group"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-violet-500 mb-0.5">Agente</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-violet-700">ana@agent.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
