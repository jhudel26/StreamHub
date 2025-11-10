const TMDB_API_KEY = 'c1dd4a7d9aab18675dc3720ab5a99436';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';

export interface ExternalIds {
  imdb_id?: string;
  facebook_id?: string;
  instagram_id?: string;
  twitter_id?: string;
  id?: number;
}

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
  homepage?: string;
  external_ids?: ExternalIds;
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
  params: Record<string, string | number | boolean | undefined> = {},
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
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
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
      url: url.toString()
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
    
    // Get shows specifically from Prime Video
    const response = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
      sort_by: 'popularity.desc',
      page: 1,
      with_watch_providers: '119', // Prime Video provider ID
      watch_region: 'US',
      with_origin_country: 'US',
      with_original_language: 'en',
      'vote_count.gte': 10,
      'vote_average.gte': 5
    });
    
    console.log(`[TMDB] Fetched ${response.results.length} Prime Video shows`);
    return response.results;
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
    
    // First try with network ID (HBO)
    let response = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
      sort_by: 'popularity.desc',
      with_networks: '49', // HBO network ID
      page: 1,
      language: 'en-US',
      region: 'US',
      'vote_count.gte': 10,
      'vote_average.gte': 5,
      include_adult: false,
      include_null_first_air_dates: false
    });

    // If no results, try with watch providers
    if (!response.results || response.results.length === 0) {
      console.log('[TMDB] Trying alternative approach with watch providers...');
      response = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
        sort_by: 'popularity.desc',
        with_watch_providers: '384', // HBO Max provider ID
        watch_region: 'US',
        page: 1,
        language: 'en-US',
        region: 'US',
        'vote_count.gte': 10,
        'vote_average.gte': 5
      });
    }

    // Filter out any shows without poster images
    const shows = response.results?.filter(show => show.poster_path) || [];
    
    // Enhance shows with external IDs for direct linking
    const enhancedShows = await Promise.all(
      shows.map(async (show) => {
        try {
          const details = await fetchFromTMDB<TVShow>(`/tv/${show.id}`, {
            append_to_response: 'external_ids',
            language: 'en-US'
          });
          
          return {
            ...show,
            external_ids: details.external_ids,
            // Create a direct HBO Max URL using IMDB ID if available
            homepage: details.external_ids?.imdb_id 
              ? `https://play.hbomax.com/title/${details.external_ids.imdb_id}` 
              : `https://play.hbomax.com/search/result?q=${encodeURIComponent(show.name.replace(/\s+/g, '+'))}`
          };
        } catch (error) {
          console.error(`[TMDB] Error fetching details for show ${show.id}:`, error);
          return {
            ...show,
            homepage: `https://play.hbomax.com/search/result?q=${encodeURIComponent(show.name.replace(/\s+/g, '+'))}`
          };
        }
      })
    );
    
    console.log(`[TMDB] Fetched ${enhancedShows.length} HBO Max shows with direct links`);
    return enhancedShows;
  } catch (error) {
    console.error('[TMDB] Error fetching HBO Max shows:', error);
    return [];
  }
}

/**
 * Gets the full URL for a poster image with fallback
 */
export function getPosterUrl(path: string | null, size: ImageSize = 'w500'): string {
  // If no path, return a placeholder image from a free image service
  if (!path || path === 'null') {
    return 'https://via.placeholder.com/500x750/1a1a2e/e94560?text=No+Image';
  }
  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}${size}${cleanPath}`;
}

/**
 * Gets the full URL for a backdrop image with fallback
 */
export function getBackdropUrl(path: string | null, size: BackdropSize = 'original'): string {
  if (!path) return 'https://via.placeholder.com/1280x720/1a1a2e/e94560?text=No+Backdrop';
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
