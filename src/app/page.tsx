"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { Film, Play, Tv, Popcorn, Search, Settings, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import SettingsModal from '../components/SettingsModal';

// Dynamically import components with no SSR
const FeaturedContent = dynamic(
  () => import('../components/FeaturedContent'),
  { ssr: false }
);

const YouTubeFeed = dynamic(
  () => import('../components/YouTubeFeed'),
  { ssr: false }
);

const PrimeVideoFeed = dynamic(
  () => import('../components/PrimeVideoFeed'),
  { ssr: false }
);

const HBOFeed = dynamic(
  () => import('../components/HBOFeed'),
  { ssr: false }
);

const streamingServices = [
  { 
    name: "Jellyfin", 
    icon: Film, 
    color: "#00A4DC",
    description: "Your personal media library"
  },
  { 
    name: "YouTube", 
    icon: Play, 
    color: "#FF0000",
    description: "Videos, music, and originals"
  },
  { 
    name: "Prime Video", 
    icon: Tv, 
    color: "#00A8E1",
    description: "Movies, TV, and Amazon Originals"
  },
  { 
    name: "HBO Max", 
    icon: Popcorn, 
    color: "#87189D",
    description: "Stream HBO, DC, and more"
  }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{query: string, results: any[]} | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [jellyfinSettings, setJellyfinSettings] = useState({
    serverUrl: '',
    apiKey: '',
    userId: ''
  });

  const handleSaveSettings = (newSettings: {
    serverUrl: string;
    apiKey: string;
    userId: string;
  }) => {
    setJellyfinSettings(newSettings);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('jellyfinSettings', JSON.stringify(newSettings));
    }
  };

  // Load settings on component mount
  useEffect(() => {
    const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('jellyfinSettings') : null;
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setJellyfinSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      setSearchResults({
        query: searchQuery,
        results: []
      });
      alert(`Searching for: ${searchQuery}\n\nThis is a demo. In a real app, this would search across all your streaming services.`);
    }
  };

  const findJellyfinUserId = async () => {
    try {
      if (!jellyfinSettings.serverUrl || !jellyfinSettings.apiKey) {
        throw new Error('Please configure Jellyfin server URL and API key in settings');
      }
      
      const response = await fetch(`${jellyfinSettings.serverUrl}/Users/Public`, {
        headers: {
          'X-Emby-Token': jellyfinSettings.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const users = await response.json();
      if (users && users.length > 0) {
        // Try to find the admin user first, or use the first user
        const adminUser = users.find((user: any) => user.Policy?.IsAdministrator) || users[0];
        return adminUser.Id;
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error finding Jellyfin user ID:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleServiceClick = (serviceName: string) => {
    console.log(`Selected service: ${serviceName}`);
    setSelectedService(serviceName);
    
    // Scroll to the selected service's content section
    const sectionId = `${serviceName.toLowerCase().replace(/\s+/g, '-')}-content`;
    
    // Use setTimeout to ensure the state updates and components are rendered
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        const headerOffset = 100; // Adjust this value based on your header height
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    // If it's Jellyfin, verify we have a user ID
    if (serviceName === 'Jellyfin' && !jellyfinSettings.userId) {
      findJellyfinUserId()
        .then(userId => {
          if (userId) {
            // Update the settings with the found user ID
            handleSaveSettings({
              ...jellyfinSettings,
              userId: userId
            });
            alert(`Found Jellyfin user ID: ${userId}`);
          } else {
            throw new Error('Could not find a valid user ID');
          }
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error:', errorMessage);
          alert(`Error connecting to Jellyfin: ${errorMessage}\nPlease check your server URL and API key.`);
        });
    }
  };

  const handleOpenService = (serviceName: string) => {
    const serviceUrl = getServiceUrl(serviceName);
    if (serviceUrl) {
      window.open(serviceUrl, '_blank');
    }
  };

  const getServiceUrl = (serviceName: string): string | null => {
    const urls: {[key: string]: string} = {
      'Jellyfin': jellyfinSettings.serverUrl || '',
      'YouTube': 'https://youtube.com',
      'Prime Video': 'https://www.primevideo.com',
      'HBO Max': 'https://www.max.com'
    };
    return urls[serviceName] || null;
  };

  // Function to test Jellyfin connection
  const testJellyfinConnection = async () => {
    if (!jellyfinSettings.serverUrl || !jellyfinSettings.apiKey) {
      console.log('Jellyfin server URL or API key not configured');
      return;
    }
    
    try {
      const response = await fetch(`${jellyfinSettings.serverUrl}/System/Info/Public`, {
        headers: {
          'X-Emby-Token': jellyfinSettings.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Jellyfin server info:', data);
        alert(`Successfully connected to Jellyfin server!\nVersion: ${data.Version}\nServer Name: ${data.ServerName}`);
      } else {
        throw new Error(`Failed to connect: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error connecting to Jellyfin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error connecting to Jellyfin: ${errorMessage}`);
    }
  };

  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Call test connection on component mount
  useEffect(() => {
    // Test Jellyfin connection when component mounts
    testJellyfinConnection();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#111827" />
        </Head>
        <div className="max-w-7xl mx-auto relative">
          <motion.header 
            className="mb-12 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
                StreamHub
              </h1>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="absolute right-0 top-0 p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Settings"
              >
                <Settings size={24} />
              </button>
            </div>
            <p className="text-gray-400 text-lg">Your unified streaming dashboard</p>
          </motion.header>

          <div className="mt-12 max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across all services..."
                  className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-full py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent border border-gray-700/50 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white p-2 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
              {searchResults && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center text-cyan-400 text-sm"
                >
                  Search results for: <span className="font-medium">{searchResults.query}</span>
                </motion.div>
              )}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {streamingServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  borderColor: selectedService === service.name ? `${service.color}80` : `${service.color}40`,
                  boxShadow: selectedService === service.name 
                    ? `0 8px 30px -5px ${service.color}40` 
                    : `0 4px 30px -10px ${service.color}20`
                }}
                whileHover={{ y: -5 }}
                transition={{ 
                  delay: 0.1 + (index * 0.1),
                  type: "spring",
                  stiffness: 400,
                  damping: 10
                }}
                className={`group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border flex flex-col items-center text-center ${selectedService === service.name ? 'scale-105' : ''}`}
                style={{
                  borderColor: selectedService === service.name ? `${service.color}80` : `${service.color}40`,
                  boxShadow: selectedService === service.name 
                    ? `0 8px 30px -5px ${service.color}40` 
                    : `0 4px 30px -10px ${service.color}20`
                }}
                onClick={() => handleServiceClick(service.name)}
              >
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${service.color}15`,
                    boxShadow: `0 4px 20px -5px ${service.color}30`
                  }}
                >
                  <service.icon 
                    className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" 
                    style={{ 
                      color: service.color,
                      filter: `drop-shadow(0 0 8px ${service.color}40)`
                    }} 
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                  {service.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {service.description}
                </p>
                <div className="mt-auto w-full">
                  <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent transition-all duration-500 mb-2"></div>
                  <div className="flex justify-between items-center">
                    <button 
                      className="text-sm font-medium text-cyan-400 hover:text-white transition-colors duration-300 flex items-center group/button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenService(service.name);
                      }}
                    >
                      Open {service.name.split(' ')[0]}
                      <span className="ml-1 opacity-0 -translate-x-2 group-hover/button:opacity-100 group-hover/button:translate-x-1 transition-all duration-300">
                        →
                      </span>
                    </button>
                    {selectedService === service.name && (
                      <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Featured Content Section */}
          <div id="featured-content" className="mt-12 space-y-16">
            {/* Jellyfin Section */}
            <div id="jellyfin-content" className={!jellyfinSettings.serverUrl ? 'hidden' : ''}>
              <FeaturedContent 
                service="Jellyfin"
                serverUrl={jellyfinSettings.serverUrl}
                apiKey={jellyfinSettings.apiKey}
                userId={jellyfinSettings.userId}
              />
            </div>
            
            {/* YouTube Feed */}
            <div id="youtube-content" className="mt-12">
              <YouTubeFeed />
            </div>

            {/* Prime Video Feed */}
            <div id="prime-video-content" className="mt-12">
              <PrimeVideoFeed />
            </div>

            {/* HBO Feed */}
            <div id="hbo-max-content" className="mt-12">
              <HBOFeed />
            </div>
          </div>
          {!selectedService && (
            <div className="py-12">
              {/* Empty div to maintain spacing */}
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-lg z-50 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50"
            aria-label="Scroll to top"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={jellyfinSettings}
        onSave={handleSaveSettings}
      />
    </>
  );
}
