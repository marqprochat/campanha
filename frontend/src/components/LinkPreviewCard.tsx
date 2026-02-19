interface LinkPreviewCardProps {
    title: string;
    description: string;
    image: string | null;
    url: string;
    siteName: string;
    onRemove: () => void;
}

export function LinkPreviewCard({ title, description, image, url, siteName, onRemove }: LinkPreviewCardProps) {
    return (
        <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Remove button */}
            <button
                onClick={onRemove}
                className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 rounded-full p-1 shadow hover:bg-red-50 transition-colors"
                title="Remover preview"
            >
                <svg className="w-4 h-4 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="flex">
                {/* Image */}
                {image && (
                    <div className="flex-shrink-0 w-32 h-24 sm:w-40 sm:h-28">
                        <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 p-3 min-w-0">
                    {siteName && (
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                            {siteName}
                        </p>
                    )}
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                        {title}
                    </h4>
                    {description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {description}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 truncate">
                        {url}
                    </p>
                </div>
            </div>
        </div>
    );
}
