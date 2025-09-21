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

// New function for generating in-app notifications/tasks
export const generateInAppNotifications = (events, t) => {
  if (!events || events.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newNotifications = [];

  events.forEach(event => {
    if (event.status !== 'pending') return;

    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    // --- Rule: Upcoming Delivery (15-day window) ---
    if (event.type === 'delivery' && eventDate >= today) {
      const timeDiff = eventDate.getTime() - today.getTime();
      const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
      if (timeDiff <= fifteenDaysInMs) {
        const daysRemaining = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        let message = daysRemaining === 0
          ? t('deliveryDueToday')
          : t('deliveryUpcoming', { days: daysRemaining });

        newNotifications.push({
          id: `delivery-reminder-${event.id}`,
          message: message,
          date: event.date,
          event: event,
        });
      }
    }

    // --- Rule: Insemination Follow-up (21 days after event) ---
    if (event.type === 'insemination') {
      const checkupDate = new Date(eventDate);
      checkupDate.setDate(eventDate.getDate() + 21);
      checkupDate.setHours(0, 0, 0, 0);
      if (today.getTime() === checkupDate.getTime()) {
        newNotifications.push({
          id: `insem-check-${event.id}`,
          message: t('inseminationCheckupDue'),
          date: today.toISOString(),
          event: event,
        });
      }
    }

    // --- Rule: General Event Due Today (created in the past) ---
    const createdAtString = event.createdAt ? event.createdAt.replace(' ', 'T') + 'Z' : new Date(0).toISOString();
    const createdAtDate = new Date(createdAtString);
    createdAtDate.setHours(0, 0, 0, 0);
    if (eventDate.getTime() === today.getTime() && createdAtDate.getTime() < today.getTime() && !newNotifications.some(n => n.event.id === event.id)) {
      newNotifications.push({ id: `due-today-${event.id}`, message: t('eventDueToday', { eventType: t(event.type) }), date: event.date, event: event });
    }
  });

  return newNotifications.sort((a, b) => new Date(a.date) - new Date(b.date));
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