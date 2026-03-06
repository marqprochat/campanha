import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import { planService, Plan, Subscription } from '../services/planService';

export function SubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

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

    const handleSubscribe = async (plan: Plan) => {
        try {
            toast.loading('Redirecionando para o pagamento...');
            const { url } = await planService.createCheckoutSession(plan.id);
            window.location.href = url;
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || 'Erro ao iniciar pagamento');
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
                                    onClick={() => handleSubscribe(plan)}
                                    className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                    {subscription ? 'Mudar para Plano' : 'Assinar'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
