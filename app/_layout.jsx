import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import store from '../redux/store';
import { I18nextProvider } from 'react-i18next';
import i18n from '../data/i18n'; // Import i18n configuration
import { initDatabase } from '../data/database';
import { useEffect } from 'react';
import checkTodayEvents, { setupNotificationListener } from "../components/Notifications";
 
export default function RootLayout() {
  useEffect(() => {
    // Initialize database when app starts
    initDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
    });

    // Wait a moment for Redux to initialize before checking events
    const timer = setTimeout(() => {
      checkTodayEvents();
    }, 1000);

    // Setup notification response listener
    const subscription = setupNotificationListener();

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(screens)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </I18nextProvider>
    </Provider>
  );
}

