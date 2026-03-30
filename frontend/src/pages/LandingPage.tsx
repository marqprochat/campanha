import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { planService, Plan } from '../services/planService';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        planService.listPublicPlans().then(setPlans).catch(console.error);
    }, []);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1a] font-sans text-white" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
                @keyframes float-delay { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
                @keyframes pulse-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slide-in-right { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes chat-bubble { 0% { opacity: 0; transform: translateY(20px) scale(0.8); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delay { animation: float-delay 5s ease-in-out infinite 1s; }
                .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
                .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
                .animate-slide-in-right { animation: slide-in-right 0.8s ease-out forwards; }
                .animate-fade-in { animation: fade-in 1s ease-out forwards; }
                .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
                .animate-gradient { animation: gradient-shift 4s ease infinite; background-size: 200% 200%; }
                .animate-chat-bubble { animation: chat-bubble 0.5s ease-out forwards; }
                
                .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
                .glass-dark { background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); }
                .glass-green { background: rgba(37,211,102,0.08); backdrop-filter: blur(20px); border: 1px solid rgba(37,211,102,0.15); }
                
                .glow-green { box-shadow: 0 0 40px rgba(37,211,102,0.15), 0 0 80px rgba(37,211,102,0.05); }
                .glow-green-strong { box-shadow: 0 0 30px rgba(37,211,102,0.3), 0 0 60px rgba(37,211,102,0.1); }
                .text-glow { text-shadow: 0 0 40px rgba(37,211,102,0.3); }
                
                .plan-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .plan-card:hover { transform: translateY(-8px); }
                .plan-card-popular { background: linear-gradient(135deg, rgba(37,211,102,0.12) 0%, rgba(18,140,126,0.12) 100%); border: 2px solid rgba(37,211,102,0.4); }
                .plan-card-popular:hover { border-color: rgba(37,211,102,0.7); box-shadow: 0 0 40px rgba(37,211,102,0.2); }
                
                .whatsapp-chat-bg { background-color: #0b141a; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }

                .nav-link { position: relative; transition: color 0.3s; }
                .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: #25D366; transition: width 0.3s; }
                .nav-link:hover::after { width: 100%; }
            `}</style>

            {/* Navigation */}
            <nav className="fixed w-full z-50 glass-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <img className="h-10 w-auto" src="/assets/default-logo.png" alt="Influzap Logo" />
                            <span className="font-bold text-xl tracking-tight text-white">Influ<span style={{ color: '#25D366' }}>zap</span></span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('problema')} className="nav-link text-gray-300 hover:text-[#25D366] font-medium">O Problema</button>
                            <button onClick={() => scrollToSection('solucao')} className="nav-link text-gray-300 hover:text-[#25D366] font-medium">A Solução</button>
                            <button onClick={() => scrollToSection('como-funciona')} className="nav-link text-gray-300 hover:text-[#25D366] font-medium">Como Funciona</button>
                            <button onClick={() => scrollToSection('planos')} className="nav-link text-gray-300 hover:text-[#25D366] font-medium">Planos</button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2.5 rounded-full font-semibold transition-all transform hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }}
                            >
                                Começar Agora
                            </button>
                        </div>
                        {/* Mobile menu button */}
                        <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>
                    {/* Mobile menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden pb-4 space-y-2 animate-slide-up">
                            <button onClick={() => scrollToSection('problema')} className="block w-full text-left py-2 px-4 text-gray-300 hover:text-[#25D366] rounded-lg">O Problema</button>
                            <button onClick={() => scrollToSection('solucao')} className="block w-full text-left py-2 px-4 text-gray-300 hover:text-[#25D366] rounded-lg">A Solução</button>
                            <button onClick={() => scrollToSection('como-funciona')} className="block w-full text-left py-2 px-4 text-gray-300 hover:text-[#25D366] rounded-lg">Como Funciona</button>
                            <button onClick={() => scrollToSection('planos')} className="block w-full text-left py-2 px-4 text-gray-300 hover:text-[#25D366] rounded-lg">Planos</button>
                            <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="block w-full text-center py-3 px-4 rounded-xl font-semibold text-white mt-2" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
                                Começar Agora
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* === HERO SECTION === */}
            <section className="pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden relative">
                {/* Background effects */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full animate-pulse-glow" style={{ background: 'radial-gradient(circle, rgba(37,211,102,0.15) 0%, transparent 70%)' }}></div>
                    <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full animate-pulse-glow" style={{ background: 'radial-gradient(circle, rgba(18,140,126,0.1) 0%, transparent 70%)', animationDelay: '1.5s' }}></div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/20 to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <div className="animate-slide-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-green mb-6">
                                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                                <span className="text-sm font-medium text-[#25D366]">A Nova Era dos Influenciadores</span>
                            </div>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                                Seus seguidores{' '}
                                <span className="text-transparent bg-clip-text animate-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #25D366, #128C7E, #075E54, #25D366)' }}>
                                    não veem
                                </span>{' '}
                                seu conteúdo?
                            </h1>

                            <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed max-w-xl">
                                YouTube e Instagram entregam seus vídeos e posts para <strong className="text-white">menos de 10%</strong> dos seus seguidores. 
                                Com o <strong className="text-[#25D366]">Influzap</strong>, notifique <strong className="text-white">100% deles</strong> direto no WhatsApp.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:-translate-y-1 hover:shadow-2xl"
                                    style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 8px 32px rgba(37,211,102,0.3)' }}
                                >
                                    🚀 Começar Agora
                                </button>
                                <button
                                    onClick={() => scrollToSection('como-funciona')}
                                    className="px-8 py-4 rounded-2xl font-bold text-lg glass hover:bg-white/10 transition-all"
                                >
                                    Ver Como Funciona
                                </button>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Ative sua audiência
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Setup em 2 minutos
                                </div>
                            </div>
                        </div>

                        {/* Right - Mock WhatsApp Chat */}
                        <div className="animate-slide-in-right hidden lg:block">
                            <div className="relative">
                                <div className="absolute -inset-4 rounded-3xl animate-pulse-glow" style={{ background: 'radial-gradient(circle, rgba(37,211,102,0.1) 0%, transparent 70%)' }}></div>
                                <div className="whatsapp-chat-bg rounded-3xl overflow-hidden glow-green relative" style={{ maxWidth: '380px', margin: '0 auto' }}>
                                    {/* WhatsApp Header */}
                                    <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#1f2c34' }}>
                                        <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                                            <img src="/favicon.png" alt="" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-white">📢 Canal do Influencer</p>
                                            <p className="text-xs text-gray-400">1.247 membros</p>
                                        </div>
                                    </div>
                                    {/* Chat Messages */}
                                    <div className="p-4 space-y-3" style={{ minHeight: '320px' }}>
                                        <div className="flex justify-start animate-chat-bubble" style={{ animationDelay: '0.3s' }}>
                                            <div className="bg-[#1f2c34] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] border border-white/5">
                                                <p className="text-sm text-gray-200">🔥 <strong>Novo vídeo no ar!</strong></p>
                                                <p className="text-sm text-gray-400 mt-1">5 Dicas para Crescer no Instagram em 2026</p>
                                                <p className="text-[10px] text-gray-500 text-right mt-1">14:32 ✓✓</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-start animate-chat-bubble" style={{ animationDelay: '0.8s' }}>
                                            <div className="bg-[#1f2c34] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] border border-white/5">
                                                <p className="text-sm text-gray-200">🎬 <strong>Live amanhã às 20h!</strong></p>
                                                <p className="text-sm text-gray-400 mt-1">Vou revelar minha nova estratégia de conteúdo</p>
                                                <p className="text-[10px] text-gray-500 text-right mt-1">14:35 ✓✓</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-start animate-chat-bubble" style={{ animationDelay: '1.3s' }}>
                                            <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
                                                <p className="text-sm text-white font-medium">🎁 Link exclusivo para membros!</p>
                                                <p className="text-sm text-white/80 mt-1">Desconto de 50% no meu curso ⬇️</p>
                                                <p className="text-[10px] text-white/60 text-right mt-1">14:38 ✓✓</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end animate-chat-bubble" style={{ animationDelay: '1.8s' }}>
                                            <div className="bg-[#005c4b] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%]">
                                                <p className="text-sm text-gray-200">Incrível! Já ativei o lembrete 🔔</p>
                                                <p className="text-[10px] text-gray-400 text-right mt-1">14:39</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Notification count */}
                                    <div className="absolute top-3 right-4">
                                        <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center animate-bounce-subtle">
                                            <span className="text-xs font-bold text-white">3</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === O PROBLEMA === */}
            <section id="problema" className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1117] to-[#0a0f1a]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16 animate-fade-in">
                        <span className="text-red-400 font-semibold tracking-wide uppercase text-sm">⚠️ O Grande Problema</span>
                        <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
                            As redes sociais <span className="text-red-400">escondem</span> seu conteúdo
                        </h2>
                        <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
                            Algoritmos decidem quem vê seus posts. Seu trabalho está sendo desperdiçado.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { icon: '📉', platform: 'YouTube', stat: '~8%', desc: 'dos inscritos são notificados sobre novos vídeos', color: '#FF0000' },
                            { icon: '📱', platform: 'Instagram', stat: '~5%', desc: 'dos seguidores veem seus stories e posts no feed', color: '#E1306C' },
                            { icon: '🎵', platform: 'TikTok', stat: '~3%', desc: 'de alcance orgânico para conteúdos de contas grandes', color: '#00f2ea' },
                        ].map((item, i) => (
                            <div key={i} className="glass rounded-2xl p-8 text-center hover:border-white/20 transition-all duration-300 group">
                                <div className="text-5xl mb-4">{item.icon}</div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.platform}</h3>
                                <p className="text-4xl font-black mb-2" style={{ color: item.color }}>{item.stat}</p>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 glass-green rounded-2xl p-6 max-w-3xl mx-auto text-center">
                        <p className="text-lg text-gray-300">
                            💡 Com o <strong className="text-[#25D366]">Influzap</strong>, sua taxa de entrega vai para{' '}
                            <span className="text-3xl font-black text-[#25D366]">98%+</span>{' '}
                            porque mensagens no WhatsApp são <strong className="text-white">sempre lidas</strong>.
                        </p>
                    </div>
                </div>
            </section>

            {/* === A SOLUÇÃO === */}
            <section id="solucao" className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,211,102,0.06) 0%, transparent 70%)' }}></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-[#25D366] font-semibold tracking-wide uppercase text-sm">✅ A Solução</span>
                        <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
                            Comunique-se direto com quem <span className="text-[#25D366]">importa</span>
                        </h2>
                        <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
                            Crie grupos inteligentes no WhatsApp e notifique seus seguidores sobre tudo que importa.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: '🔔', title: 'Notificações Diretas', desc: 'Avise seus seguidores sobre novos vídeos, lives e conteúdos diretamente no WhatsApp.' },
                            { icon: '👥', title: 'Grupos Inteligentes', desc: 'Grupos que se expandem automaticamente. Quando um lota, outro é criado instantaneamente.' },
                            { icon: '🔗', title: 'Links Dinâmicos', desc: 'Um único link que sempre redireciona para o grupo certo, sem complicação.' },
                            { icon: '📊', title: 'Dashboard Completo', desc: 'Acompanhe quantos seguidores entraram, mensagens enviadas e engajamento.' },
                        ].map((feature, i) => (
                            <div key={i} className="glass rounded-2xl p-6 hover:border-[#25D366]/30 transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-2xl glass-green flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === COMO FUNCIONA === */}
            <section id="como-funciona" className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0f1923] to-[#0a0f1a]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-[#25D366] font-semibold tracking-wide uppercase text-sm">⚡ Simples e Rápido</span>
                        <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
                            Como funciona o <span className="text-[#25D366]">Influzap</span>?
                        </h2>
                        <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto">
                            Em apenas 4 passos simples, seus seguidores nunca mais perderão seu conteúdo.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: '01',
                                icon: '📝',
                                title: 'Crie sua Conta',
                                desc: 'Crie sua conta e conecte seu WhatsApp em poucos minutos.',
                            },
                            {
                                step: '02',
                                icon: '👥',
                                title: 'Configure seus Grupos',
                                desc: 'Crie grupos temáticos para seus seguidores com links de entrada automáticos.',
                            },
                            {
                                step: '03',
                                icon: '📢',
                                title: 'Compartilhe o Link',
                                desc: 'Divulgue seu link dinâmico nas redes sociais. Seguidores entram com 1 clique.',
                            },
                            {
                                step: '04',
                                icon: '🚀',
                                title: 'Notifique Todos',
                                desc: 'Envie notificações sobre novos conteúdos para todos os grupos de uma vez.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="relative group">
                                {i < 3 && (
                                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#25D366]/30 to-transparent z-0" style={{ width: 'calc(100% - 40px)', left: 'calc(50% + 40px)' }}></div>
                                )}
                                <div className="glass rounded-2xl p-6 relative z-10 hover:border-[#25D366]/30 transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-[#25D366]/30 text-5xl font-black">{item.step}</span>
                                        <span className="text-3xl">{item.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === PLANOS === */}
            <section id="planos" className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,211,102,0.08) 0%, transparent 70%)' }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-[#25D366] font-semibold tracking-wide uppercase text-sm">💎 Planos</span>
                        <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
                            Escolha o plano ideal para <span className="text-[#25D366]">você</span>
                        </h2>
                        <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto">
                            Escolha o plano ideal para escalar sua audiência.
                        </p>
                    </div>

                    <div className={`grid gap-8 max-w-6xl mx-auto ${plans.length === 1 ? 'md:grid-cols-1 max-w-md' : plans.length === 2 ? 'md:grid-cols-2 max-w-3xl' : plans.length >= 3 ? 'md:grid-cols-3' : ''}`}>
                        {plans.length > 0 ? plans.map((plan, i) => {
                            const isPopular = i === Math.floor(plans.length / 2) && plans.length > 1;
                            return (
                                <div key={plan.id} className={`plan-card rounded-3xl p-8 relative ${isPopular ? 'plan-card-popular lg:scale-105' : 'glass'}`}>
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                                                ⭐ MAIS POPULAR
                                            </span>
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                    {plan.description && <p className="text-gray-400 text-sm mb-4">{plan.description}</p>}
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-sm text-gray-400">R$</span>
                                        <span className={`font-black text-white ${isPopular ? 'text-5xl' : 'text-4xl'}`}>
                                            {plan.price.toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className="text-gray-400">/{plan.interval === 'year' ? 'ano' : 'mês'}</span>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {[
                                            { label: `Até ${plan.maxUsers} Usuários`, show: true },
                                            { label: `Até ${plan.maxConnections} Conexões WhatsApp`, show: true },
                                            { label: `Até ${plan.maxContacts.toLocaleString()} Contatos`, show: true },
                                            { label: `Até ${plan.maxCampaigns} Campanhas`, show: true },
                                            { label: `Até ${plan.maxGroups} Grupos`, show: plan.maxGroups > 0 },
                                        ].filter(f => f.show).map((feature, j) => (
                                            <li key={j} className="flex items-center gap-3 text-gray-300 text-sm">
                                                <svg className="w-5 h-5 text-[#25D366] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {feature.label}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full py-3.5 rounded-xl font-semibold transition-all"
                                        style={isPopular
                                            ? { background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: 'white', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }
                                            : { background: 'rgba(255,255,255,0.05)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }
                                        }
                                    >
                                        {isPopular ? '🚀 Assinar Agora' : 'Escolher Plano'}
                                    </button>
                                </div>
                            );
                        }) : (
                            // Fallback static plans if API returns empty
                            [
                                { name: 'Starter', price: 'R$97', desc: 'Ideal para começar.', features: ['1 Conexão WhatsApp', 'Até 1.000 Contatos', '5 Campanhas'] },
                                { name: 'Pro', price: 'R$197', desc: 'Para criadores em crescimento.', features: ['3 Conexões WhatsApp', 'Até 10.000 Contatos', '20 Campanhas', '10 Grupos'], popular: true },
                                { name: 'Enterprise', price: 'R$497', desc: 'Para grandes operações.', features: ['Conexões Ilimitadas', 'Contatos Ilimitados', 'Campanhas Ilimitadas', 'Grupos Ilimitados'] },
                            ].map((plan, i) => (
                                <div key={i} className={`plan-card rounded-3xl p-8 relative ${plan.popular ? 'plan-card-popular lg:scale-105' : 'glass'}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                                                ⭐ MAIS POPULAR
                                            </span>
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{plan.desc}</p>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className={`font-black text-white ${plan.popular ? 'text-5xl' : 'text-4xl'}`}>{plan.price}</span>
                                        <span className="text-gray-400">/mês</span>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((f, j) => (
                                            <li key={j} className="flex items-center gap-3 text-gray-300 text-sm">
                                                <svg className="w-5 h-5 text-[#25D366] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full py-3.5 rounded-xl font-semibold transition-all"
                                        style={plan.popular
                                            ? { background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: 'white', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }
                                            : { background: 'rgba(255,255,255,0.05)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }
                                        }
                                    >
                                        {plan.popular ? '🚀 Assinar Agora' : 'Escolher Plano'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* === CTA FINAL === */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/20 to-transparent"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,211,102,0.08) 0%, transparent 70%)' }}></div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="glass-green rounded-3xl p-12 md:p-16 glow-green">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-glow">
                            Pare de depender dos algoritmos.
                        </h2>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Junte-se a milhares de influenciadores que já usam o <strong className="text-[#25D366]">Influzap</strong> para se comunicar diretamente com seus seguidores.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-5 rounded-2xl font-bold text-lg transition-all transform hover:-translate-y-1 hover:shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 8px 40px rgba(37,211,102,0.4)' }}
                        >
                            🚀 Criar Minha Conta Agora
                        </button>
                        <p className="text-gray-500 text-sm mt-4">
                            Setup em 2 minutos • Suporte prioritário • Cancele quando quiser
                        </p>
                    </div>
                </div>
            </section>

            {/* === FOOTER === */}
            <footer className="py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <img className="h-8 w-auto" src="/assets/default-logo.png" alt="Influzap Logo" />
                                <span className="font-bold text-xl text-white">Influ<span style={{ color: '#25D366' }}>zap</span></span>
                            </div>
                            <p className="text-gray-500 max-w-sm">
                                A plataforma que conecta influenciadores aos seus seguidores através do WhatsApp. 
                                Simples, rápido e com 98%+ de taxa de entrega.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Produto</h4>
                            <ul className="space-y-2 text-gray-500">
                                <li><button onClick={() => scrollToSection('como-funciona')} className="hover:text-[#25D366] transition-colors">Como Funciona</button></li>
                                <li><button onClick={() => scrollToSection('planos')} className="hover:text-[#25D366] transition-colors">Planos</button></li>
                                <li><button onClick={() => navigate('/login')} className="hover:text-[#25D366] transition-colors">Login</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-500">
                                <li><a href="#" className="hover:text-[#25D366] transition-colors">Termos de Uso</a></li>
                                <li><a href="#" className="hover:text-[#25D366] transition-colors">Política de Privacidade</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/5 mt-12 pt-8 text-sm text-center text-gray-600">
                        &copy; {new Date().getFullYear()} Influzap. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
