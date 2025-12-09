import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leadPageService } from '../../../services/leadPageService';
import { useCategories } from '../../../hooks/useCategories';
import { Header } from '../../../components/Header';
import toast from 'react-hot-toast';

export const LeadPageEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const { categories } = useCategories({ pageSize: 100 });
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        headline: '',
        description: '',
        categoryId: '',
        primaryColor: '#000000',
        backgroundColor: '#ffffff',
        backgroundImageUrl: ''
    });

    useEffect(() => {
        const fetchPage = async () => {
            if (id) {
                try {
                    const data = await leadPageService.getById(id);
                    setFormData({
                        title: data.title,
                        slug: data.slug,
                        headline: data.headline || '',
                        description: data.description || '',
                        categoryId: data.categoryId,
                        primaryColor: data.primaryColor,
                        backgroundColor: data.backgroundColor,
                        backgroundImageUrl: data.backgroundImageUrl || ''
                    });
                } catch (error) {
                    console.error('Error fetching page:', error);
                    toast.error('Erro ao carregar página');
                    navigate('/paginas');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchPage();
    }, [id, navigate]);

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD') // Decompose combined characters (e.g., 'á' -> 'a' + '´')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        if (!isEditing && !formData.slug) {
            setFormData(prev => ({ ...prev, title, slug: generateSlug(title) }));
        } else {
            setFormData(prev => ({ ...prev, title }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId) {
            toast.error('Selecione uma categoria para salvar os leads');
            return;
        }

        setSaving(true);
        try {
            if (isEditing && id) {
                await leadPageService.update(id, formData);
                toast.success('Página atualizada com sucesso');
            } else {
                await leadPageService.create(formData);
                toast.success('Página criada com sucesso');
            }
            navigate('/paginas');
        } catch (error) {
            console.error('Error saving page:', error);
            toast.error('Erro ao salvar página. Verifique se o slug já existe.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <Header
                title={isEditing ? 'Editar Página' : 'Nova Página'}
                subtitle="Configure o visual e o destino dos leads"
                actions={
                    <button
                        type="button"
                        onClick={() => navigate('/paginas')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white"
                    >
                        Cancelar
                    </button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section: Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Informações Básicas</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título Interno</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={handleTitleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                placeholder="Ex: Campanha Natal 2024"
                            />
                            <p className="mt-1 text-sm text-gray-500">Nome para identificar esta página no painel.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link da Página (Slug)</label>
                            <div className="flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    {window.location.host}/share/
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm border"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria de Destino</label>
                            <select
                                required
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            >
                                <option value="">Selecione uma categoria...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-sm text-gray-500">Os leds capturados serão salvos nesta categoria.</p>
                        </div>
                    </div>
                </div>

                {/* Section: Page Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Conteúdo da Página</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal (Headline)</label>
                            <input
                                type="text"
                                value={formData.headline}
                                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                placeholder="Ex: Receba nosso E-book Grátis"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                placeholder="Ex: Cadastre-se abaixo para receber o material exclusivo via WhatsApp."
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Appearance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Aparência</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal (Botão)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="h-10 w-20 p-1 rounded border border-gray-300"
                                />
                                <span className="text-sm text-gray-500">{formData.primaryColor}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={formData.backgroundColor}
                                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                                    className="h-10 w-20 p-1 rounded border border-gray-300"
                                />
                                <span className="text-sm text-gray-500">{formData.backgroundColor}</span>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Fundo</label>
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={formData.backgroundImageUrl}
                                        onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border mb-2"
                                        placeholder="https://..."
                                    />

                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-colors">
                                            <span>📤 Carregar Imagem</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    if (file.size > 2 * 1024 * 1024) {
                                                        toast.error('A imagem deve ter no máximo 2MB');
                                                        return;
                                                    }

                                                    const formDataUpload = new FormData();

                                                    if (!res.ok) throw new Error('Falha no upload');

                                                    const data = await res.json();
                                                    setFormData(prev => ({ ...prev, backgroundImageUrl: data.url }));
                                                    toast.success('Imagem carregada!', { id: toastId });
                                                } catch (err) {
                                                console.error(err);
                                            toast.error('Erro ao enviar imagem', {id: toastId });
                                                    }
                                            e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <span className="text-xs text-gray-500">Máx: 2MB</span>
                                    </div>
                                </div>

                                {formData.backgroundImageUrl && (
                                    <div className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden group">
                                        <img
                                            src={formData.backgroundImageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, backgroundImageUrl: '' })}
                                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Cole uma URL externa ou carregue uma imagem do seu dispositivo.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/paginas')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary px-8 py-2 font-medium"
                    >
                        {saving ? 'Salvando...' : 'Salvar Página'}
                    </button>
                </div>
            </form>
        </div>
    );
};
