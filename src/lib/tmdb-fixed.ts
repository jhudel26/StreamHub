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
export async function fetchPrimeVideos(page: number = 1): Promise<TVShow[]> {
  try {
    console.log('[TMDB] Fetching Prime Video shows...');
    
    // First try with watch providers
    let response = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
      with_watch_providers: '119|9',
      watch_region: 'US',
      sort_by: 'popularity.desc',
      page,
      language: 'en-US',
      include_adult: false,
      include_null_first_air_dates: false
    });

    // If no results, try alternative approach with network
    if (!response.results || response.results.length === 0) {
      console.log('[TMDB] Trying alternative approach with network...');
      response = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
        sort_by: 'popularity.desc',
        with_networks: '1024', // Amazon Prime Video network ID
        page,
        language: 'en-US',
        region: 'US',
        'vote_count.gte': 10,
        'vote_average.gte': 5
      });
    }

    // If still no results, get popular shows as fallback
    if (!response.results || response.results.length === 0) {
      console.log('[TMDB] Using popular shows as fallback...');
      response = await fetchFromTMDB<TMDBResponse<TVShow>>('/tv/popular', {
        page,
        language: 'en-US',
        region: 'US'
      });
    }
    
    // Filter out any shows without poster images
    const shows = response.results?.filter(show => show.poster_path) || [];
    console.log(`[TMDB] Fetched ${shows.length} Prime Video shows`);
    return shows;
  } catch (error) {
    console.error('[TMDB] Error fetching Prime Video shows:', error);
    // Return some hardcoded popular shows as final fallback
    return [
      {
        id: 71912,
        name: 'The Boys',
        overview: 'A group of vigilantes known informally as \"The Boys\" set out to take down corrupt superheroes with no more than blue-collar grit and a willingness to fight dirty.',
        poster_path: '/stTEycfG9928HYGEISBFaGZKngg.jpg',
        backdrop_path: '/m8JTwHFwXWLhvhIl6qOtoN6hI3g.jpg',
        first_air_date: '2019-07-25',
        vote_average: 8.4,
        vote_count: 10000,
        genre_ids: [10765, 10759, 35],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'The Boys',
        popularity: 1000,
        media_type: 'tv'
      },
      {
        id: 102292,
        name: 'The Lord of the Rings: The Rings of Power',
        overview: 'Beginning in a time of relative peace, we follow an ensemble cast of characters as they confront the re-emergence of evil to Middle-earth. From the darkest depths of the Misty Mountains, to the majestic forests of Lindon, to the breathtaking island kingdom of Númenor, to the furthest reaches of the map, these kingdoms and characters will carve out legacies that live on long after they are gone.',
        poster_path: '/mYLOqiStMxDK3fYZFirgrMt8z5d.jpg',
        backdrop_path: '/tQ6A9RQ7U4pLpZMkUlQpZQCEvqw.jpg',
        first_air_date: '2022-09-01',
        vote_average: 7.5,
        vote_count: 5000,
        genre_ids: [10765, 10759, 18],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'The Lord of the Rings: The Rings of Power',
        popularity: 1200,
        media_type: 'tv'
      },
      {
        id: 102463,
        name: 'The Wheel of Time',
        overview: `Follow Moiraine, a member of the shadowy and influential all-female organization called the 'Aes Sedai' as she embarks on a dangerous, world-spanning journey with five young men and women. Moiraine is interested in these five because she believes one of them might be the reincarnation of an incredibly powerful individual, whom prophecies say will either save humanity or destroy it.`,
        poster_path: '/7nO5xY2rI9vEj3QW9vXyRrXd1Xk.jpg',
        backdrop_path: '/qSgBzXdu6QwVVeqOYOl2oZZRQXs.jpg',
        first_air_date: '2021-11-18',
        vote_average: 7.9,
        vote_count: 3000,
        genre_ids: [10765, 18, 10759],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'The Wheel of Time',
        popularity: 800,
        media_type: 'tv'
      },
      {
        id: 95057,
        name: 'The Expanse',
        overview: `A thriller set two hundred years in the future following the case of a missing young woman who brings a hardened detective and a rogue ship's captain together in a race across the solar system to expose the greatest conspiracy in human history.`,
        poster_path: '/6pKJ0SFKU3KJmctVhwS4uJ6z6T1.jpg',
        backdrop_path: '/nmlpEQuemzEgJz7eWfTufDkV31W.jpg',
        first_air_date: '2015-12-14',
        vote_average: 8.0,
        vote_count: 2000,
        genre_ids: [10765, 10759, 18],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'The Expanse',
        popularity: 700,
        media_type: 'tv'
      },
      {
        id: 113988,
        name: 'The Terminal List',
        overview: 'A former Navy SEAL officer investigates why his entire platoon was ambushed during a high-stakes covert mission.',
        poster_path: '/7BCTdekbLF2vFBuJgj3g3q5jxZL.jpg',
        backdrop_path: '/7eccX0Bw6d0XZCo0gqZijDBA90t.jpg',
        first_air_date: '2022-07-01',
        vote_average: 8.2,
        vote_count: 1500,
        genre_ids: [10759, 18],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'The Terminal List',
        popularity: 900,
        media_type: 'tv'
      }
    ];
  }
}

/**
 * Fetches shows from HBO Max
 */
export async function fetchHBOMaxContent(page: number = 1): Promise<TVShow[]> {
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

    // If still no results, get popular HBO shows as fallback
    if (!response.results || response.results.length === 0) {
      console.log('[TMDB] Using popular HBO shows as fallback...');
      response = await fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', {
        sort_by: 'popularity.desc',
        with_networks: '49', // HBO network ID
        page: 1,
        language: 'en-US',
        region: 'US'
      });
    }
    
    // Filter out any shows without poster images
    const shows = response.results?.filter(show => show.poster_path) || [];
    
    // Enhance shows with external IDs for direct linking
    const enhancedShows = await Promise.all(
      shows.map(async (show) => {
        try {
          const details = await fetchFromTMDB<TVShow & { external_ids?: { imdb_id?: string } }>(`/tv/${show.id}`, {
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
    // Return some hardcoded popular HBO shows as final fallback
    return [
      {
        id: 1399,
        name: 'Game of Thrones',
        overview: `Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond.`,
        poster_path: '/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg',
        backdrop_path: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
        first_air_date: '2011-04-17',
        vote_average: 8.4,
        vote_count: 20000,
        genre_ids: [10765, 18, 10759],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'Game of Thrones',
        popularity: 1500,
        media_type: 'tv'
      },
      {
        id: 60574,
        name: 'House of the Dragon',
        overview: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from such heights. In the case of the Targaryens, their slow fall begins when King Viserys breaks with a century of tradition by naming his daughter Rhaenyra heir to the Iron Throne. But when Viserys later fathers a son, the court is shocked when Rhaenyra retains her status as his heir, and seeds of division sow friction across the realm.',
        poster_path: '/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
        backdrop_path: '/etj8E2o0Bud0HkONVQPjyCkIvp3.jpg',
        first_air_date: '2022-08-21',
        vote_average: 8.5,
        vote_count: 4000,
        genre_ids: [10765, 18, 10759],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'House of the Dragon',
        popularity: 3000,
        media_type: 'tv'
      },
      {
        id: 1396,
        name: 'Breaking Bad',
        overview: `When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime.`,
        poster_path: '/3xnWaLQijOBmJlo2PMnJQgNUk4M.jpg',
        backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
        first_air_date: '2008-01-20',
        vote_average: 8.8,
        vote_count: 15000,
        genre_ids: [18],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'Breaking Bad',
        popularity: 2000,
        media_type: 'tv'
      },
      {
        id: 100088,
        name: 'The Last of Us',
        overview: 'Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone. What starts as a small job soon becomes a brutal, heartbreaking journey, as they both must traverse the United States and depend on each other for survival.',
        poster_path: '/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
        backdrop_path: '/2OMB0ifKhuV0G5CB0fCqFeUUr9R.jpg',
        first_air_date: '2023-01-15',
        vote_average: 8.7,
        vote_count: 5000,
        genre_ids: [10765, 18],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'The Last of Us',
        popularity: 3500,
        media_type: 'tv'
      },
      {
        id: 1408,
        name: 'The Wire',
        overview: 'Told from the points of view of both the Baltimore homicide and narcotics detectives and their targets, the series captures a universe in which the national war on drugs has become a permanent, self-sustaining bureaucracy, and distinctions between cops and criminals are often blurred.',
        poster_path: '/4lUQYa0z3F1qUWKhGMlGpXfZQfI.jpg',
        backdrop_path: '/lS5XvvUcwJm766JsfHBNiXHwKgv.jpg',
        first_air_date: '2002-06-02',
        vote_average: 8.5,
        vote_count: 1000,
        genre_ids: [18, 80],
        origin_country: ['US'],
        original_language: 'en',
        original_name: 'The Wire',
        popularity: 800,
        media_type: 'tv'
      }
    ];
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
    
    apiConfig = {
      images: {
        secure_base_url: config.images.secure_base_url,
        poster_sizes: config.images.poster_sizes,
        backdrop_sizes: config.images.backdrop_sizes
      }
    };
    
    console.log('[TMDB] Configuration loaded');
  } catch (error) {
    console.error('[TMDB] Failed to load configuration:', error);
  }
}

// Initialize the module
init().catch(console.error);

// Export all necessary types and interfaces
export type { TMDBResponse };
