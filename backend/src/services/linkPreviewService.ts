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
 * Domains known to have aggressive anti-bot protection.
 * For these, we skip local fetching and go straight to Microlink API.
 */
const PROTECTED_DOMAINS = [
    'mercadolivre.com.br',
    'mercadolibre.com',
    'amazon.com.br',
    'amazon.com',
    'shopee.com.br',
    'magalu.com.br',
    'magazineluiza.com.br',
    'aliexpress.com',
    'americanas.com.br',
    'casasbahia.com.br',
    'submarino.com.br',
];

/**
 * User-Agent strings for local fetching (non-protected sites).
 */
const USER_AGENTS = [
    'WhatsApp/2.23.20.0',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// ============================================================================
// YOUTUBE HELPERS
// ============================================================================

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

// ============================================================================
// HTML PARSING HELPERS
// ============================================================================

function extractOgTags(html: string): Record<string, string> {
    const tags: Record<string, string> = {};
    const regex = /<meta[^>]*(?:property|name)=["']og:([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*\/?>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        tags[match[1]] = match[2];
    }
    const regexReversed = /<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:([^"']+)["'][^>]*\/?>/gi;
    while ((match = regexReversed.exec(html)) !== null) {
        if (!tags[match[2]]) {
            tags[match[2]] = match[1];
        }
    }
    return tags;
}

function extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
}

function extractMetaDescription(html: string): string {
    const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*\/?>/i);
    if (match) return match[1];
    const matchReversed = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*\/?>/i);
    return matchReversed ? matchReversed[1] : '';
}

// ============================================================================
// FETCHING STRATEGIES
// ============================================================================

/**
 * Check if a URL belongs to a known protected domain
 */
function isProtectedDomain(url: string): boolean {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return PROTECTED_DOMAINS.some(domain => hostname.includes(domain));
    } catch {
        return false;
    }
}

/**
 * Strategy 1: Use Microlink.io free API (no API key needed, 50 req/day free)
 * Best for anti-bot protected sites like Mercado Livre, Amazon, etc.
 */
async function fetchViaMicrolink(url: string, apiKey?: string): Promise<LinkPreviewData | null> {
    try {
        console.log(`🌐 Fetching link preview via Microlink for: ${url}${apiKey ? ' (with API key)' : ''}`);
        const headers: Record<string, string> = {};
        if (apiKey) {
            headers['x-api-key'] = apiKey;
        }
        const response = await axios.get('https://api.microlink.io', {
            params: { url },
            headers,
            timeout: 15000,
        });

        const data = response.data;
        if (data.status === 'success' && data.data) {
            const d = data.data;
            return {
                url: d.url || url,
                title: d.title || '',
                description: d.description || '',
                image: d.image?.url || d.logo?.url || null,
                siteName: d.publisher || '',
                type: 'generic',
            };
        }
        return null;
    } catch (error: any) {
        console.log(`⚠️ Microlink failed for ${url}: ${error.message}`);
        return null;
    }
}

/**
 * Strategy 2: Direct fetch with social-bot user-agents
 * Works for most non-protected sites (blogs, news, standard commerce, etc.)
 */
async function fetchDirectly(url: string): Promise<LinkPreviewData | null> {
    for (const agent of USER_AGENTS) {
        try {
            console.log(`🔍 Trying direct fetch for ${url} with agent: ${agent.substring(0, 25)}...`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': agent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                },
                timeout: 8000,
                maxRedirects: 5,
                responseType: 'text',
                maxContentLength: 1024 * 1024,
                validateStatus: (status) => status < 500,
            });

            if (response.status >= 200 && response.status < 400 && response.data && response.data.length > 200) {
                const html = response.data;
                const ogTags = extractOgTags(html);

                const title = ogTags['title'] || extractTitle(html) || '';
                const description = ogTags['description'] || extractMetaDescription(html) || '';
                const image = ogTags['image'] || null;
                const siteName = ogTags['site_name'] || '';

                if (!title && !image) continue; // Try next UA

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

                console.log(`✅ Direct fetch succeeded for ${url}`);
                return {
                    url,
                    title,
                    description,
                    image: resolvedImage,
                    siteName,
                    type: 'generic',
                };
            }
        } catch {
            // Try next user agent
        }
    }
    return null;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Fetch link preview data for a given URL.
 *
 * Strategy:
 * 1. YouTube → direct thumbnail URL (no fetching needed)
 * 2. Protected domains (ML, Amazon) → Microlink API
 * 3. Other URLs → Direct fetch with social-bot UAs, fallback to Microlink
 */
export async function fetchLinkPreview(url: string, microlinkApiKey?: string): Promise<LinkPreviewData | null> {
    try {
        // --- YouTube ---
        const youtubeId = extractYouTubeVideoId(url);
        if (youtubeId) {
            const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            let title = 'YouTube Video';
            let description = '';

            try {
                const html = await (async () => {
                    const r = await axios.get(url, {
                        headers: { 'User-Agent': USER_AGENTS[0] },
                        timeout: 5000,
                        maxRedirects: 3,
                        responseType: 'text',
                    });
                    return r.data;
                })();
                if (html) {
                    const ogTags = extractOgTags(html);
                    title = ogTags['title'] || extractTitle(html) || 'YouTube Video';
                    description = ogTags['description'] || extractMetaDescription(html) || '';
                }
            } catch {
                console.log(`⚠️ Could not fetch YouTube metadata for ${url}, using defaults`);
            }

            return { url, title, description, image: thumbnailUrl, siteName: 'YouTube', type: 'youtube' };
        }

        // --- Protected domains → Microlink first ---
        if (isProtectedDomain(url)) {
            console.log(`🛡️ Protected domain detected, using Microlink API for: ${url}`);
            const microlinkResult = await fetchViaMicrolink(url, microlinkApiKey);
            if (microlinkResult) return microlinkResult;
            // Fallback to direct (unlikely to work but worth trying)
            return await fetchDirectly(url);
        }

        // --- Regular sites → Direct fetch, fallback to Microlink ---
        const directResult = await fetchDirectly(url);
        if (directResult) return directResult;

        // Fallback to Microlink for sites that block direct requests
        console.log(`🔄 Direct fetch failed, falling back to Microlink for: ${url}`);
        return await fetchViaMicrolink(url, microlinkApiKey);

    } catch (error: any) {
        console.error(`❌ Error fetching link preview for ${url}:`, error.message);
        return null;
    }
}
