import axios from 'axios';

export interface LinkPreviewData {
    url: string;
    title: string;
    description: string;
    image: string | null;
    siteName: string;
    type: 'youtube' | 'generic';
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Extract Open Graph meta tags from raw HTML using regex (no cheerio needed)
 */
function extractOgTags(html: string): Record<string, string> {
    const tags: Record<string, string> = {};
    // Match <meta property="og:xxx" content="yyy" /> in any attribute order
    const regex = /<meta[^>]*(?:property|name)=["']og:([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*\/?>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        tags[match[1]] = match[2];
    }

    // Also try reversed attribute order: content before property
    const regexReversed = /<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:([^"']+)["'][^>]*\/?>/gi;
    while ((match = regexReversed.exec(html)) !== null) {
        if (!tags[match[2]]) {
            tags[match[2]] = match[1];
        }
    }

    return tags;
}

/**
 * Extract <title> from HTML as fallback
 */
function extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
}

/**
 * Extract meta description from HTML as fallback
 */
function extractMetaDescription(html: string): string {
    const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*\/?>/i);
    if (match) return match[1];
    const matchReversed = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*\/?>/i);
    return matchReversed ? matchReversed[1] : '';
}

/**
 * Fetch link preview data for a given URL
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreviewData | null> {
    try {
        // Check if it's a YouTube URL first
        const youtubeId = extractYouTubeVideoId(url);
        if (youtubeId) {
            // For YouTube we can get a high-quality thumbnail without API key
            const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

            // Try to fetch the page to get the title
            let title = 'YouTube Video';
            let description = '';
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                    },
                    timeout: 5000,
                    maxRedirects: 3,
                });
                const ogTags = extractOgTags(response.data);
                title = ogTags['title'] || extractTitle(response.data) || 'YouTube Video';
                description = ogTags['description'] || extractMetaDescription(response.data) || '';
            } catch {
                // If fetching fails, we still have the thumbnail
                console.log(`⚠️ Could not fetch YouTube page metadata for ${url}, using defaults`);
            }

            return {
                url,
                title,
                description,
                image: thumbnailUrl,
                siteName: 'YouTube',
                type: 'youtube',
            };
        }

        // Generic URL — fetch the page and extract OG tags
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            },
            timeout: 8000,
            maxRedirects: 5,
            // Only read text/html content
            responseType: 'text',
            // Limit response size to 500KB to avoid huge pages
            maxContentLength: 500 * 1024,
        });

        const html = response.data;
        const ogTags = extractOgTags(html);

        const title = ogTags['title'] || extractTitle(html) || '';
        const description = ogTags['description'] || extractMetaDescription(html) || '';
        const image = ogTags['image'] || null;
        const siteName = ogTags['site_name'] || '';

        if (!title && !image) {
            return null; // No useful metadata found
        }

        // Resolve relative image URLs
        let resolvedImage = image;
        if (image && !image.startsWith('http')) {
            try {
                const urlObj = new URL(url);
                resolvedImage = image.startsWith('//')
                    ? `${urlObj.protocol}${image}`
                    : image.startsWith('/')
                        ? `${urlObj.origin}${image}`
                        : `${urlObj.origin}/${image}`;
            } catch {
                resolvedImage = image;
            }
        }

        return {
            url,
            title,
            description,
            image: resolvedImage,
            siteName,
            type: 'generic',
        };
    } catch (error: any) {
        console.error(`❌ Error fetching link preview for ${url}:`, error.message);
        return null;
    }
}
