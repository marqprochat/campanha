import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { groupService, WhatsappGroup, WhatsAppInstance, DynamicLink, GroupCampaign } from '../services/groupService';
import { groupCategoryService, GroupCategory } from '../services/groupCategoryService';
import { EmojiPicker } from '../components/EmojiPicker';
import { LinkPreviewCard } from '../components/LinkPreviewCard';

export function GroupManagementPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'links' | 'broadcast' | 'categories' | 'scheduled'>('groups');
    const [groups, setGroups] = useState<WhatsappGroup[]>([]);
    const [dynamicLinks, setDynamicLinks] = useState<DynamicLink[]>([]);
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [categories, setCategories] = useState<GroupCategory[]>([]);
    const [scheduledCampaigns, setScheduledCampaigns] = useState<GroupCampaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Group Form State
    const [newGroupName, setNewGroupName] = useState('');
    const [instanceName, setInstanceName] = useState(''); // Should select from available instances
    const [initialParticipants, setInitialParticipants] = useState(''); // Comma separated
    const [adminOnly, setAdminOnly] = useState(false);
    const [adminNumbers, setAdminNumbers] = useState(''); // Comma separated
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [groupImageUrl, setGroupImageUrl] = useState('');
    const [isUploadingGroupImage, setIsUploadingGroupImage] = useState(false);
    const groupImageInputRef = useRef<HTMLInputElement>(null);

    // Dynamic Link Image State
    const [dynamicLinkImage, setDynamicLinkImage] = useState('');
    const [isUploadingLinkImage, setIsUploadingLinkImage] = useState(false);
    const linkImageInputRef = useRef<HTMLInputElement>(null);

    // Category Management State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<GroupCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', color: '#000000', description: '' });

    // Group Assignment State
    const [assigningGroup, setAssigningGroup] = useState<WhatsappGroup | null>(null);

    // Delete Mode State
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [deleteSelectedGroups, setDeleteSelectedGroups] = useState<string[]>([]);
    const [isDeletingGroups, setIsDeletingGroups] = useState(false);

    // Category Filter State
    const [filterCategory, setFilterCategory] = useState('');

    // Broadcast State
    const [broadcastTarget, setBroadcastTarget] = useState<'groups' | 'category'>('groups');
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [broadcastCategory, setBroadcastCategory] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastName, setBroadcastName] = useState(''); // Used for scheduled campaigns
    const [broadcastSchedule, setBroadcastSchedule] = useState(''); // ISO datetime-local
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

    // Progress Modal State
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [progressSteps, setProgressSteps] = useState<string[]>([]);
    const [progressCurrentStep, setProgressCurrentStep] = useState<string>('');
    const [progressError, setProgressError] = useState<string>('');

    useEffect(() => {
        fetchGroups();
        fetchDynamicLinks();
        fetchInstances();
        fetchCategories();
        fetchScheduledCampaigns();
    }, []);

    const fetchScheduledCampaigns = async () => {
        try {
            const data = await groupService.listScheduledBroadcasts();
            setScheduledCampaigns(data || []);
        } catch (error) {
            console.error('Failed to fetch scheduled campaigns', error);
        }
    };

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
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await groupCategoryService.listCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName || !instanceName) return alert('Preencha os campos obrigatórios (Nome e Instância)');

        const participantsList = initialParticipants.split(',').map(p => p.trim()).filter(p => p);
        if (participantsList.length === 0) {
            return alert('É necessário adicionar pelo menos um participante para criar o grupo.');
        }

        const adminNumbersList = adminNumbers.split(',').map(p => p.trim()).filter(p => p);

        // Reset progress state and open modal
        setProgressSteps([]);
        setProgressCurrentStep('Iniciando...');
        setProgressError('');
        setIsProgressModalOpen(true);
        setIsCreateModalOpen(false); // Close the form modal

        try {
            await groupService.createGroupStreaming({
                name: newGroupName,
                instanceName,
                initialParticipants: participantsList,
                adminOnly,
                adminNumbers: adminNumbersList.length > 0 ? adminNumbersList : undefined,
                description: groupDescription || undefined,
                categoryId: selectedCategoryId || undefined,
                imageUrl: groupImageUrl || undefined
            }, (message) => {
                if (message.type === 'progress') {
                    setProgressCurrentStep(message.step);
                    setProgressSteps(prev => {
                        // Keep track of previous steps
                        if (prev.includes(message.step)) return prev;
                        return [...prev, message.step];
                    });
                } else if (message.type === 'success') {
                    setTimeout(() => {
                        setIsProgressModalOpen(false);
                        alert('Grupo criado!');
                        setNewGroupName('');
                        setInitialParticipants('');
                        setAdminOnly(false);
                        setAdminNumbers('');
                        setGroupDescription('');
                        setSelectedCategoryId('');
                        setGroupImageUrl('');
                        fetchGroups();
                    }, 1500); // Give user a moment to see completion
                } else if (message.type === 'error') {
                    setProgressError(message.error);
                }
            });
        } catch (error: any) {
            console.error(error);
            setProgressError(error.message || 'Erro ao criar grupo');
        }
    };

    // Category Handlers
    const handleSaveCategory = async () => {
        if (!categoryForm.name) return alert('Nome é obrigatório');

        try {
            if (editingCategory) {
                await groupCategoryService.updateCategory(editingCategory.id, categoryForm);
                alert('Categoria atualizada!');
            } else {
                await groupCategoryService.createCategory(categoryForm);
                alert('Categoria criada!');
            }
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
            setCategoryForm({ name: '', color: '#000000', description: '' });
            fetchCategories();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar categoria');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Deseja excluir esta categoria? Os grupos perderão a associação.')) return;
        try {
            await groupCategoryService.deleteCategory(id);
            fetchCategories();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir categoria');
        }
    };

    const openCategoryModal = (category?: GroupCategory) => {
        if (category) {
            setEditingCategory(category);
            setCategoryForm({ name: category.name, color: category.color, description: category.description || '' });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: '', color: '#000000', description: '' });
        }
        setIsCategoryModalOpen(true);
    };

    const handleAssignCategory = async (group: WhatsappGroup, categoryId: string) => {
        try {
            await groupService.updateGroup(group.id, { categoryId });
            fetchGroups(); // Refresh list to update UI
            fetchCategories(); // Refresh category counts
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar categoria do grupo');
        }
    };

    // Batch Delete Handlers
    const toggleDeleteGroupSelection = (id: string) => {
        setDeleteSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const handleDeleteSelectedGroups = async () => {
        if (deleteSelectedGroups.length === 0) return;
        if (!confirm(`Deseja excluir ${deleteSelectedGroups.length} grupo(s)? Esta ação não pode ser desfeita.`)) return;

        setIsDeletingGroups(true);
        try {
            const result = await groupService.deleteGroupsBatch(deleteSelectedGroups);
            alert(`${result.deleted} grupo(s) excluído(s) com sucesso!`);
            setDeleteSelectedGroups([]);
            setIsDeleteMode(false);
            fetchGroups();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir grupos');
        } finally {
            setIsDeletingGroups(false);
        }
    };

    const filteredGroups = filterCategory
        ? groups.filter(g => g.categoryId === filterCategory)
        : groups;

    // Broadcast Handlers
    const handleBroadcast = async () => {
        if (!broadcastMessage) return;
        if (!instanceName) return alert('Defina a instância');

        if (broadcastTarget === 'groups' && selectedGroups.length === 0) return alert('Selecione pelo menos um grupo');
        if (broadcastTarget === 'category' && !broadcastCategory) return alert('Selecione uma categoria');

        try {
            // Build message payload
            const imageUrl = uploadedImage?.url || (linkPreview?.image ?? null);
            const messagePayload: any = {};
            let messageType = 'text';

            if (imageUrl) {
                messagePayload.url = imageUrl;
                messagePayload.caption = broadcastMessage;
                // Basic assumption: images for now, could support video later depending on file
                messageType = 'image';
            } else {
                messagePayload.text = broadcastMessage;
            }

            if (broadcastSchedule) {
                if (!broadcastName) return alert('Dê um nome ao seu agendamento');

                await groupService.scheduleBroadcast({
                    name: broadcastName,
                    targetType: broadcastTarget === 'groups' ? 'GROUPS' : 'CATEGORY',
                    targetIds: broadcastTarget === 'groups' ? selectedGroups : [broadcastCategory],
                    messageType,
                    messageContent: messagePayload,
                    instanceName,
                    scheduledFor: new Date(broadcastSchedule).toISOString()
                });

                alert('Disparo agendado com sucesso!');
                setBroadcastName('');
                setBroadcastSchedule('');
                setActiveTab('scheduled');
                fetchScheduledCampaigns();
            } else {
                let results;
                const formattedPayload = imageUrl ? { image: { url: messagePayload.url }, caption: messagePayload.caption } : { text: messagePayload.text };

                if (broadcastTarget === 'groups') {
                    results = await groupService.broadcast({
                        instanceName,
                        groupIds: selectedGroups,
                        message: formattedPayload
                    });
                } else {
                    results = await groupService.broadcastToCategory({
                        instanceName,
                        categoryId: broadcastCategory,
                        message: formattedPayload
                    });
                }

                setBroadcastStatus(results);
                alert('Disparo imediato concluído');
            }

            setBroadcastMessage('');
            setLinkPreview(null);
            setUploadedImage(null);
            lastDetectedUrl.current = '';
        } catch (error) {
            console.error(error);
            alert('Erro no processo de disparo');
        }
    };

    const toggleGroupSelection = (id: string) => {
        setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    // Link Detection & Image Upload (Keeping existing logic)
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
        if (firstUrl === lastDetectedUrl.current) return;

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleGroupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingGroupImage(true);
        try {
            const { imageUrl } = await groupService.uploadGroupImage(file);
            setGroupImageUrl(imageUrl);
        } catch (error) {
            console.error(error);
            alert('Erro ao fazer upload da imagem do grupo');
        } finally {
            setIsUploadingGroupImage(false);
        }
    };

    const handleLinkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLinkImage(true);
        try {
            const { imageUrl } = await groupService.uploadGroupImage(file);
            setDynamicLinkImage(imageUrl);
        } catch (error) {
            console.error(error);
            alert('Erro ao fazer upload da imagem do link');
        } finally {
            setIsUploadingLinkImage(false);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText = broadcastMessage.substring(0, start) + emoji + broadcastMessage.substring(end);
            setBroadcastMessage(newText);
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

    const handleCancelCampaign = async (id: string) => {
        if (!confirm('Deseja realmente cancelar este agendamento?')) return;
        try {
            await groupService.cancelScheduledBroadcast(id);
            alert('Agendamento cancelado com sucesso!');
            fetchScheduledCampaigns();
        } catch (error) {
            console.error(error);
            alert('Erro ao cancelar agendamento');
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
                <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                    <button
                        onClick={() => { setActiveTab('groups'); fetchGroups(); fetchCategories(); }}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                        Grupos
                    </button>
                    <button
                        onClick={() => { setActiveTab('categories'); fetchCategories(); }}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        Categorias
                    </button>
                    <button
                        onClick={() => { setActiveTab('links'); fetchDynamicLinks(); }}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'links' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Links Dinâmicos
                    </button>
                    <button
                        onClick={() => { setActiveTab('broadcast'); fetchGroups(); fetchCategories(); }}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'broadcast' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Disparos
                    </button>
                    <button
                        onClick={() => { setActiveTab('scheduled'); fetchScheduledCampaigns(); }}
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'scheduled' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Agendamentos
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'groups' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Grupos Ativos</h2>
                            <div className="flex items-center gap-2">
                                {!isDeleteMode ? (
                                    <>
                                        <button onClick={() => { setIsDeleteMode(true); setDeleteSelectedGroups([]); }} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 text-sm">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Excluir Grupos
                                        </button>
                                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            Novo Grupo
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                const allFilteredIds = filteredGroups.map(g => g.id);
                                                if (deleteSelectedGroups.length === allFilteredIds.length) {
                                                    setDeleteSelectedGroups([]);
                                                } else {
                                                    setDeleteSelectedGroups(allFilteredIds);
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm"
                                        >
                                            {deleteSelectedGroups.length === filteredGroups.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                        </button>
                                        <span className="text-sm text-gray-600">{deleteSelectedGroups.length} selecionado(s)</span>
                                        <button
                                            onClick={handleDeleteSelectedGroups}
                                            disabled={deleteSelectedGroups.length === 0 || isDeletingGroups}
                                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            {isDeletingGroups ? 'Excluindo...' : 'Excluir Selecionados'}
                                        </button>
                                        <button onClick={() => { setIsDeleteMode(false); setDeleteSelectedGroups([]); }} className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500 text-sm">
                                            Cancelar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-600">Filtrar por Categoria:</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            >
                                <option value="">Todas</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {filterCategory && (
                                <button onClick={() => setFilterCategory('')} className="text-xs text-blue-600 hover:underline">Limpar filtro</button>
                            )}
                        </div>

                        {loading ? <p>Carregando...</p> : (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {isDeleteMode && (
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={filteredGroups.length > 0 && deleteSelectedGroups.length === filteredGroups.length}
                                                        onChange={() => {
                                                            const allFilteredIds = filteredGroups.map(g => g.id);
                                                            if (deleteSelectedGroups.length === allFilteredIds.length) {
                                                                setDeleteSelectedGroups([]);
                                                            } else {
                                                                setDeleteSelectedGroups(allFilteredIds);
                                                            }
                                                        }}
                                                        className="rounded text-red-600"
                                                    />
                                                </th>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instância</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(filteredGroups || []).map(group => (
                                            <tr key={group.id} className={isDeleteMode && deleteSelectedGroups.includes(group.id) ? 'bg-red-50' : ''}>
                                                {isDeleteMode && (
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={deleteSelectedGroups.includes(group.id)}
                                                            onChange={() => toggleDeleteGroupSelection(group.id)}
                                                            className="rounded text-red-600"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                    <div className="flex items-center gap-3">
                                                        {group.imageUrl ? (
                                                            <img src={group.imageUrl} alt={group.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                                                            </div>
                                                        )}
                                                        <span>{group.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{group.currentParticipants}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={group.categoryId || ''}
                                                        onChange={(e) => handleAssignCategory(group, e.target.value)}
                                                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                                                    >
                                                        <option value="">Sem Categoria</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
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
                                        {filteredGroups.length === 0 && (
                                            <tr>
                                                <td colSpan={isDeleteMode ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    {filterCategory ? 'Nenhum grupo encontrado nesta categoria.' : 'Nenhum grupo encontrado.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Categorias de Grupo</h2>
                            <button onClick={() => openCategoryModal()} className="btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Nova Categoria
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupos</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(categories || []).map(category => (
                                        <tr key={category.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{category.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: category.color }}></div>
                                                    <span className="text-sm text-gray-500">{category.color}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category._count?.groups || 0}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => openCategoryModal(category)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                                <button onClick={() => handleDeleteCategory(category.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhuma categoria criada.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium mb-4">Criar Novo Link Dinâmico</h3>
                            {/* Simplified Form for brevity, assuming minimal structure needed or keep existing full form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Slug (URL)</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">/invite/</span>
                                        <input type="text" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 sm:text-sm" placeholder="vip-customers" id="dl-slug" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Interno</label>
                                    <input type="text" id="dl-name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border" placeholder="Campanha VIP" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Base dos Grupos</label>
                                    <input type="text" id="dl-baseName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border" placeholder="VIP Group" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Capacidade por Grupo</label>
                                    <input type="number" id="dl-capacity" defaultValue={1000} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border" />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Participantes Iniciais</label>
                                    <input type="text" id="dl-participants" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border" placeholder="5511999999999, 5511888888888" />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" id="dl-adminOnly" className="rounded text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">Apenas admin envia</span>
                                    </label>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Números Admin</label>
                                    <input type="text" id="dl-adminNumbers" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border" placeholder="5511999999999" />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                    <textarea id="dl-description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border" />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Imagem do Grupo</label>
                                    <div className="mt-2 flex items-center gap-4">
                                        {dynamicLinkImage ? (
                                            <div className="relative">
                                                <img src={dynamicLinkImage} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                                                <button onClick={() => setDynamicLinkImage('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                        ) : (
                                            <div onClick={() => linkImageInputRef.current?.click()} className="w-16 h-16 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            {isUploadingLinkImage ? 'Fazendo upload...' : 'Clique para enviar imagem de perfil para os grupos deste link'}
                                        </div>
                                    </div>
                                    <input ref={linkImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleLinkImageUpload} />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Instância</label>
                                    <select id="dl-instance" value={instanceName} onChange={e => setInstanceName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border">
                                        <option value="">Selecione...</option>
                                        {connectedInstances.map(i => <option key={i.name} value={i.name}>{i.displayName || i.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Categoria (Opcional)</label>
                                    <select id="dl-category" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border">
                                        <option value="">Sem Categoria</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6">
                                <button onClick={async () => {
                                    const slug = (document.getElementById('dl-slug') as HTMLInputElement).value;
                                    const name = (document.getElementById('dl-name') as HTMLInputElement).value;
                                    const baseGroupName = (document.getElementById('dl-baseName') as HTMLInputElement).value;
                                    const capacity = parseInt((document.getElementById('dl-capacity') as HTMLInputElement).value);
                                    const participantsStr = (document.getElementById('dl-participants') as HTMLInputElement).value;
                                    const dlAdminOnly = (document.getElementById('dl-adminOnly') as HTMLInputElement).checked;
                                    const dlAdminNumbersStr = (document.getElementById('dl-adminNumbers') as HTMLInputElement).value;
                                    const dlDescription = (document.getElementById('dl-description') as HTMLTextAreaElement).value;
                                    const categoryId = (document.getElementById('dl-category') as HTMLSelectElement).value;

                                    if (!slug || !name || !baseGroupName || !instanceName) return alert('Preencha os campos obrigatórios');
                                    const initialParticipants = participantsStr.split(',').map(p => p.trim()).filter(p => p);
                                    if (initialParticipants.length === 0) return alert('Adicione participantes iniciais');

                                    setProgressSteps([]);
                                    setProgressCurrentStep('Iniciando...');
                                    setProgressError('');
                                    setIsProgressModalOpen(true);

                                    try {
                                        await groupService.createDynamicLinkStreaming({
                                            slug, name, baseGroupName, groupCapacity: capacity, instanceName, initialParticipants,
                                            adminOnly: dlAdminOnly,
                                            adminNumbers: dlAdminNumbersStr.split(',').map(p => p.trim()).filter(p => p),
                                            description: dlDescription,
                                            categoryId: categoryId || undefined,
                                            image: dynamicLinkImage || undefined
                                        }, (message) => {
                                            if (message.type === 'progress') {
                                                setProgressCurrentStep(message.step);
                                                setProgressSteps(prev => prev.includes(message.step) ? prev : [...prev, message.step]);
                                            } else if (message.type === 'success') {
                                                setTimeout(() => {
                                                    setIsProgressModalOpen(false);
                                                    alert('Link criado!');
                                                    setDynamicLinkImage('');
                                                    // Clear form (simpler approach)
                                                    (document.getElementById('dl-slug') as HTMLInputElement).value = '';
                                                    (document.getElementById('dl-name') as HTMLInputElement).value = '';
                                                    (document.getElementById('dl-baseName') as HTMLInputElement).value = '';
                                                    (document.getElementById('dl-category') as HTMLSelectElement).value = '';
                                                    fetchDynamicLinks();
                                                    fetchGroups();
                                                }, 1500);
                                            } else if (message.type === 'error') {
                                                setProgressError(message.error);
                                            }
                                        });
                                    } catch (e: any) {
                                        console.error(e);
                                        setProgressError(e.message || 'Erro ao criar link dinâmico');
                                    }
                                }} className="btn-primary bg-blue-600 text-white px-4 py-2 rounded">Criar Link</button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow mt-6">
                            <h3 className="text-lg font-medium mb-4">Links Ativos</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo Atual</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dynamicLinks.map(link => (
                                            <tr key={link.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium">{link.name}</div>
                                                    <div className="text-xs text-gray-500">/{link.slug}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-blue-600 cursor-pointer" onClick={() => { navigator.clipboard.writeText(groupService.getInviteLinkUrl(link.slug)); alert('Copiado!'); }}>
                                                        {groupService.getInviteLinkUrl(link.slug)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{link.activeGroup?.name || 'Inexistente'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleDeleteDynamicLink(link.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                                </td>
                                            </tr>
                                        ))}
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
                            <select value={instanceName} onChange={e => setInstanceName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border">
                                <option value="">Selecione...</option>
                                {connectedInstances.map(i => <option key={i.name} value={i.name}>{i.displayName || i.name}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input type="radio" checked={broadcastTarget === 'groups'} onChange={() => setBroadcastTarget('groups')} className="text-blue-600" />
                                <span>Selecionar Grupos</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" checked={broadcastTarget === 'category'} onChange={() => setBroadcastTarget('category')} className="text-blue-600" />
                                <span>Enviar por Categoria</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded shadow">
                                {broadcastTarget === 'groups' ? (
                                    <>
                                        <h3 className="font-medium mb-3">Selecione os Grupos</h3>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {groups.map(group => (
                                                <label key={group.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                                    <input type="checkbox" checked={selectedGroups.includes(group.id)} onChange={() => toggleGroupSelection(group.id)} className="rounded text-blue-600" />
                                                    <span className="text-sm">{group.name}</span>
                                                    <span className="text-xs text-gray-400">({group.currentParticipants})</span>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-medium mb-3">Selecione a Categoria</h3>
                                        <select value={broadcastCategory} onChange={e => setBroadcastCategory(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border">
                                            <option value="">Selecione...</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name} ({cat._count?.groups || 0} grupos)</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded shadow space-y-4">
                                <h3 className="font-medium">Configuração do Disparo</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome (para Disparos Agendados)</label>
                                    <input type="text" value={broadcastName} onChange={e => setBroadcastName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Nome da Campanha" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Agendar Para (Opcional)</label>
                                    <input type="datetime-local" value={broadcastSchedule} onChange={e => setBroadcastSchedule(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                                    <p className="text-xs text-gray-500 mt-1">Se não preencher, o disparo será imediato.</p>
                                </div>

                                <div className="relative pt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                                    <textarea ref={textareaRef} value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} rows={5} className="w-full rounded-md border-gray-300 shadow-sm p-2 pb-10 border" placeholder="Digite sua mensagem de broadcast aqui..." />
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                                        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-100" disabled={imageUploading}>
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </button>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </div>
                                </div>

                                {linkPreview && !linkPreviewLoading && (
                                    <LinkPreviewCard title={linkPreview.title} description={linkPreview.description} image={linkPreview.image} url={linkPreview.url} siteName={linkPreview.siteName} onRemove={() => { setLinkPreview(null); lastDetectedUrl.current = ''; }} />
                                )}
                                {uploadedImage && (
                                    <div className="relative inline-block">
                                        <img src={uploadedImage.preview} alt="Preview" className="max-h-40 rounded-lg border" />
                                        <button onClick={() => { URL.revokeObjectURL(uploadedImage.preview); setUploadedImage(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </div>
                                )}

                                <button onClick={handleBroadcast} disabled={!instanceName || !broadcastMessage || (!!broadcastSchedule && !broadcastName)} className={`w-full btn-primary text-white py-2 rounded ${broadcastSchedule ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                    {broadcastSchedule
                                        ? `Agendar ${broadcastTarget === 'groups' ? `para ${selectedGroups.length} grupos` : 'para categoria'}`
                                        : `Enviar Imediatamente ${broadcastTarget === 'groups' ? `para ${selectedGroups.length} grupos` : 'para categoria'}`
                                    }
                                </button>
                            </div>
                        </div>

                        {broadcastStatus.length > 0 && (
                            <div className="bg-white p-4 rounded shadow mt-6">
                                <h3 className="font-medium mb-2">Resultado</h3>
                                <div className="max-h-40 overflow-y-auto">
                                    {broadcastStatus.map((res, i) => <div key={i} className={`text-sm ${res.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{res.jid}: {res.status}</div>)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'scheduled' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Agendamentos de Disparos para Grupos</h2>
                            <button onClick={fetchScheduledCampaigns} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm">Atualizar</button>
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alvo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultados</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {scheduledCampaigns.map(campaign => (
                                        <tr key={campaign.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{campaign.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.targetType === 'GROUPS' ? `${campaign.targetIds.length} Grupos` : 'Categoria'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(campaign.scheduledFor).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${campaign.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        campaign.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                                                            campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                campaign.status === 'CANCELED' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-red-100 text-red-800'}`}>
                                                    {campaign.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                Sucesso: <span className="text-green-600 font-medium">{campaign.sentCount}</span> /
                                                Falha: <span className="text-red-600 font-medium">{campaign.failedCount}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {campaign.status === 'PENDING' && (
                                                    <button onClick={() => handleCancelCampaign(campaign.id)} className="text-red-600 hover:text-red-900">Cancelar</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {scheduledCampaigns.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum agendamento encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                <label className="block text-sm font-medium text-gray-700">Nome</label>
                                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                                    <option value="">Sem Categoria</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Instância</label>
                                <select value={instanceName} onChange={e => setInstanceName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                                    <option value="">Selecione...</option>
                                    {connectedInstances.map(i => <option key={i.name} value={i.name}>{i.displayName || i.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Participantes Iniciais</label>
                                <input type="text" value={initialParticipants} onChange={e => setInitialParticipants(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="551199999, 551188888" />
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={adminOnly} onChange={e => setAdminOnly(e.target.checked)} className="rounded text-blue-600" />
                                    <span className="text-sm font-medium">Apenas admin envia</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Admin Numbers</label>
                                <input type="text" value={adminNumbers} onChange={e => setAdminNumbers(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                <textarea value={groupDescription} onChange={e => setGroupDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Imagem de Perfil</label>
                                <div className="mt-2 flex items-center gap-4">
                                    {groupImageUrl ? (
                                        <div className="relative">
                                            <img src={groupImageUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                                            <button onClick={() => setGroupImageUrl('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                    ) : (
                                        <div onClick={() => groupImageInputRef.current?.click()} className="w-16 h-16 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        {isUploadingGroupImage ? 'Fazendo upload...' : 'Adicione uma imagem de perfil para o grupo'}
                                    </div>
                                </div>
                                <input ref={groupImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleGroupImageUpload} />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button onClick={handleCreateGroup} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Criar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome</label>
                                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cor</label>
                                <input type="color" value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                <textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                <button onClick={handleSaveCategory} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Modal */}
            {isProgressModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-center text-gray-800">Criando...</h3>

                        <div className="space-y-4 mb-6">
                            {progressSteps.map((step, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{step}</span>
                                </div>
                            ))}

                            {!progressError && progressCurrentStep && !progressSteps.includes(progressCurrentStep) && (
                                <div className="flex items-center gap-3 text-sm font-medium text-blue-600">
                                    <svg className="animate-spin w-5 h-5 text-blue-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{progressCurrentStep}</span>
                                </div>
                            )}

                            {progressError && (
                                <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{progressError}</span>
                                </div>
                            )}
                        </div>

                        {progressError && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setIsProgressModalOpen(false)}
                                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
