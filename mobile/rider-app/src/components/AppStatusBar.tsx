import React from 'react';
import { StatusBar, StatusBarProps, Platform, View, StyleSheet } from 'react-native';

interface AppStatusBarProps extends StatusBarProps {
  backgroundColor?: string;
}

/**
 * Universal status bar component that ensures consistent behavior across the app
 */
export default function AppStatusBar({ 
  backgroundColor = '#f29f05', 
  barStyle = 'light-content',
  ...props 
}: AppStatusBarProps) {
  
  return (
    <View style={[styles.statusBar, { backgroundColor }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={barStyle}
        {...props}
      />
    </View>
  );
}

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

const styles = StyleSheet.create({
  statusBar: {
    height: STATUSBAR_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Ensure it's above everything
  },
});

/**
 * Returns the current status bar height for use in padding calculations
 */
export const getStatusBarHeight = () => STATUSBAR_HEIGHT;
