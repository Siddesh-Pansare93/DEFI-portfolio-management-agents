import { useState, useEffect } from 'react';
import { UserPreferences } from '@/lib/types';

const STORAGE_KEY = 'defi_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  maxImpermanentLoss: 10,
  maxPositionSize: 70,
  riskAppetite: 'moderate',
  preferredActions: ['add_liquidity', 'swap', 'hold']
};

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferencesState({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch (e) {
          console.error('Failed to parse preferences:', e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  const setPreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferencesState(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return { preferences, setPreferences, isLoaded } as const;
}
