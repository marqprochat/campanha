import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leadPageService } from '../../../services/leadPageService';
import { LeadPage } from '../../../types/LeadPage';
import { Header } from '../../../components/Header';
import toast from 'react-hot-toast';

export const LeadPageList: React.FC = () => {
    const [pages, setPages] = useState<LeadPage[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchPages = async () => {
        try {
            const data = await leadPageService.list();
            setPages(data);
        } catch (error) {
            console.error('Error fetching pages:', error);
            toast.error('Erro ao carregar páginas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a página "${title}"?`)) {
            try {
                await leadPageService.delete(id);
                toast.success('Página excluída com sucesso');
                fetchPages();
            } catch (error) {
                console.error('Error deleting page:', error);
                toast.error('Erro ao excluir página');
            }
        }
    };

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/share/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado!');
    };

    return (
        <div className="space-y-6">
            <Header
                title="Páginas de Captura"
                subtitle="Gerencie suas landing pages para captura de leads"
                actions={
                    <Link to="/paginas/nova" className="btn-primary">
                        + Nova Página
                    </Link>
                }
            />

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : pages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 mb-4">Você ainda não tem nenhuma página de captura.</p>
                    <Link to="/paginas/nova" className="text-primary-600 hover:underline font-medium">
                        Criar minha primeira página
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link (Slug)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criada em</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pages.map((page) => (
                                <tr key={page.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{page.title}</div>
                                        {page.description && <div className="text-xs text-gray-500 truncate max-w-xs">{page.description}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{page.slug}</span>
                                            <button onClick={() => copyLink(page.slug)} className="text-gray-400 hover:text-gray-600" title="Copiar Link">
                                                📄
                                            </button>
                                            <a href={`/share/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700" title="Abrir">
                                                🔗
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {page.category?.nome || 'Sem Categoria'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {page.submissions}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(page.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => navigate(`/paginas/${page.id}`)}
                                            className="text-primary-600 hover:text-primary-900 mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(page.id, page.title)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
