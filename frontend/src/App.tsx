import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { ContactsPage } from './pages/ContactsPage';
import { WhatsAppConnectionsPage } from './pages/WhatsAppConnectionsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SuperAdminManagerPage } from './pages/SuperAdminManagerPage';
import { LeadPageList } from './pages/admin/LeadPages/LeadPageList';
import { LeadPageEditor } from './pages/admin/LeadPages/LeadPageEditor';
import { LeadCapturePage } from './pages/public/LeadCapturePage';
import { useGlobalSettings } from './hooks/useGlobalSettings';
import './styles/globals.css';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings } = useGlobalSettings();
  const location = useLocation();

  // Aplicar meta tags dinâmicas (título e favicon)
  useEffect(() => {
    // Atualizar título da página
    if (settings?.pageTitle) {
      document.title = settings.pageTitle;
    }

    // Atualizar favicon
    if (settings?.faviconUrl) {
      // Remover favicons existentes
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Adicionar novo favicon com cache busting
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.href = settings.faviconUrl + '?v=' + Date.now();
      document.head.appendChild(favicon);

      // Adicionar também como shortcut icon para compatibilidade
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.type = 'image/png';
      shortcutIcon.href = settings.faviconUrl + '?v=' + Date.now();
      document.head.appendChild(shortcutIcon);
    }
  }, [settings?.pageTitle, settings?.faviconUrl]);

  useEffect(() => {
    // Generate palette and inject CSS variables
    const primaryColor = settings?.primaryColor || '#3B82F6'; // Default to blue-600 if nothing set

    // Configurações de mistura para criar a escala de cores (baseado no Tailwind Blue)
    // Esses valores definem quanto mesclar com branco (para tons claros) ou preto (para tons escuros)
    const shades = {
      50: { mix: '#ffffff', weight: 0.95 },
      100: { mix: '#ffffff', weight: 0.9 },
      200: { mix: '#ffffff', weight: 0.75 },
      300: { mix: '#ffffff', weight: 0.5 },
      400: { mix: '#ffffff', weight: 0.25 },
      500: { mix: '#ffffff', weight: 0.1 },
      600: { mix: null, weight: 0 }, // Cor base
      700: { mix: '#000000', weight: 0.1 },
      800: { mix: '#000000', weight: 0.25 },
      900: { mix: '#000000', weight: 0.5 },
      950: { mix: '#000000', weight: 0.75 },
    };

    // Helper simples para misturar cores
    const mixColors = (color1: string, color2: string, weight: number) => {
      const d2h = (d: number) => d.toString(16).padStart(2, '0');
      const h2d = (h: string) => parseInt(h, 16);

      let color = color1.replace('#', '');
      let mix = color2.replace('#', '');

      let r = Math.round(h2d(color.substring(0, 2)) * (1 - weight) + h2d(mix.substring(0, 2)) * weight);
      let g = Math.round(h2d(color.substring(2, 4)) * (1 - weight) + h2d(mix.substring(2, 4)) * weight);
      let b = Math.round(h2d(color.substring(4, 6)) * (1 - weight) + h2d(mix.substring(4, 6)) * weight);

      return `#${d2h(r)}${d2h(g)}${d2h(b)}`;
    };

    const root = document.documentElement;

    Object.entries(shades).forEach(([shade, config]) => {
      let colorValue;
      if (config.mix === null) {
        colorValue = primaryColor;
      } else {
        colorValue = mixColors(primaryColor, config.mix, config.weight);
      }
      root.style.setProperty(`--color-primary-${shade}`, colorValue);
    });

  }, [settings?.primaryColor]);

  // Remove any banners dynamically - more specific targeting
  useEffect(() => {
    const removeBanners = () => {
      // Remove elements with specific version banner text
      const elements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && el.textContent.includes('BUILD 2025-09-17-19:02')
      );
      elements.forEach(el => {
        el.remove();
      });
    };

    // Run on mount
    removeBanners();

    // Run every 5 seconds (less aggressive)
    const interval = setInterval(removeBanners, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const isPublicPage = location.pathname.startsWith('/share/') || location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50">
      {isAuthenticated && !isPublicPage && <Navigation />}

      <main className={isPublicPage ? '' : "main-content flex-1 flex flex-col"}>
        <Routes>
          {/* Public Routes */}
          <Route path="/"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/contatos" replace />}
          />
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/contatos" replace />}
          />

          {/* Protected Routes */}
          <Route
            path="/contatos"
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp"
            element={
              <ProtectedRoute>
                <WhatsAppConnectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campanhas"
            element={
              <ProtectedRoute>
                <CampaignsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <SuperAdminManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/tenants"
            element={
              <ProtectedRoute superAdminOnly={true}>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute adminOnly={true}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paginas"
            element={
              <ProtectedRoute>
                <LeadPageList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paginas/nova"
            element={
              <ProtectedRoute>
                <LeadPageEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paginas/:id"
            element={
              <ProtectedRoute>
                <LeadPageEditor />
              </ProtectedRoute>
            }
          />
          <Route path="/share/:slug" element={<LeadCapturePage />} />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div >
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <AppContent />
          <Toaster
            position="top-right"
            containerStyle={{
              top: 80,
            }}
            toastOptions={{
              duration: 4000,
              className: '',
              style: {
                background: '#1e293b',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '12px 16px',
                paddingRight: '40px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                className: '',
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
              },
              error: {
                className: '',
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
              loading: {
                className: '',
                style: {
                  background: '#1e293b',
                  color: '#fff',
                },
              },
            }}
          >
            {(t) => {
              const backgroundColor =
                t.type === 'success' ? '#10b981' :
                  t.type === 'error' ? '#ef4444' :
                    '#1e293b';

              return (
                <div
                  className="flex items-center gap-2"
                  style={{
                    position: 'relative',
                    background: backgroundColor,
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    paddingRight: '40px',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  {/* Ícone baseado no tipo */}
                  {t.type === 'success' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {t.type === 'error' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {t.type === 'loading' && (
                    <svg className="w-5 h-5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}

                  {/* Mensagem */}
                  <div className="flex-1">{t.message as any}</div>

                  {/* Botão fechar */}
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
                    aria-label="Fechar notificação"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            }}
          </Toaster>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;