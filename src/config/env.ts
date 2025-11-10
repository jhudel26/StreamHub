// This file makes environment variables available at runtime

// Simple function to get YouTube API key
export function getYouTubeApiKey(): string | undefined {
  // In browser, we can access the environment variable directly
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  }
  // On server side
  return process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
}

// Log environment status in development
if (process.env.NODE_ENV === 'development') {
  console.log('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    youTubeApiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY 
      ? '***' + process.env.NEXT_PUBLIC_YOUTUBE_API_KEY.slice(-4) 
      : 'Not set',
  });
}
