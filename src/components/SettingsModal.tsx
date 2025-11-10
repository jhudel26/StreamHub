'use client';

import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

export interface JellyfinSettings {
  serverUrl: string;
  apiKey: string;
  userId: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: JellyfinSettings) => void;
  settings: JellyfinSettings;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onSave,
  settings: initialSettings 
}: SettingsModalProps) {
  const [settings, setSettings] = useState<JellyfinSettings>({
    serverUrl: '',
    apiKey: '',
    userId: ''
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Jellyfin Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Jellyfin Server URL
            </label>
            <input
              type="url"
              value={settings.serverUrl}
              onChange={(e) => setSettings({...settings, serverUrl: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="http://your-jellyfin-server:8096"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="Your API Key"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={settings.userId}
              onChange={(e) => setSettings({...settings, userId: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="Your User ID"
              required
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
