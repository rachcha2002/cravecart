import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StatusBar, StatusBarStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setupDarkStatusBar, setupLightStatusBar } from '../utils/statusBarConfig';

interface ScreenLayoutProps {
  children: ReactNode;
  headerColor?: string;
  barStyle?: StatusBarStyle;  // Use StatusBarStyle type
  style?: ViewStyle;
}

export default function ScreenLayout({
  children,
  headerColor = '#f29f05',
  barStyle = 'light-content',  // Default to light-content
  style,
}: ScreenLayoutProps) {
  
  // Configure status bar based on style prop
  React.useEffect(() => {
    if (barStyle === 'dark-content') {
      setupLightStatusBar();
    } else {
      setupDarkStatusBar();
    }
  }, [barStyle]);
  
  return (
    <SafeAreaView 
      style={[styles.container, style]} 
      edges={['left', 'right', 'bottom']}
    >
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  }
});
