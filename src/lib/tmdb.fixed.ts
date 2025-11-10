const TMDB_API_KEY = 'c1dd4a7d9aab18675dc3720ab5a99436';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
  media_type?: string;
  adult?: boolean;
  video?: boolean;
  title?: string;
  release_date?: string;
  original_title?: string;
}

interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Cache for API configuration
let apiConfig: {
  images: {
    secure_base_url: string;
    poster_sizes: ImageSize[];
    backdrop_sizes: BackdropSize[];
  };
} | null = null;

/**
 * Fetches data from TMDB API with error handling and logging
 */
async function fetchFromTMDB<T = any>(
  endpoint: string, 
  params: Record<string, string | number | boolean> = {},
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<T> {
  try {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    
    // Always include API key and language
    const queryParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: 'en-US',
      ...Object.fromEntries(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      )
    });

    url.search = queryParams.toString();
    
    console.log(`[TMDB] ${method} ${url.toString()}`);
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    // Add body for POST requests
    if (method === 'POST' && body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url.toString(), options);
    const responseData = await response.json();
    
    console.log(`[TMDB] Response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    return responseData;
  } catch (error) {
    console.error('[TMDB] Request failed:', error);
    throw error;
  }
}

/**
 * Fetches shows from Prime Video
 */
export async function fetchPrimeVideos(): Promise<TVShow[]> {
  try {
    console.log('[TMDB] Fetching Prime Video shows...');
    
    // First, get the watch provider ID for Prime Video in the US
    const providers = await fetchFromTMDB<{ results: Array<{ provider_id: number, provider_name: string }> }>(
      '/watch/providers/tv',
      { watch_region: 'US' }
    );
    
    const primeVideoProvider = providers.results.find(p => 
      p.provider_name.toLowerCase().includes('amazon prime') || 
      p.provider_name.toLowerCase().includes('prime video') ||
      p.provider_id === 119
    );
    
    if (!primeVideoProvider) {
      console.error('[TMDB] Could not find Prime Video provider in US region');
      return [];
    }
    
    console.log(`[TMDB] Found Prime Video provider:`, primeVideoProvider);
    
    // Then fetch shows available on Prime Video
    const data = await fetchFromTMDB<TMDBResponse<TVShow>>(
      '/discover/tv',
      {
        sort_by: 'popularity.desc',
        page: 1,
        with_watch_providers: String(primeVideoProvider.provider_id),
        watch_region: 'US',
        with_origin_country: 'US',
        with_original_language: 'en',
        'vote_count.gte': 10,
        'vote_average.gte': 5
      }
    );
    
    console.log(`[TMDB] Fetched ${data.results.length} Prime Video shows`);
    return data.results;
  } catch (error) {
    console.error('[TMDB] Error fetching Prime Video shows:', error);
    return [];
  }
}

/**
 * Fetches shows from HBO Max
 */
export async function fetchHBOMaxContent(): Promise<TVShow[]> {
  try {
    console.log('[TMDB] Fetching HBO Max shows...');
    
    // First, get the watch provider ID for HBO Max in the US
    const providers = await fetchFromTMDB<{ results: Array<{ provider_id: number, provider_name: string }> }>(
      '/watch/providers/tv',
      { watch_region: 'US' }
    );
    
    const hboMaxProvider = providers.results.find(p => 
      p.provider_name.toLowerCase().includes('hbo max') || 
      p.provider_name.toLowerCase().includes('hbo') ||
      p.provider_id === 384
    );
    
    if (!hboMaxProvider) {
      console.error('[TMDB] Could not find HBO Max provider in US region');
      return [];
    }
    
    console.log(`[TMDB] Found HBO Max provider:`, hboMaxProvider);
    
    // Then fetch shows available on HBO Max
    const data = await fetchFromTMDB<TMDBResponse<TVShow>>(
      '/discover/tv',
      {
        sort_by: 'popularity.desc',
        page: 1,
        with_watch_providers: String(hboMaxProvider.provider_id),
        watch_region: 'US',
        with_origin_country: 'US',
        with_original_language: 'en',
        'vote_count.gte': 10,
        'vote_average.gte': 5
      }
    );
    
    console.log(`[TMDB] Fetched ${data.results.length} HBO Max shows`);
    return data.results;
  } catch (error) {
    console.error('[TMDB] Error fetching HBO Max shows:', error);
    return [];
  }
}

/**
 * Gets the full URL for a poster image with fallback
 */
export function getPosterUrl(path: string | null, size: ImageSize = 'w500'): string {
  if (!path) return '/placeholder-tv.png';
  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}${size}${cleanPath}`;
}

/**
 * Gets the full URL for a backdrop image with fallback
 */
export function getBackdropUrl(path: string | null, size: BackdropSize = 'original'): string {
  if (!path) return '/placeholder-backdrop.jpg';
  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}${size}${cleanPath}`;
}

/**
 * Gets the full URL for any TMDB image
 */
export function getImageUrl(path: string, size: string = 'original'): string {
  if (!path) return '';
  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}${size}${cleanPath}`;
}

// Initialize configuration when the module loads
async function init() {
  try {
    const config = await fetchFromTMDB<{
      images: {
        secure_base_url: string;
        poster_sizes: ImageSize[];
        backdrop_sizes: BackdropSize[];
      };
    }>('/configuration');
    
    apiConfig = config;
    console.log('[TMDB] Configuration loaded');
  } catch (error) {
    console.error('[TMDB] Failed to load config, using defaults', error);
    // Fallback configuration
    apiConfig = {
      images: {
        secure_base_url: TMDB_IMAGE_BASE_URL,
        poster_sizes: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
        backdrop_sizes: ['w300', 'w780', 'w1280', 'original'],
      },
    };
  }
}

// Initialize the module
init().catch(console.error);
