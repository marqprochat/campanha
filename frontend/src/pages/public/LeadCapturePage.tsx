import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { leadPageService } from '../../services/leadPageService';
import { api } from '../../services/api';
import { LeadPage } from '../../types/LeadPage';
import toast from 'react-hot-toast';

export const LeadCapturePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<LeadPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        captchaAnswer: ''
    });

    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
    const [companyName, setCompanyName] = useState<string>('');

    const generateCaptcha = () => {
        setCaptcha({
            num1: Math.floor(Math.random() * 10),
            num2: Math.floor(Math.random() * 10)
        });
        setFormData(prev => ({ ...prev, captchaAnswer: '' }));
    };

    useEffect(() => {
        if (slug) {
            loadPage(slug);
            generateCaptcha();
            loadSettings();
        }
    }, [slug]);

    const loadSettings = async () => {
        try {
            const settings = await api.get<any>('/settings/public');
            if (settings?.companyName) {
                setCompanyName(settings.companyName);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const loadPage = async (slug: string) => {
        try {
            const data = await leadPageService.getPublicBySlug(slug);
            setPage(data);

            // Update page title
            if (data.title) {
                document.title = data.title;
            }
        } catch (error) {
            console.error('Error loading page:', error);
            toast.error('Página não encontrada ou indisponível');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;

        // Verify Captcha
        const expected = captcha.num1 + captcha.num2;
        if (parseInt(formData.captchaAnswer) !== expected) {
            toast.error(`Math incorreto: ${captcha.num1} + ${captcha.num2} não é ${formData.captchaAnswer}`);
            generateCaptcha();
            return;
        }

        setSubmitting(true);
        try {
            await leadPageService.submitLead(slug, {
                name: formData.name,
                phone: formData.phone,
                email: formData.email
            });
            setSubmitted(true);
            toast.success('Cadastro realizado com sucesso!');
        } catch (error: any) {
            console.error('Error submitting form:', error);
            // Handle specific backend errors
            const errorMessage = error.response?.data?.error || error.message || 'Erro ao realizar cadastro.';

            if (errorMessage.includes('já está cadastrado')) {
                toast.error('Este WhatsApp já foi cadastrado para esta campanha.');
            } else if (errorMessage.includes('inválido')) {
                toast.error('Número de WhatsApp inválido. Verifique e tente novamente.');
            } else {
                toast.error(errorMessage);
            }
            generateCaptcha(); // Reset captcha on error
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600">Página não encontrada</p>
            </div>
        );
    }

    // Calculate generic text color based on background luminance could be complex, 
    // so for now we assume light background unless specified otherwise, but the user wanted customizable colors.
    // We'll trust the user's design choice or default to black text on white bg.

    const bgStyle: React.CSSProperties = {
        backgroundColor: page.backgroundColor || '#ffffff',
        backgroundImage: page.backgroundImageUrl ? `url(${page.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8"
            style={bgStyle}
        >
            <div className="max-w-md w-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden p-8 transition-all">
                {submitted ? (
                    <div className="text-center py-12">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h2>
                        <p className="text-gray-600">Seus dados foram recebidos com sucesso.</p>
                    </div>
                ) : (
                    <>
                        {/* Header / Logo */}
                        {/* If tenant has a logo or page has a specific image, we could show it here. For now, rely on headline. */}

                        <div className="text-center mb-8">
                            {page.headline && (
                                <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                                    {page.headline}
                                </h1>
                            )}
                            {page.description && (
                                <p className="text-gray-600 leading-relaxed">
                                    {page.description}
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                                    style={{ focusRing: page.primaryColor } as any} // Custom ring color handling via wrapper or trusted default
                                    placeholder="Seu nome"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                                    placeholder="(99) 99999-9999"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (Opcional)
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* Simple Math Captcha */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                                    Verificação de Segurança: <span className="font-bold text-lg ml-1">{captcha.num1} + {captcha.num2} = ?</span>
                                </label>
                                <input
                                    type="number"
                                    id="captcha"
                                    required
                                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all"
                                    placeholder="Digite o resultado"
                                    value={formData.captchaAnswer}
                                    onChange={(e) => setFormData({ ...formData, captchaAnswer: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    backgroundColor: page.primaryColor,
                                    borderColor: page.primaryColor,
                                    // Add a hover effect brightness filter if possible or just rely on CSS
                                }}
                            >
                                {submitting ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Cadastrar'
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Footer / Branding */}
            <div className="mt-8 text-gray-500 text-sm font-medium text-center bg-white/50 backdrop-blur-md px-4 py-2 rounded-full">
                Powered by {companyName || page.tenant?.name || 'Astra Campaign'}
            </div>
        </div>
    );
};
