'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import YouTubeFeed from './YouTubeFeed';

type MediaItem = {
  Id: string;
  Name: string;
  Type: 'Movie' | 'Series' | 'TV Show';
  ImageTags?: {
    Primary?: string;
    Banner?: string;
    Logo?: string;
    Thumb?: string;
  };
  BackdropImageTags?: string[];
  Overview?: string;
  ProductionYear?: number;
  RunTimeTicks?: number;
  SeriesName?: string;
  SeasonName?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
};

interface Props {
  service: string;
  apiKey?: string;
  serverUrl: string;
  userId: string;
  youtubeApiKey?: string;
};

export default function FeaturedContent({ service, apiKey = '', serverUrl, userId, youtubeApiKey }: Props) {
  // State hooks
  const [featuredItems, setFeaturedItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Constants
  const itemsPerPage = 5; // Number of items visible at once
  const totalSlides = Math.ceil(featuredItems.length / itemsPerPage);
  
  // Memoized callbacks
  const scrollToSlide = useCallback((direction: 'prev' | 'next') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = 300; // Fixed scroll amount in pixels
    
    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }, []);
  
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const itemWidth = container.firstElementChild?.clientWidth || 0;
    const scrollPosition = container.scrollLeft;
    const currentIndex = Math.round(scrollPosition / (itemWidth + 24));
    
    setCurrentSlide(currentIndex);
  }, []);
  
  const handleItemClick = useCallback(async (item: MediaItem) => {
    if (service !== 'Jellyfin' || !serverUrl || !apiKey) return;
    
    try {
      // Get the base URL without any trailing slashes
      const baseUrl = serverUrl.replace(/\/+$/, '');
      
      // First, get the server info to get the correct server ID
      const response = await fetch(`${baseUrl}/System/Info/Public`, {
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch server info');
      }
      
      const serverInfo = await response.json();
      const serverId = serverInfo.Id;
      
      if (!serverId) {
        throw new Error('Could not determine server ID');
      }
      
      // Format: http://server:port/web/#/details?id=ITEM_ID&serverId=SERVER_ID
      const itemUrl = `${baseUrl}/web/#/details?id=${item.Id}&serverId=${serverId}`;
      
      // Open directly to the details page
      window.open(itemUrl, '_blank');
    } catch (error) {
      console.error('Error getting server info:', error);
      // Fallback to the user ID if we can't get the server ID
      const baseUrl = serverUrl.replace(/\/+$/, '');
      const itemUrl = `${baseUrl}/web/#/details?id=${item.Id}&serverId=${userId}`;
      window.open(itemUrl, '_blank');
    }
  }, [service, serverUrl, userId]);
  
  // Helper function
  const truncateText = useCallback((text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  // Function to shuffle array using Fisher-Yates algorithm
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  // Function to get a random sort order
  const getRandomSortOrder = useCallback(() => {
    const sortOptions = [
      { field: 'Random', order: 'Ascending' },
      { field: 'DateCreated', order: 'Descending' },
      { field: 'DatePlayed', order: 'Descending' },
      { field: 'PremiereDate', order: 'Descending' },
      { field: 'DateAdded', order: 'Descending' },
      { field: 'PlayCount', order: 'Descending' },
      { field: 'CommunityRating', order: 'Descending' },
      { field: 'CriticRating', order: 'Descending' },
    ];
    return sortOptions[Math.floor(Math.random() * sortOptions.length)];
  }, []);

  useEffect(() => {
    const fetchJellyfinContent = async () => {
      if (service !== 'Jellyfin' || !apiKey || !serverUrl || !userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const headers = {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        };

        // First, get the list of libraries
        const librariesResponse = await fetch(
          `${serverUrl.replace(/\/$/, '')}/Users/${userId}/Views`,
          { headers }
        );

        if (!librariesResponse.ok) {
          throw new Error('Failed to fetch libraries');
        }

        const librariesData = await librariesResponse.json();
        const movieLibraries = (librariesData.Items || []).filter(
          (lib: any) => (lib.CollectionType === 'movies' || lib.CollectionType === 'tvshows') && 
                       !lib.Name.toLowerCase().includes('collection')
        );

        if (movieLibraries.length === 0) {
          throw new Error('No movie or TV show libraries found');
        }

        // Get a random sort order for this fetch
        const sort = getRandomSortOrder();
        console.log(`Sorting by ${sort.field} in ${sort.order} order`);
        
        // Fetch items from each library in parallel with random sorting
        const libraryItemsPromises = movieLibraries.map(async (library: any) => {
          const isMovie = library.CollectionType === 'movies';
          const limit = Math.floor(Math.random() * 10) + 10; // Random limit between 10-20
          const startIndex = Math.floor(Math.random() * 20); // Random start index for pagination
          
          try {
            const response = await fetch(
              `${serverUrl.replace(/\/$/, '')}/Users/${userId}/Items` +
              `?ParentId=${library.Id}` +
              '&Recursive=true' +
              `&IncludeItemTypes=${isMovie ? 'Movie' : 'Series'}` +
              `&SortBy=${sort.field}` +
              `&SortOrder=${sort.order}` +
              `&Limit=${limit}` +
              `&StartIndex=${startIndex}` +
              '&ExcludeItemTypes=BoxSet,CollectionFolder' +
              '&Fields=PrimaryImageAspectRatio,MediaSources,Overview,People,Chapters' +
              `&_t=${Date.now()}`, // Cache buster
              { 
                headers,
                cache: 'no-store' // Prevent browser caching
              }
            );
            
            if (!response.ok) {
              console.warn(`Failed to fetch items for library ${library.Name} (${library.Id})`);
              return { Items: [] };
            }
            
            const data = await response.json();
            // Filter out any collection items that might have been returned
            if (data.Items) {
              data.Items = data.Items.filter((item: any) => 
                item && 
                !item.CollectionType && 
                !item.Type?.toLowerCase().includes('collection') &&
                !item.Name?.toLowerCase().includes('collection') &&
                item.Id && item.Name
              );
              
              // Shuffle the items for this library
              data.Items = shuffleArray(data.Items);
            }
            return data;
          } catch (error) {
            console.error(`Error fetching items for library ${library.Name}:`, error);
            return { Items: [] };
          }
        });

        const libraryItems = await Promise.all(libraryItemsPromises);
        
        // Combine, deduplicate, and limit results
        const seenIds = new Set();
        const allItems = shuffleArray(
          libraryItems
            .flatMap((data) => data.Items || [])
            .filter((item: any) => {
              if (!item || !item.Id || seenIds.has(item.Id)) return false;
              seenIds.add(item.Id);
              return true;
            })
            .map((item: any) => ({
              ...item,
              Type: item.Type === 'Movie' ? 'Movie' : 'TV Show' as const,
              _sortScore: Math.random() // Add a random score for final sorting
            }))
            .sort((a: any, b: any) => a._sortScore - b._sortScore)
            .slice(0, 25)
        );

        setFeaturedItems(allItems);
      } catch (error) {
        console.error('Error fetching Jellyfin content:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch content');
      } finally {
        setIsLoading(false);
      }
    };

    if (service === 'Jellyfin') {
      fetchJellyfinContent();
    } else {
      setIsLoading(false);
    }
  }, [service, apiKey, serverUrl, userId]);

  // Handle YouTube content
  if (service === 'YouTube') {
    return <YouTubeFeed />;
  }

  // Handle loading and error states
  // Skeleton loader
  const SkeletonLoader = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-800/50 rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-[2/3] bg-gradient-to-br from-teal-500/20 to-cyan-500/20" />
          <div className="p-4">
            <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6 text-white/90">Featured Content</h2>
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <h3 className="text-red-300 text-lg font-medium mb-2">Error Loading Content</h3>
        <p className="text-red-400/90 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle Jellyfin content display with carousel
  if (service === 'Jellyfin') {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6 px-6 text-white/90">Jellyfin Featured Content</h2>
        <div className="relative group">
          {/* Left navigation button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollBy({ left: -300, behavior: 'smooth' });
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Previous items"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Carousel container */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide snap-x snap-mandatory px-14"
            style={{ scrollBehavior: 'smooth' }}
          >
            {featuredItems.map((item) => (
              <div 
                key={item.Id}
                className="flex-none w-64 snap-start"
              >
                <div 
                  className="group relative overflow-hidden rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-teal-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10 h-full"
                  onClick={() => handleItemClick(item)}
                >
              <div className="aspect-[2/3] relative overflow-hidden">
                {item.ImageTags?.Primary ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={`${serverUrl}/Items/${item.Id}/Images/Primary?maxHeight=450&quality=90`}
                      alt={item.Name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Instead of setting a placeholder image, we'll let the parent div handle the fallback
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-cyan-500/20';
                          fallback.innerHTML = '<span class="text-gray-400">No Image</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-sm text-teal-300 font-medium">
                      {item.Type} • {item.ProductionYear || 'N/A'}
                    </p>
                    {item.Overview && (
                      <p className="text-sm text-gray-200 mt-1 line-clamp-3">
                        {truncateText(item.Overview, 120)}
                      </p>
                    )}
                  </div>
                </div>
                {/* Floating play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform duration-200 shadow-lg">
                    <svg className="w-6 h-6 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                  {item.Name}
                </h3>
                <div className="flex items-center mt-1 text-xs text-gray-400">
                  <span className="inline-flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    {item.Type}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{item.ProductionYear || 'N/A'}</span>
                </div>
              </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Right navigation button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollBy({ left: 300, behavior: 'smooth' });
              }
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Next items"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return <div className="text-center py-8">Select a service to view featured content</div>;
}