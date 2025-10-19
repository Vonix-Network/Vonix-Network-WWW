'use client';

import { createContext, useContext, useCallback } from 'react';
import { showLevelUpNotification, LevelUpData } from './level-up-toast';

interface XPNotificationContextType {
  notifyLevelUp: (data: LevelUpData) => void;
  checkForLevelUp: () => Promise<void>;
}

const XPNotificationContext = createContext<XPNotificationContextType | null>(null);

export function XPNotificationProvider({ children }: { children: React.ReactNode }) {
  const notifyLevelUp = useCallback((data: LevelUpData) => {
    showLevelUpNotification(data);
  }, []);

  const checkForLevelUp = useCallback(async () => {
    try {
      const response = await fetch('/api/xp/check-level-up');
      if (response.ok) {
        const data = await response.json();
        if (data.leveledUp) {
          notifyLevelUp({
            newLevel: data.newLevel,
            title: data.title,
            xp: data.xp,
            reward: data.reward,
          });
        }
      }
    } catch (error) {
      console.error('Error checking for level up:', error);
    }
  }, [notifyLevelUp]);

  return (
    <XPNotificationContext.Provider value={{ notifyLevelUp, checkForLevelUp }}>
      {children}
    </XPNotificationContext.Provider>
  );
}

export function useXPNotifications() {
  const context = useContext(XPNotificationContext);
  if (!context) {
    throw new Error('useXPNotifications must be used within XPNotificationProvider');
  }
  return context;
}
