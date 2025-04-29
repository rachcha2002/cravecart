import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * Custom hook to ensure consistent status bar behavior
 * @param mode 'light' | 'dark' - Determines text color ('light' = white text, 'dark' = black text)
 * @param backgroundColor Background color of status bar (default: 'transparent')
 */
export function useStatusBarSetup(mode: 'light' | 'dark', backgroundColor: string = 'transparent') {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // Set translucent status bar and background color
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor(backgroundColor);
      }
      
      // Set text color
      StatusBar.setBarStyle(mode === 'light' ? 'light-content' : 'dark-content');
    }
    
    // No cleanup to maintain consistent behavior
  }, [isFocused, mode, backgroundColor]);
}
