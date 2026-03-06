import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Check, X } from 'lucide-react';
import { planService, Plan } from '../../services/planService';

export function PlanManagementPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Plan>>({});

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = await planService.listPlans();
            setPlans(data);
        } catch (err: any) {
            toast.error(err.message || 'Erro ao carregar planos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            if (!editForm.name || !editForm.price) {
                toast.error('Nome e preço são obrigatórios');
                return;
            }
            await planService.createPlan({
                ...editForm,
                maxUsers: editForm.maxUsers || 1,
                maxContacts: editForm.maxContacts || 100,
                maxCampaigns: editForm.maxCampaigns || 5,
                maxConnections: editForm.maxConnections || 1,
                maxGroups: editForm.maxGroups || 0,
                interval: editForm.interval || 'month'
            });
            toast.success('Plano criado');
            setEditForm({});
            setIsEditing(null);
            loadPlans();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao criar plano');
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            await planService.updatePlan(id, editForm);
            toast.success('Plano atualizado');
            setEditForm({});
            setIsEditing(null);
            loadPlans();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao atualizar plano');
        }
    };

    const startEdit = (plan: Plan | null) => {
        if (plan) {
            setEditForm(plan);
            setIsEditing(plan.id);
        } else {
            setEditForm({});
            setIsEditing('new');
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestão de Planos</h1>
                <button
                    onClick={() => startEdit(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Novo Plano
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 font-medium text-sm text-gray-500">Nome</th>
                            <th className="p-4 font-medium text-sm text-gray-500">Preço</th>
                            <th className="p-4 font-medium text-sm text-gray-500">Limites</th>
                            <th className="p-4 font-medium text-sm text-gray-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isEditing === 'new' && (
                            <tr className="bg-blue-50">
                                <td className="p-4" colSpan={4}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="Nome" className="px-3 py-2 border rounded" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                        <input type="number" placeholder="Preço" className="px-3 py-2 border rounded" value={editForm.price || ''} onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })} />
                                        <input type="number" placeholder="Max Usuários" className="px-3 py-2 border rounded" value={editForm.maxUsers || ''} onChange={e => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) })} />
                                        <input type="number" placeholder="Max Contatos" className="px-3 py-2 border rounded" value={editForm.maxContacts || ''} onChange={e => setEditForm({ ...editForm, maxContacts: parseInt(e.target.value) })} />
                                        <input type="number" placeholder="Max Campanhas" className="px-3 py-2 border rounded" value={editForm.maxCampaigns || ''} onChange={e => setEditForm({ ...editForm, maxCampaigns: parseInt(e.target.value) })} />
                                        <input type="number" placeholder="Max Conexões" className="px-3 py-2 border rounded" value={editForm.maxConnections || ''} onChange={e => setEditForm({ ...editForm, maxConnections: parseInt(e.target.value) })} />
                                        <input type="number" placeholder="Max Grupos" className="px-3 py-2 border rounded" value={editForm.maxGroups || ''} onChange={e => setEditForm({ ...editForm, maxGroups: parseInt(e.target.value) })} />
                                        <select className="px-3 py-2 border rounded" value={editForm.interval || 'month'} onChange={e => setEditForm({ ...editForm, interval: e.target.value })}>
                                            <option value="month">Mensal</option>
                                            <option value="year">Anual</option>
                                        </select>
                                        <div className="col-span-2 flex gap-2 justify-end">
                                            <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 rounded border">Cancelar</button>
                                            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {plans.map(plan => (
                            isEditing === plan.id ? (
                                <tr key={plan.id} className="bg-blue-50">
                                    <td className="p-4" colSpan={4}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="Nome" className="px-3 py-2 border rounded" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                            <input type="number" placeholder="Preço" className="px-3 py-2 border rounded" value={editForm.price || ''} onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })} />
                                            <input type="number" placeholder="Max Usuários" className="px-3 py-2 border rounded" value={editForm.maxUsers || ''} onChange={e => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) })} />
                                            <input type="number" placeholder="Max Contatos" className="px-3 py-2 border rounded" value={editForm.maxContacts || ''} onChange={e => setEditForm({ ...editForm, maxContacts: parseInt(e.target.value) })} />
                                            <input type="number" placeholder="Max Campanhas" className="px-3 py-2 border rounded" value={editForm.maxCampaigns || ''} onChange={e => setEditForm({ ...editForm, maxCampaigns: parseInt(e.target.value) })} />
                                            <input type="number" placeholder="Max Conexões" className="px-3 py-2 border rounded" value={editForm.maxConnections || ''} onChange={e => setEditForm({ ...editForm, maxConnections: parseInt(e.target.value) })} />
                                            <input type="number" placeholder="Max Grupos" className="px-3 py-2 border rounded" value={editForm.maxGroups || ''} onChange={e => setEditForm({ ...editForm, maxGroups: parseInt(e.target.value) })} />
                                            <select className="px-3 py-2 border rounded" value={editForm.interval || 'month'} onChange={e => setEditForm({ ...editForm, interval: e.target.value })}>
                                                <option value="month">Mensal</option>
                                                <option value="year">Anual</option>
                                            </select>
                                            <div className="col-span-2 flex justify-end gap-2">
                                                <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 rounded border">Cancelar</button>
                                                <button onClick={() => handleUpdate(plan.id)} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium">{plan.name}</td>
                                    <td className="p-4">R$ {plan.price} / {plan.interval === 'year' ? 'ano' : 'mês'}</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div>User: {plan.maxUsers}</div>
                                        <div>Ctt: {plan.maxContacts}</div>
                                        <div>Cmp: {plan.maxCampaigns}</div>
                                        <div>Wpp: {plan.maxConnections}</div>
                                        <div>Grp: {plan.maxGroups}</div>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => startEdit(plan)} className="p-1 hover:text-blue-600 rounded">
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        ))}
                        {plans.length === 0 && isEditing !== 'new' && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    Nenhum plano cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
