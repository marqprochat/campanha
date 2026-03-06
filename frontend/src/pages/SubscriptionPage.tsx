import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import { planService, Plan, Subscription } from '../services/planService';

export function SubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
    const [showCpfModal, setShowCpfModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [plansData, subData] = await Promise.all([
                planService.listPlans(),
                planService.getCurrentSubscription()
            ]);
            setPlans(plansData);
            setSubscription(subData);
        } catch (err: any) {
            toast.error('Erro ao carregar dados de assinatura');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribeClick = (plan: Plan) => {
        setSelectedPlan(plan);
        setShowCpfModal(true);
    };

    const handleConfirmSubscription = async () => {
        if (!selectedPlan) return;

        const cleaned = cpfCnpj.replace(/[.\-\/\s]/g, '');
        if (!cleaned || (cleaned.length !== 11 && cleaned.length !== 14)) {
            toast.error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
            return;
        }

        try {
            setSubscribingPlanId(selectedPlan.id);
            toast.loading('Criando assinatura e gerando pagamento...');
            const { url } = await planService.createCheckoutSession(selectedPlan.id, cleaned);
            toast.dismiss();
            setShowCpfModal(false);
            window.open(url, '_blank');
            toast.success('Link de pagamento aberto em nova aba!');
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || 'Erro ao iniciar pagamento');
        } finally {
            setSubscribingPlanId(null);
        }
    };

    // Format CPF/CNPJ as user types
    const formatCpfCnpj = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 11) {
            // CPF: 000.000.000-00
            return digits
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // CNPJ: 00.000.000/0000-00
            return digits
                .substring(0, 14)
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
    };

    if (loading) return <div className="p-6">Carregando...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Minha Assinatura</h1>

            {subscription && (
                <div className="bg-white rounded-xl shadow p-6 mb-8 border-l-4 border-blue-500">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Plano Atual: {subscription.plan.name}</h2>
                        <p className="text-gray-500 mt-1">Status: <span className="font-medium capitalize">{subscription.status}</span></p>
                        {subscription.currentPeriodEnd && (
                            <p className="text-sm text-gray-400 mt-1">Renova em: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold mb-6 text-center">Planos Disponíveis</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className={`bg-white rounded-xl shadow border flex flex-col ${subscription?.planId === plan.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'}`}>
                        <div className="p-6 flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                            <div className="mb-4">
                                <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                                <span className="text-gray-500">/{plan.interval === 'year' ? 'ano' : 'mês'}</span>
                            </div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={18} className="text-green-500" /> Até {plan.maxUsers} Usuários</li>
                                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={18} className="text-green-500" /> Até {plan.maxConnections} Conexões WhatsApp</li>
                                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={18} className="text-green-500" /> Até {plan.maxContacts} Leads</li>
                                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={18} className="text-green-500" /> Até {plan.maxCampaigns} Campanhas Ativas</li>
                                <li className="flex items-center gap-2 text-gray-600"><CheckCircle size={18} className="text-green-500" /> Até {plan.maxGroups} Grupos</li>
                            </ul>
                        </div>
                        <div className="p-6 pt-0 mt-auto">
                            {subscription?.planId === plan.id ? (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
                                >
                                    Plano Atual
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubscribeClick(plan)}
                                    disabled={subscribingPlanId === plan.id}
                                    className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {subscribingPlanId === plan.id ? 'Processando...' : subscription ? 'Mudar para Plano' : 'Assinar'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* CPF/CNPJ Modal */}
            {showCpfModal && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Dados para Cobrança</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Informe seu CPF ou CNPJ para gerar a cobrança do plano <strong>{selectedPlan.name}</strong>.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou CNPJ *</label>
                            <input
                                type="text"
                                value={cpfCnpj}
                                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                placeholder="000.000.000-00"
                                maxLength={18}
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">CPF (pessoa física) ou CNPJ (pessoa jurídica)</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCpfModal(false); setSelectedPlan(null); }}
                                className="flex-1 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSubscription}
                                disabled={!!subscribingPlanId}
                                className="flex-1 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {subscribingPlanId ? 'Processando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
