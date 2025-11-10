const TMDB_API_KEY = 'c1dd4a7d9aab18675dc3720ab5a99436';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params,
  });

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`TMDB API request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchPrimeVideos() {
  // Provider ID 119 is Amazon Prime Video
  const data = await fetchFromTMDB('/discover/tv', {
    with_watch_providers: '119',
    watch_region: 'US',
    sort_by: 'popularity.desc',
    page: '1',
    with_origin_country: 'US',
  });
  return data.results;
}

export async function fetchHBOMaxContent() {
  // Provider ID 384 is HBO Max
  const data = await fetchFromTMDB('/discover/tv', {
    with_watch_providers: '384',
    watch_region: 'US',
    sort_by: 'popularity.desc',
    page: '1',
    with_origin_country: 'US',
  });
  return data.results;
}

export function getPosterUrl(path: string | null, size: 'w200' | 'w300' | 'w500' = 'w300') {
  return path 
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : '/placeholder-tv.png';
}

export function getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780') {
  return path 
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : '/placeholder-backdrop.jpg';
}
