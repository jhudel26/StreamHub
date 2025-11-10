import { 
  TMDBResponse, 
  TVShow, 
  ImageSize, 
  BackdropSize,
  TMDBConfig
} from './types';

const TMDB_API_KEY = 'c1dd4a7d9aab18675dc3720ab5a99436';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Cache for API configuration
let apiConfig: TMDBConfig | null = null;

/**
 * Fetches data from TMDB API with error handling and logging
 */
async function fetchFromTMDB<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  try {
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: 'en-US',
      ...params,
    });

    const url = `${TMDB_BASE_URL}${endpoint}?${searchParams}`;
    console.log(`[TMDB] Fetching: ${endpoint}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TMDB] Error (${response.status}):`, errorText);
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[TMDB] Request failed:', error);
    throw error;
  }
}

/**
 * Fetches and caches TMDB configuration
 */
async function getApiConfig(): Promise<TMDBConfig> {
  if (!apiConfig) {
    try {
      const config = await fetchFromTMDB<TMDBConfig>('/configuration');
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
  return apiConfig;
}

/**
 * Fetches shows from Prime Video
 */
export async function fetchPrimeVideos(): Promise<TVShow[]> {
  try {
    const data = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
      with_watch_providers: '119', // Prime Video
      watch_region: 'US',
      sort_by: 'popularity.desc',
      page: '1',
      with_origin_country: 'US',
      'vote_count.gte': '10', // Only include shows with some votes
      'vote_average.gte': '5', // Only include shows with decent ratings
      with_original_language: 'en', // Only English content
    });
    
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
    const data = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
      with_watch_providers: '384', // HBO Max
      watch_region: 'US',
      sort_by: 'popularity.desc',
      page: '1',
      with_origin_country: 'US',
      'vote_count.gte': '10',
      'vote_average.gte': '5',
      with_original_language: 'en',
    });
    
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
getApiConfig().catch(console.error);
