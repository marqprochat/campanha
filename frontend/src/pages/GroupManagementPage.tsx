import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { groupService, WhatsappGroup, WhatsAppInstance } from '../services/groupService';

export function GroupManagementPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'links' | 'broadcast'>('groups');
    const [groups, setGroups] = useState<WhatsappGroup[]>([]);
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Group Form State
    const [newGroupName, setNewGroupName] = useState('');
    const [instanceName, setInstanceName] = useState(''); // Should select from available instances
    const [initialParticipants, setInitialParticipants] = useState(''); // Comma separated

    // Broadcast State
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastStatus, setBroadcastStatus] = useState<any[]>([]);

    useEffect(() => {
        fetchGroups();
        fetchInstances();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await groupService.listGroups();
            setGroups(data || []);
        } catch (error) {
            console.error('Failed to fetch groups', error);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchInstances = async () => {
        try {
            const data = await groupService.listInstances();
            setInstances(data || []);
            // Auto-select first working instance if none selected
            if (!instanceName && data && data.length > 0) {
                const firstWorking = data.find(i => i.status === 'WORKING');
                if (firstWorking) {
                    setInstanceName(firstWorking.name);
                }
            }
        } catch (error) {
            console.error('Failed to fetch instances', error);
            // Non-blocking error
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName || !instanceName) return alert('Preencha os campos obrigatórios');
        try {
            await groupService.createGroup({
                name: newGroupName,
                instanceName,
                initialParticipants: initialParticipants.split(',').map(p => p.trim()).filter(p => p)
            });
            alert('Grupo criado!');
            setIsCreateModalOpen(false);
            setNewGroupName('');
            setInitialParticipants('');
            fetchGroups();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar grupo');
        }
    };

    const handleBroadcast = async () => {
        if (selectedGroups.length === 0 || !broadcastMessage) return;
        if (!instanceName) return alert('Defina a instância');

        try {
            const results = await groupService.broadcast({
                instanceName,
                groupIds: selectedGroups,
                message: { text: broadcastMessage }
            });
            setBroadcastStatus(results);
            alert('Disparo concluído');
        } catch (error) {
            console.error(error);
            alert('Erro no disparo');
        }
    };

    const toggleGroupSelection = (id: string) => {
        setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const connectedInstances = instances.filter(i => i.status === 'WORKING');

    return (
        <>
            <Header
                title="Gerenciamento de Grupos"
                subtitle="Crie grupos, gerencie convites e faça disparos em massa."
            />

            <div className="p-6">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                        Grupos
                    </button>
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'links' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Links Dinâmicos
                    </button>
                    <button
                        onClick={() => setActiveTab('broadcast')}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'broadcast' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Disparos
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'groups' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Grupos Ativos</h2>
                            <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Novo Grupo
                            </button>
                        </div>

                        {loading ? <p>Carregando...</p> : (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instância</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(groups || []).map(group => (
                                            <tr key={group.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">{group.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{group.currentParticipants}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {group.inviteLink ? (
                                                        <a href={group.inviteLink} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                                                            Link <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.instanceName}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium mb-4">Criar Novo Link Dinâmico</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Slug (URL)</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                            /invite/
                                        </span>
                                        <input
                                            type="text"
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="vip-customers"
                                            id="dl-slug"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Interno</label>
                                    <input type="text" id="dl-name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" placeholder="Campanha VIP" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Base dos Grupos</label>
                                    <input type="text" id="dl-baseName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" placeholder="VIP Group" />
                                    <p className="mt-1 text-xs text-gray-500">Os grupos serão criados como: VIP Group 1, VIP Group 2...</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Capacidade por Grupo</label>
                                    <input type="number" id="dl-capacity" defaultValue={1000} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Instância Evolution</label>
                                <select
                                    id="dl-instance"
                                    value={instanceName}
                                    onChange={e => setInstanceName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                >
                                    <option value="">Selecione uma instância...</option>
                                    {connectedInstances.map(instance => (
                                        <option key={instance.name} value={instance.name}>
                                            {instance.displayName || instance.name}
                                        </option>
                                    ))}
                                </select>
                                {connectedInstances.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">Nenhuma instância conectada encontrada.</p>
                                )}
                            </div>
                            <div className="mt-6">
                                <button
                                    onClick={async () => {
                                        const slug = (document.getElementById('dl-slug') as HTMLInputElement).value;
                                        const name = (document.getElementById('dl-name') as HTMLInputElement).value;
                                        const baseGroupName = (document.getElementById('dl-baseName') as HTMLInputElement).value;
                                        const capacity = parseInt((document.getElementById('dl-capacity') as HTMLInputElement).value);

                                        if (!slug || !name || !baseGroupName || !instanceName) return alert('Preencha os campos obrigatórios (Slug, Nome, Base, Instância)');

                                        try {
                                            await groupService.createDynamicLink({
                                                slug, name, baseGroupName, groupCapacity: capacity, instanceName
                                            });
                                            alert(`Link criado: /invite/${slug}`);
                                        } catch (e) {
                                            console.error(e);
                                            alert('Erro ao criar link');
                                        }
                                    }}
                                    className="btn-primary bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                                >
                                    Criar Link
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Instância para Disparo</label>
                            <select
                                value={instanceName}
                                onChange={e => setInstanceName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="">Selecione uma instância...</option>
                                {connectedInstances.map(instance => (
                                    <option key={instance.name} value={instance.name}>
                                        {instance.displayName || instance.name}
                                    </option>
                                ))}
                            </select>
                            {connectedInstances.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Nenhuma instância conectada encontrada.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded shadow">
                                <h3 className="font-medium mb-3">Selecione os Grupos</h3>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {(groups || []).map(group => (
                                        <label key={group.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.includes(group.id)}
                                                onChange={() => toggleGroupSelection(group.id)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{group.name}</span>
                                            <span className="text-xs text-gray-400">({group.currentParticipants})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded shadow space-y-4">
                                <h3 className="font-medium">Mensagem</h3>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={e => setBroadcastMessage(e.target.value)}
                                    rows={5}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    placeholder="Digite sua mensagem de broadcast aqui..."
                                />
                                <button
                                    onClick={handleBroadcast}
                                    disabled={!instanceName || selectedGroups.length === 0 || !broadcastMessage}
                                    className="w-full btn-primary bg-green-600 text-white py-2 rounded disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    Enviar para {selectedGroups.length} grupos
                                </button>
                            </div>
                        </div>

                        {broadcastStatus.length > 0 && (
                            <div className="bg-white p-4 rounded shadow mt-6">
                                <h3 className="font-medium mb-2">Resultado do Disparo</h3>
                                <div className="max-h-40 overflow-y-auto">
                                    {broadcastStatus.map((res, i) => (
                                        <div key={i} className={`text-sm ${res.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            {res.jid}: {res.status} {res.error && `(${res.error})`}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Criar Novo Grupo</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome do Grupo</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Instância Evolution</label>
                                <select
                                    value={instanceName}
                                    onChange={e => setInstanceName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                >
                                    <option value="">Selecione uma instância...</option>
                                    {connectedInstances.map(instance => (
                                        <option key={instance.name} value={instance.name}>
                                            {instance.displayName || instance.name}
                                        </option>
                                    ))}
                                </select>
                                {connectedInstances.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">Nenhuma instância conectada encontrada.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Participantes Iniciais (opcional)</label>
                                <input
                                    type="text"
                                    value={initialParticipants}
                                    onChange={e => setInitialParticipants(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    placeholder="5511999999999, 5511888888888"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button onClick={handleCreateGroup} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Criar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
