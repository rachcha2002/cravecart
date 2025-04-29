import { Platform, StatusBar } from 'react-native';

// Global configuration that should be applied consistently
export const setupStatusBar = () => {
  if (Platform.OS === 'android') {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
  }
};

// For screens with light backgrounds (like Orders)
export const setupLightStatusBar = () => {
  setupStatusBar();
  StatusBar.setBarStyle('dark-content');
};

// For screens with dark/colored backgrounds (like Home)
export const setupDarkStatusBar = () => {
  setupStatusBar();
  StatusBar.setBarStyle('light-content');
};

// For backward compatibility
export const configureTransparentStatusBar = setupDarkStatusBar;
