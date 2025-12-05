import { Category } from '../types';

interface CategoryCardProps {
    category: Category;
    contactCount?: number;
    onClick: (category: Category) => void;
}

export function CategoryCard({ category, contactCount, onClick }: CategoryCardProps) {
    return (
        <button
            onClick={() => onClick(category)}
            className="flex flex-col items-start p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 group w-full text-left"
        >
            <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${category.cor}20` }} // 20% opacity for background
            >
                <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.cor }}
                />
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                {category.nome}
            </h3>

            {category.descricao && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {category.descricao}
                </p>
            )}

            {contactCount !== undefined && (
                <span className="text-xs font-medium text-gray-400 mt-auto bg-gray-50 px-2 py-1 rounded-md">
                    {contactCount} contatos
                </span>
            )}
        </button>
    );
}

interface AllContactsCardProps {
    totalContacts: number;
    onClick: () => void;
}

export function AllContactsCard({ totalContacts, onClick }: AllContactsCardProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-start p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm hover:shadow-md border border-blue-100 transition-all duration-200 group w-full text-left"
        >
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-110">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                Todos os Contatos
            </h3>

            <p className="text-sm text-gray-500 mb-3">
                Visualizar lista completa
            </p>

            <span className="text-xs font-medium text-blue-600 mt-auto bg-white px-2 py-1 rounded-md shadow-sm">
                {totalContacts} contatos
            </span>
        </button>
    );
}
