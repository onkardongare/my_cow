import * as Notifications from 'expo-notifications';
import { fetchEvents } from '../redux/slices/eventSlice';
import store from '../redux/store';
import * as Linking from 'expo-linking';

// Handle foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define navigation route for when notification is tapped
const EVENTS_DEEP_LINK = 'dairymanagement://tabs/events';

// Setup response listener - should be called in the app's initialization
export const setupNotificationListener = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    // When notification is clicked, deep link to events screen
    Linking.openURL(EVENTS_DEEP_LINK).catch(err => {
    });
  });
  
  return subscription;
};

const checkTodayEvents = async () => {
  try {
    // Dispatch the action directly from the store
    await store.dispatch(fetchEvents()).unwrap();
    
    // Get events from the store state
    const events = store.getState().events.events || [];


    if (!events || events.length === 0) {
      return;
    }

    // Format today's date as YYYY-MM-DD
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];


    const todayEvents = events.filter(event => {
      if (!event || !event.date) {
        return false;
      }
      
      try {
        // Handle different date formats
        let eventDate;
        if (typeof event.date === 'string') {
          // If it's already a string, try to extract the date part
          eventDate = event.date.split('T')[0];
        } else if (event.date instanceof Date) {
          // If it's a Date object, convert to ISO string and extract date
          eventDate = event.date.toISOString().split('T')[0];
        } else {
          return false;
        }
        
        return eventDate === todayFormatted;
      } catch (e) {
        return false;
      }
    });
    
    // Limit the number of notifications to 3
    const limitedEvents = todayEvents.slice(0, 3);

    // Cancel any existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule notifications for today's events
    for (const event of limitedEvents) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🐄 Cattle Event Today",
          body: `Don't forget: ${event.type} scheduled for today!`,
          data: { eventId: event.id },
        },
        trigger: { hour: 8, minute: 0, repeats: false }
      });
    }
    
  } catch (error) {
    console.error('Error checking today\'s events:', error);
  }
};

export default checkTodayEvents;