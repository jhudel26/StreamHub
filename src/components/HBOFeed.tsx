'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, ChevronLeft, ChevronRight, Star, Loader2 } from 'lucide-react';
import { TVShow, fetchHBOMaxContent, getPosterUrl } from '@/lib/tmdb-fixed';

export default function HBOFeed() {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch shows from TMDB API with a random page
  useEffect(() => {
    const loadShows = async () => {
      try {
        setLoading(true);
        setError(null);
        // Generate a random page between 1 and 10 to get different results
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const data = await fetchHBOMaxContent(randomPage);
        // Shuffle the results for more variety
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setShows(shuffled.slice(0, 10)); // Take first 10 shuffled items
      } catch (err) {
        console.error('Error loading HBO Max shows:', err);
        setError('Failed to load HBO Max content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadShows();
  }, []);

  // Function to get streaming URL based on show data
  const getStreamingUrl = (show: TVShow): string => {
    // Always use the search URL format
    const searchQuery = encodeURIComponent(show.name.trim().replace(/\s+/g, '+'));
    return `https://play.hbomax.com/search/result?q=${searchQuery}`;
  };

  // Handle show click - opens HBO Max page in new tab
  const handleContentClick = (e: React.MouseEvent, show: TVShow) => {
    e.preventDefault();
    e.stopPropagation();
    const streamingUrl = getStreamingUrl(show);
    window.open(streamingUrl, '_blank', 'noopener,noreferrer');
    return false;
  };

  // Carousel navigation with smooth scrolling
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const items = container.querySelectorAll('.carousel-item');
    
    if (index >= 0 && index < items.length) {
      const item = items[index] as HTMLElement;
      const scrollPosition = item.offsetLeft - container.offsetLeft - 16; // 16px padding
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      
      setCurrentIndex(index);
    }
  }, []);

  const handlePrev = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : shows.length - 1;
    scrollToIndex(newIndex);
  }, [currentIndex, shows.length, scrollToIndex]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex < shows.length - 1 ? currentIndex + 1 : 0;
    scrollToIndex(newIndex);
  }, [currentIndex, shows.length, scrollToIndex]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-gray-900/50 rounded-xl mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">HBO Max</h2>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 h-72 bg-gray-800/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-900/20 rounded-xl mt-8">
        <h2 className="text-xl font-bold text-white mb-2">HBO Max</h2>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }
  
  // No shows found
  if (shows.length === 0) {
    return (
      <div className="p-6 bg-gray-900/50 rounded-xl mt-8">
        <h2 className="text-xl font-bold text-white mb-2">HBO Max</h2>
        <p className="text-gray-400">No shows found</p>
      </div>
    );
  }

  return (
    <div className="relative p-6 bg-gray-900/50 rounded-xl mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">HBO Max</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors"
            aria-label="Previous show"
          >
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors"
            aria-label="Next show"
          >
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex space-x-4">
          <AnimatePresence>
            {shows.map((show, index) => (
              <motion.div
                key={show.id}
                className="carousel-item flex-shrink-0 w-48 cursor-pointer group"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={(e) => handleContentClick(e, show)}
              >
                <div className="relative rounded-lg overflow-hidden bg-gray-800/50 h-full transition-transform duration-300 group-hover:scale-105">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                      src={getPosterUrl(show.poster_path, 'w500')}
                      alt={show.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-tv.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 bg-black/60 rounded-full">
                        <PlayCircle className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">{show.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white truncate">{show.name}</h3>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <span>{new Date(show.first_air_date).getFullYear()}</span>
                      {show.origin_country && show.origin_country.length > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="truncate">{show.origin_country[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
