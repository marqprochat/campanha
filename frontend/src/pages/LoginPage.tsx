import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalSettings } from '../hooks/useGlobalSettings';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string().min(6, 'Confirme sua senha'),
}).refine(data => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const R = (num >> 16) & 255;
  const G = (num >> 8) & 255;
  const B = num & 255;
  return `rgba(${R}, ${G}, ${B}, ${alpha})`;
}

export function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { login, setUser, setToken } = useAuth();
  const { settings } = useGlobalSettings();
  const navigate = useNavigate();

  const primaryColor = settings?.primaryColor || '#25D366';
  const darkerColor = useMemo(() => darkenColor(primaryColor, 15), [primaryColor]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.senha);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setRegisterError('');
    try {
      const response = await fetch('/api/auth/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          senha: data.senha,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setRegisterError(result.message || 'Erro ao criar conta');
        return;
      }

      // Auto-login: set token and user
      if (result.data?.token && result.data?.user) {
        localStorage.setItem('auth_token', result.data.token);
        setToken(result.data.token);
        setUser(result.data.user);
        setRegisterSuccess(true);
        // Redirect to subscription page after brief success message
        setTimeout(() => {
          navigate('/configuracoes/assinatura');
        }, 1500);
      }
    } catch (error) {
      setRegisterError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    target.style.outline = 'none';
    target.style.borderColor = primaryColor;
    target.style.boxShadow = `0 0 0 2px ${hexToRgba(primaryColor, 0.2)}`;
  };

  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    target.style.borderColor = '#d1d5db';
    target.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div
            className="lg:w-1/2 p-12 flex items-center justify-center text-white"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%)` }}
          >
            <div className="text-center">
              {settings?.logoUrl ? (
                <div className="mx-auto mb-8 flex items-center justify-center">
                  <img
                    src={settings.logoUrl}
                    alt="Logo do Sistema"
                    className="max-h-32 max-w-[80%] object-contain"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-white/20 rounded-2xl mx-auto mb-8 flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/favicon.png"
                    alt="Influzap"
                    className="w-16 h-16 object-contain"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
              )}
              <h1 className="text-4xl font-bold mb-4">
                {settings?.pageTitle || 'Influzap'}
              </h1>
              <p className="text-xl text-gray-100 mb-8">
                Conecte-se com seus seguidores
              </p>
              <p className="text-gray-200 max-w-md">
                Crie grupos, notifique seguidores e nunca mais dependa dos algoritmos das redes sociais.
              </p>
            </div>
          </div>

          <div className="lg:w-1/2 p-12">
            <div className="max-w-md mx-auto">
              {/* Tab Switcher */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                <button
                  className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: activeTab === 'login' ? primaryColor : 'transparent',
                    color: activeTab === 'login' ? 'white' : '#64748b',
                  }}
                  onClick={() => setActiveTab('login')}
                  type="button"
                >
                  Entrar
                </button>
                <button
                  className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: activeTab === 'register' ? primaryColor : 'transparent',
                    color: activeTab === 'register' ? 'white' : '#64748b',
                  }}
                  onClick={() => setActiveTab('register')}
                  type="button"
                >
                  Criar Conta
                </button>
              </div>

              {activeTab === 'login' ? (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo!</h2>
                    <p className="text-gray-600">Faça login para acessar sua conta</p>
                  </div>

                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                    <div>
                      <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail
                      </label>
                      <input
                        {...loginForm.register('email')}
                        type="email"
                        id="login-email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors"
                        onFocus={inputFocus}
                        onBlur={inputBlur}
                        placeholder="seu@email.com"
                        disabled={isSubmitting}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="mt-2 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="login-senha" className="block text-sm font-medium text-gray-700 mb-2">
                        Senha
                      </label>
                      <input
                        {...loginForm.register('senha')}
                        type="password"
                        id="login-senha"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors"
                        onFocus={inputFocus}
                        onBlur={inputBlur}
                        placeholder="••••••••"
                        disabled={isSubmitting}
                      />
                      {loginForm.formState.errors.senha && (
                        <p className="mt-2 text-sm text-red-600">{loginForm.formState.errors.senha.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full text-white py-3 px-6 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%)`,
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${darkerColor} 0%, ${darkenColor(darkerColor, 15)} 100%)`;
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%)`;
                      }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Entrando...
                        </div>
                      ) : 'Entrar'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {registerSuccess ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}>
                        <svg className="w-8 h-8" fill="none" stroke={primaryColor} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Criada!</h2>
                      <p className="text-gray-600 mb-2">Redirecionando para escolher seu plano...</p>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mt-4" style={{ borderColor: primaryColor }}></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Crie sua Conta</h2>
                        <p className="text-gray-600">Comece a conectar com seus seguidores</p>
                      </div>

                      {registerError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                          {registerError}
                        </div>
                      )}

                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                        <div>
                          <label htmlFor="reg-nome" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nome Completo
                          </label>
                          <input
                            {...registerForm.register('nome')}
                            type="text"
                            id="reg-nome"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors"
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                            placeholder="Seu nome"
                            disabled={isSubmitting}
                          />
                          {registerForm.formState.errors.nome && (
                            <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.nome.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                            E-mail
                          </label>
                          <input
                            {...registerForm.register('email')}
                            type="email"
                            id="reg-email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors"
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                            placeholder="seu@email.com"
                            disabled={isSubmitting}
                          />
                          {registerForm.formState.errors.email && (
                            <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="reg-senha" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Senha
                          </label>
                          <input
                            {...registerForm.register('senha')}
                            type="password"
                            id="reg-senha"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors"
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                          />
                          {registerForm.formState.errors.senha && (
                            <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.senha.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="reg-confirmar" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Confirmar Senha
                          </label>
                          <input
                            {...registerForm.register('confirmarSenha')}
                            type="password"
                            id="reg-confirmar"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors"
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                          />
                          {registerForm.formState.errors.confirmarSenha && (
                            <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmarSenha.message}</p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full text-white py-3 px-6 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%)`,
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${darkerColor} 0%, ${darkenColor(darkerColor, 15)} 100%)`;
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%)`;
                          }}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Criando conta...
                            </div>
                          ) : 'Criar Conta Grátis'}
                        </button>

                        <p className="text-xs text-center text-gray-500 mt-3">
                          Após criar sua conta, escolha um plano para ativar todas as funcionalidades.
                        </p>
                      </form>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}