import { Platform } from 'react-native';

// Replace with your server's backend base URL.
// - Auto-resolves to http://10.0.2.2:8000 for Android Emulator
// - Auto-resolves to http://localhost:8000 for iOS Simulator or Web Browser
export const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';
