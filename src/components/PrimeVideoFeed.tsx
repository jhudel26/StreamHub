'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, ChevronLeft, ChevronRight, Star, ExternalLink } from 'lucide-react';
import { fetchPrimeVideos, getPosterUrl, TVShow } from '@/lib/tmdb-fixed';

// Function to get streaming URL based on show name
function getStreamingUrl(show: TVShow): string {
  // Format the show name for URL
  const formattedName = show.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
    
  return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(show.name)}&ie=UTF8`;
}

export default function PrimeVideoFeed() {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch shows from TMDB API with a random page
  useEffect(() => {
    const loadShows = async () => {
      try {
        // Generate a random page between 1 and 10 to get different results
        const randomPage = Math.floor(Math.random() * 10) + 1;
        setLoading(true);
        const data = await fetchPrimeVideos(randomPage);
        // Shuffle the results for more variety
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setShows(shuffled.slice(0, 10)); // Take first 10 shuffled items
        console.log('Prime Video shows:', data); // Debug log
      } catch (err) {
        console.error('Error fetching Prime Video shows:', err);
        setError('Failed to load Prime Video content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadShows();
  }, []);

  const handleContentClick = (show: TVShow) => {
    const streamingUrl = getStreamingUrl(show);
    window.open(streamingUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/500x750/1a1a2e/e94560?text=No+Image';
    target.onerror = null; // Prevent infinite loop if placeholder also fails
  };

  // Carousel navigation
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : shows.length - 1));
  }, [shows.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < shows.length - 1 ? prev + 1 : 0));
  }, [shows.length]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Prime Video</h2>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 h-72 bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 rounded-lg">
        <h2 className="text-xl font-bold mb-2 text-white">Prime Video</h2>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative p-4 bg-gray-900 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Prime Video</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {shows.length} {shows.length === 1 ? 'show' : 'shows'} available
          </span>
          <div className="flex space-x-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="flex overflow-x-auto pb-4 -mx-2 scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {shows.map((show, index) => (
            <motion.div
              key={show.id}
              className="flex-shrink-0 w-48 mx-2 cursor-pointer group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleContentClick(show)}
            >
              <div className="relative overflow-hidden rounded-lg h-72">
                <img
                  src={getPosterUrl(show.poster_path)}
                  alt={show.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={handleImageError}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="text-white">
                    <h3 className="font-semibold line-clamp-2">{show.name}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-300">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      {show.vote_average?.toFixed(1) || 'N/A'}
                      {show.first_air_date && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{new Date(show.first_air_date).getFullYear() || 'N/A'}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-xs text-blue-300">
                      <span>Watch on Prime Video</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
