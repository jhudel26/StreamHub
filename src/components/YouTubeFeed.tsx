'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SignInButton } from './SignInButton';
import { motion } from 'framer-motion';

// Cache configuration
const CACHE_KEY = 'youtube_videos_cache';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
}

export default function YouTubeFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { data: session, status } = useSession();

  // Fallback data in case API fails
  const fallbackVideos: Video[] = [
    {
      id: { videoId: 'dQw4w9WgXcQ' },
      snippet: {
        title: 'Never Gonna Give You Up',
        channelTitle: 'Rick Astley',
        publishedAt: '2009-10-25T06:56:07Z',
        thumbnails: {
          high: {
            url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
          }
        }
      }
    }
  ];

  // Fetch videos from our API endpoint
  const fetchVideos = useCallback(async (forceRefresh = false) => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_TTL) {
            setVideos(data);
            setLoading(false);
            return;
          }
        }
      }

      // Use our API endpoint
      const response = await fetch('/api/youtube');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch YouTube videos');
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Transform the response to match our Video interface
        const videos = data.items.map((item: any) => ({
          id: { videoId: item.id },
          snippet: {
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            thumbnails: {
              high: {
                url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url
              }
            }
          }
        }));
        
        setVideos(videos);
        
        // Cache the response
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: videos,
            timestamp: Date.now()
          })
        );
      }
    } catch (err) {
      console.error('Error fetching YouTube videos:', err);
      setError('Failed to load YouTube content. Please try again later.');
      
      // If we have cached data, use it as fallback
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        setVideos(data);
      } else {
        // If no cache, use fallback data
        setVideos(fallbackVideos);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  // Initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchVideos();
    }
  }, [status, fetchVideos]);

  // Handle refresh
  const handleRefresh = () => {
    if (status === 'authenticated') {
      setRefreshing(true);
      fetchVideos(true);
    }
  };

  // Navigation functions
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= Math.ceil(videos.length / 4) - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? Math.ceil(videos.length / 4) - 1 : prevIndex - 1
    );
  };

  // Calculate visible videos
  const visibleVideos = videos.slice(currentIndex * 4, (currentIndex * 4) + 4);

  if (status === 'loading') {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">YouTube</h2>
        <p className="text-gray-400 mb-4">Sign in to view your YouTube feed</p>
        <SignInButton />
      </div>
    );
  }

  if (loading && !videos.length) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading YouTube content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center mx-auto"
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <RefreshCw className="animate-spin mr-2 h-4 w-4" />
              Refreshing...
            </>
          ) : (
            'Try Again'
          )}
        </button>
      </div>
    );
  }

  return (
    <section className="py-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">YouTube</h2>
        <button
          onClick={handleRefresh}
          className="text-cyan-400 hover:text-cyan-300 flex items-center text-sm"
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <RefreshCw className="animate-spin mr-1 h-4 w-4" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800/80 rounded-full p-2 text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleVideos.map((video) => (
              <motion.div
                key={video.id.videoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group relative rounded-lg overflow-hidden bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.snippet.thumbnails.high.url}
                      alt={video.snippet.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-white line-clamp-2 mb-1">
                      {video.snippet.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {video.snippet.channelTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(video.snippet.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800/80 rounded-full p-2 text-white"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}