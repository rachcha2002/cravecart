import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

interface StatusBarManagerProps {
  mode?: 'light' | 'dark';
  backgroundColor?: string;
}

export default function StatusBarManager({ 
  mode = 'light',
  backgroundColor = 'transparent'
}: StatusBarManagerProps) {
  const isFocused = useIsFocused();
  
  useEffect(() => {
    if (isFocused) {
      // Set consistent translucent status bar across the entire app
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor(backgroundColor);
      }
      
      // Set status bar style based on mode
      StatusBar.setBarStyle(mode === 'light' ? 'light-content' : 'dark-content');
      
      // Ensure cleanup to prevent conflicts
      return () => {
        // Don't modify translucency on unmount to maintain consistent behavior
        // Only reset if navigating out of the app
      };
    }
  }, [isFocused, mode, backgroundColor]);
  
  return null;
}
