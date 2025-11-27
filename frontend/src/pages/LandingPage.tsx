import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
    const navigate = useNavigate();
    const logo = "/assets/default-logo.png";

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navigation */}
            <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <img className="h-10 w-auto" src={logo} alt="Logo" />
                            <span className="font-bold text-xl tracking-tight text-slate-900">QuePasa</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('features')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Recursos</button>
                            <button onClick={() => scrollToSection('pricing')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Planos</button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
                            >
                                Entrar
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8">
                        Revolucione sua <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                            Comunicação no WhatsApp
                        </span>
                    </h1>
                    <p className="mt-6 text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Automatize conversas, gerencie contatos e impulsione suas vendas com a plataforma mais completa de marketing para WhatsApp.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all transform hover:-translate-y-1"
                        >
                            Começar Agora
                        </button>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Saber Mais
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm">Recursos Poderosos</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Tudo que você precisa para crescer
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
                            Ferramentas avançadas simplificadas para maximizar seus resultados.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Feature 1 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Gestão de Contatos</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Organize seus leads e clientes em listas segmentadas. Importe contatos facilmente e mantenha tudo organizado.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Disparos em Massa</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Envie campanhas personalizadas para milhares de contatos com apenas alguns cliques. Alta taxa de entrega.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6 text-pink-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Relatórios Detalhados</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Acompanhe o desempenho das suas campanhas em tempo real. Métricas de entrega, leitura e resposta.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                            Planos Flexíveis
                        </h2>
                        <p className="mt-4 text-xl text-slate-500">
                            Escolha o plano ideal para o tamanho do seu negócio.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Starter Plan */}
                        <div className="border border-slate-200 rounded-2xl p-8 hover:border-blue-300 transition-colors">
                            <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                            <div className="mt-4 flex items-baseline text-slate-900">
                                <span className="text-4xl font-extrabold tracking-tight">R$97</span>
                                <span className="ml-1 text-xl font-semibold text-slate-500">/mês</span>
                            </div>
                            <p className="mt-4 text-slate-500 text-sm">Ideal para quem está começando.</p>
                            <ul className="mt-6 space-y-4">
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    1 Conexão WhatsApp
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Até 1.000 Contatos
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Disparos Manuais
                                </li>
                            </ul>
                            <button onClick={() => navigate('/login')} className="mt-8 block w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                                Começar Grátis
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className="border-2 border-blue-600 rounded-2xl p-8 relative shadow-2xl shadow-blue-900/10 transform scale-105 bg-white">
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Popular
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
                            <div className="mt-4 flex items-baseline text-slate-900">
                                <span className="text-5xl font-extrabold tracking-tight">R$197</span>
                                <span className="ml-1 text-xl font-semibold text-slate-500">/mês</span>
                            </div>
                            <p className="mt-4 text-slate-500 text-sm">Para negócios em crescimento.</p>
                            <ul className="mt-6 space-y-4">
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    3 Conexões WhatsApp
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Até 10.000 Contatos
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Automação de Campanhas
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Suporte Prioritário
                                </li>
                            </ul>
                            <button onClick={() => navigate('/login')} className="mt-8 block w-full bg-blue-600 rounded-xl py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
                                Assinar Agora
                            </button>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="border border-slate-200 rounded-2xl p-8 hover:border-blue-300 transition-colors">
                            <h3 className="text-lg font-semibold text-slate-900">Enterprise</h3>
                            <div className="mt-4 flex items-baseline text-slate-900">
                                <span className="text-4xl font-extrabold tracking-tight">R$497</span>
                                <span className="ml-1 text-xl font-semibold text-slate-500">/mês</span>
                            </div>
                            <p className="mt-4 text-slate-500 text-sm">Para grandes operações.</p>
                            <ul className="mt-6 space-y-4">
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Conexões Ilimitadas
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Contatos Ilimitados
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    API Dedicada
                                </li>
                                <li className="flex text-slate-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Gerente de Conta
                                </li>
                            </ul>
                            <button onClick={() => navigate('/login')} className="mt-8 block w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                                Falar com Vendas
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <img className="h-8 w-auto brightness-0 invert" src={logo} alt="Logo" />
                                <span className="font-bold text-xl text-white">QuePasa</span>
                            </div>
                            <p className="max-w-xs">
                                A plataforma completa para revolucionar seu marketing no WhatsApp. Simples, rápido e eficiente.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Produto</h4>
                            <ul className="space-y-2">
                                <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                                <li><a href="/login" className="hover:text-white transition-colors">Login</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 mt-12 pt-8 text-sm text-center">
                        &copy; {new Date().getFullYear()} QuePasa. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
