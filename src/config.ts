// src/config.ts
const defaultConfig = {
  jellyfin: {
    serverUrl: '',
    apiKey: '',
    userId: ''
  }
};

// Try to load settings from localStorage
const loadSettings = () => {
  if (typeof window === 'undefined') {
    return defaultConfig.jellyfin;
  }
  
  try {
    const savedSettings = localStorage.getItem('jellyfinSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultConfig.jellyfin;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultConfig.jellyfin;
  }
};

export const config = {
  jellyfin: loadSettings()
};