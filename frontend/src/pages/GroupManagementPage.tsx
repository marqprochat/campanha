import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { groupService, WhatsappGroup, WhatsAppInstance, DynamicLink } from '../services/groupService';
import { EmojiPicker } from '../components/EmojiPicker';
import { LinkPreviewCard } from '../components/LinkPreviewCard';

export function GroupManagementPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'links' | 'broadcast'>('groups');
    const [groups, setGroups] = useState<WhatsappGroup[]>([]);
    const [dynamicLinks, setDynamicLinks] = useState<DynamicLink[]>([]);
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Group Form State
    const [newGroupName, setNewGroupName] = useState('');
    const [instanceName, setInstanceName] = useState(''); // Should select from available instances
    const [initialParticipants, setInitialParticipants] = useState(''); // Comma separated
    const [adminOnly, setAdminOnly] = useState(false);
    const [adminNumbers, setAdminNumbers] = useState(''); // Comma separated
    const [groupDescription, setGroupDescription] = useState('');

    // Broadcast State
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastStatus, setBroadcastStatus] = useState<any[]>([]);

    // Link Preview State
    const [linkPreview, setLinkPreview] = useState<{ url: string; title: string; description: string; image: string | null; siteName: string } | null>(null);
    const [linkPreviewLoading, setLinkPreviewLoading] = useState(false);
    const lastDetectedUrl = useRef<string>('');

    // Image Upload State
    const [uploadedImage, setUploadedImage] = useState<{ url: string; preview: string } | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchGroups();
        fetchDynamicLinks();
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

    const fetchDynamicLinks = async () => {
        try {
            const data = await groupService.listDynamicLinks();
            setDynamicLinks(data || []);
        } catch (error) {
            console.error('Failed to fetch dynamic links', error);
            setDynamicLinks([]);
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
        if (!newGroupName || !instanceName) return alert('Preencha os campos obrigatórios (Nome e Instância)');

        const participantsList = initialParticipants.split(',').map(p => p.trim()).filter(p => p);
        if (participantsList.length === 0) {
            return alert('É necessário adicionar pelo menos um participante para criar o grupo.');
        }

        const adminNumbersList = adminNumbers.split(',').map(p => p.trim()).filter(p => p);

        try {
            await groupService.createGroup({
                name: newGroupName,
                instanceName,
                initialParticipants: participantsList,
                adminOnly,
                adminNumbers: adminNumbersList.length > 0 ? adminNumbersList : undefined,
                description: groupDescription || undefined
            });
            alert('Grupo criado!');
            setIsCreateModalOpen(false);
            setNewGroupName('');
            setInitialParticipants('');
            setAdminOnly(false);
            setAdminNumbers('');
            setGroupDescription('');
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
            // Build message payload
            const imageUrl = uploadedImage?.url || (linkPreview?.image ?? null);
            const messagePayload: { text?: string; image?: { url: string }; caption?: string } = {};

            if (imageUrl) {
                messagePayload.image = { url: imageUrl };
                messagePayload.caption = broadcastMessage;
            } else {
                messagePayload.text = broadcastMessage;
            }

            const results = await groupService.broadcast({
                instanceName,
                groupIds: selectedGroups,
                message: messagePayload
            });
            setBroadcastStatus(results);
            setBroadcastMessage('');
            setLinkPreview(null);
            setUploadedImage(null);
            lastDetectedUrl.current = '';
            alert('Disparo concluído');
        } catch (error) {
            console.error(error);
            alert('Erro no disparo');
        }
    };

    const toggleGroupSelection = (id: string) => {
        setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    // ============================================================================
    // LINK DETECTION
    // ============================================================================
    const detectAndFetchLinkPreview = useCallback(async (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const urls = text.match(urlRegex);

        if (!urls || urls.length === 0) {
            if (linkPreview) {
                setLinkPreview(null);
                lastDetectedUrl.current = '';
            }
            return;
        }

        const firstUrl = urls[0];
        if (firstUrl === lastDetectedUrl.current) return; // Already fetched

        lastDetectedUrl.current = firstUrl;
        setLinkPreviewLoading(true);

        try {
            const preview = await groupService.fetchLinkPreview(firstUrl);
            setLinkPreview(preview);
        } catch {
            setLinkPreview(null);
        } finally {
            setLinkPreviewLoading(false);
        }
    }, [linkPreview]);

    // Debounced link detection on message change
    useEffect(() => {
        if (!broadcastMessage) {
            setLinkPreview(null);
            lastDetectedUrl.current = '';
            return;
        }
        const timer = setTimeout(() => {
            detectAndFetchLinkPreview(broadcastMessage);
        }, 800);
        return () => clearTimeout(timer);
    }, [broadcastMessage]);

    // ============================================================================
    // IMAGE UPLOAD
    // ============================================================================
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setImageUploading(true);

        try {
            const result = await groupService.uploadBroadcastImage(file);
            setUploadedImage({ url: result.url, preview: localPreview });
        } catch {
            alert('Erro ao fazer upload da imagem');
            URL.revokeObjectURL(localPreview);
        } finally {
            setImageUploading(false);
            // Reset file input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ============================================================================
    // EMOJI INSERT
    // ============================================================================
    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText = broadcastMessage.substring(0, start) + emoji + broadcastMessage.substring(end);
            setBroadcastMessage(newText);
            // Set cursor position after emoji
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            }, 0);
        } else {
            setBroadcastMessage(prev => prev + emoji);
        }
    };

    const handleDeleteDynamicLink = async (id: string) => {
        if (!confirm('Deseja excluir este link dinâmico?')) return;
        try {
            await groupService.deleteDynamicLink(id);
            fetchDynamicLinks();
            alert('Link excluído!');
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir link');
        }
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
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Participantes Iniciais (obrigatório para o 1º grupo)</label>
                                    <input
                                        type="text"
                                        id="dl-participants"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                        placeholder="5511999999999, 5511888888888"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Adicione pelo menos um número para criar o primeiro grupo imediatamente.</p>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="dl-adminOnly"
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Apenas administradores podem enviar mensagens</span>
                                    </label>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Números dos Administradores (opcional)</label>
                                    <input
                                        type="text"
                                        id="dl-adminNumbers"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                        placeholder="5511999999999, 5511888888888"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Estes números serão promovidos a admin em cada grupo criado pelo link.</p>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Descrição do Grupo (opcional)</label>
                                    <textarea
                                        id="dl-description"
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                        placeholder="Descrição que será aplicada aos grupos criados por este link"
                                    />
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
                                        const participantsStr = (document.getElementById('dl-participants') as HTMLInputElement).value;

                                        if (!slug || !name || !baseGroupName || !instanceName) return alert('Preencha os campos obrigatórios (Slug, Nome, Base, Instância)');

                                        const initialParticipants = participantsStr.split(',').map(p => p.trim()).filter(p => p);
                                        if (initialParticipants.length === 0) {
                                            return alert('É necessário adicionar pelo menos um participante inicial para criar o primeiro grupo (exigência do WhatsApp).');
                                        }

                                        const dlAdminOnly = (document.getElementById('dl-adminOnly') as HTMLInputElement).checked;
                                        const dlAdminNumbersStr = (document.getElementById('dl-adminNumbers') as HTMLInputElement).value;
                                        const dlAdminNumbers = dlAdminNumbersStr.split(',').map(p => p.trim()).filter(p => p);
                                        const dlDescription = (document.getElementById('dl-description') as HTMLTextAreaElement).value;

                                        try {
                                            await groupService.createDynamicLink({
                                                slug, name, baseGroupName, groupCapacity: capacity, instanceName, initialParticipants,
                                                adminOnly: dlAdminOnly,
                                                adminNumbers: dlAdminNumbers.length > 0 ? dlAdminNumbers : undefined,
                                                description: dlDescription || undefined
                                            });
                                            alert(`Link criado: /invite/${slug}`);
                                            // Reset fields
                                            (document.getElementById('dl-slug') as HTMLInputElement).value = '';
                                            (document.getElementById('dl-name') as HTMLInputElement).value = '';
                                            (document.getElementById('dl-baseName') as HTMLInputElement).value = '';
                                            (document.getElementById('dl-participants') as HTMLInputElement).value = '';
                                            (document.getElementById('dl-adminOnly') as HTMLInputElement).checked = false;
                                            (document.getElementById('dl-adminNumbers') as HTMLInputElement).value = '';
                                            (document.getElementById('dl-description') as HTMLTextAreaElement).value = '';
                                            fetchDynamicLinks();
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

                        {/* Dynamic Links List */}
                        <div className="bg-white p-6 rounded-lg shadow mt-6">
                            <h3 className="text-lg font-medium mb-4">Links Ativos</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Compartilhável</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo Atual</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidade</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dynamicLinks.map(link => (
                                            <tr key={link.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{link.name}</div>
                                                    <div className="text-xs text-gray-500">/{link.slug}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-blue-600 truncate max-w-xs">{groupService.getInviteLinkUrl(link.slug)}</span>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(groupService.getInviteLinkUrl(link.slug));
                                                                alert('Link copiado!');
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded"
                                                            title="Copiar link"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">{link.activeGroup?.name || 'Inexistente'}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">{link.activeGroup?.currentParticipants || 0}/{link.groupCapacity}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDeleteDynamicLink(link.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {dynamicLinks.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum link dinâmico criado ainda.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
                                <div className="relative">
                                    <textarea
                                        ref={textareaRef}
                                        value={broadcastMessage}
                                        onChange={e => setBroadcastMessage(e.target.value)}
                                        rows={5}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 pb-10 border"
                                        placeholder="Digite sua mensagem de broadcast aqui..."
                                    />

                                    {/* Toolbar */}
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                                        {/* Emoji Button */}
                                        <EmojiPicker onEmojiSelect={handleEmojiSelect} />

                                        {/* Image Upload Button */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            title="Anexar imagem"
                                            disabled={imageUploading}
                                        >
                                            {imageUploading ? (
                                                <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </div>

                                {/* Link Preview Loading */}
                                {linkPreviewLoading && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Carregando preview do link...
                                    </div>
                                )}

                                {/* Link Preview Card */}
                                {linkPreview && !linkPreviewLoading && (
                                    <LinkPreviewCard
                                        title={linkPreview.title}
                                        description={linkPreview.description}
                                        image={linkPreview.image}
                                        url={linkPreview.url}
                                        siteName={linkPreview.siteName}
                                        onRemove={() => {
                                            setLinkPreview(null);
                                            lastDetectedUrl.current = '';
                                        }}
                                    />
                                )}

                                {/* Uploaded Image Preview */}
                                {uploadedImage && (
                                    <div className="relative inline-block">
                                        <img
                                            src={uploadedImage.preview}
                                            alt="Preview"
                                            className="max-h-40 rounded-lg border border-gray-200 shadow-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                URL.revokeObjectURL(uploadedImage.preview);
                                                setUploadedImage(null);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                                            title="Remover imagem"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleBroadcast}
                                    disabled={!instanceName || selectedGroups.length === 0 || !broadcastMessage}
                                    className="w-full btn-primary bg-green-600 text-white py-2 rounded disabled:opacity-50 hover:bg-green-700 transition-colors"
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
                                <label className="block text-sm font-medium text-gray-700">Participantes Iniciais (obrigatório)</label>
                                <input
                                    type="text"
                                    value={initialParticipants}
                                    onChange={e => setInitialParticipants(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    placeholder="5511999999999, 5511888888888"
                                />
                                <p className="text-xs text-gray-500 mt-1">Adicione pelo menos um número para criar o grupo (exigência do WhatsApp)</p>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={adminOnly}
                                        onChange={e => setAdminOnly(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Apenas administradores podem enviar mensagens</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Números dos Administradores (opcional)</label>
                                <input
                                    type="text"
                                    value={adminNumbers}
                                    onChange={e => setAdminNumbers(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    placeholder="5511999999999, 5511888888888"
                                />
                                <p className="text-xs text-gray-500 mt-1">Estes números serão promovidos a admin no grupo. Devem ser participantes do grupo.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descrição do Grupo (opcional)</label>
                                <textarea
                                    value={groupDescription}
                                    onChange={e => setGroupDescription(e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    placeholder="Descrição que será exibida no grupo do WhatsApp"
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
