import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, Image } from "react-native";
import { useState, useEffect } from "react";
import { AntDesign, Feather } from "@expo/vector-icons"; // Icons
import { icons } from "../../constants"
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { fetchEvents, updateEventStatus, deleteEvent } from '../../redux/slices/eventSlice';
import { fetchCows } from '../../redux/slices/cowSlice';

const EventsScreen = () => {
  const [selectedTab, setSelectedTab] = useState("Individual");
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  
  const events = useSelector(state => state.events.events) || [];
  const loading = useSelector(state => state.events.loading);
  const error = useSelector(state => state.events.error);
  const cows = useSelector(state => state.cows.cows) || [];

  const loadData = async () => {
    try {
      await dispatch(fetchCows()).unwrap();
      await dispatch(fetchEvents()).unwrap();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEventStatusChange = async (eventId, newStatus) => {
    try {
      await dispatch(updateEventStatus({ eventId, status: newStatus })).unwrap();
    } catch (error) {
      console.error('Error updating event status:', error);
      Alert.alert(t('error'), t('failedToUpdateEventStatus'));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await dispatch(deleteEvent(eventId)).unwrap();
      Alert.alert(t('success'), t('eventDeletedSuccessfully'));
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert(t('error'), error.message || t('failedToDeleteEvent'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('unknown');
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // New function to calculate days remaining
  const calculateDaysRemaining = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('dueToday');
    }
    return t('daysRemaining', { count: diffDays });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter for upcoming events and sort them by date (ascending)
  const upcomingEvents = [...events]
    .filter(event => {
      if (!event || !event.date) return false;
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Filter events based on the selected tab
  const filteredEvents = upcomingEvents.filter(event => {
    if (!event || !event.cowIds) return false;
    
    if (selectedTab === "Individual") {
      return event.cowIds.length === 1 || event.cowIds[0] === 'all';
    } else {
      return event.cowIds.length > 1;
    }
  });

  const renderEventCard = (event) => {
    if (!event || !event.cowIds) return null;
    const eventCows = cows.filter(cow => event.cowIds.includes(cow.id));
    const daysRemainingText = calculateDaysRemaining(event.date);
    return (
      <View key={event.id} className="bg-white p-4 rounded-lg mb-4 mx-4 shadow-sm">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-semibold flex-1">{t(event.type)}</Text>
          <View className="items-end">
            <Text className="text-gray-600">{formatDate(event.date)}</Text>
            {daysRemainingText && (
              <View className="bg-yellow-100 px-2 py-1 rounded-full mt-1">
                <Text className="text-yellow-800 text-xs font-semibold">{daysRemainingText}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View className="mb-2">
          <Text className="text-gray-600 font-semibold mb-1">
            {eventCows.length > 1 ? t('cows') : t('cow')}:
          </Text>
          {eventCows.map((cow, index) => (
            <Text key={cow.id} className="text-gray-600 ml-2">
              {index + 1}. {cow.name || cow.earTagNumber}
            </Text>
          ))}
        </View>

        {event.description && (
          <Text className="text-gray-600 mb-2">{event.description}</Text>
        )}

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-gray-600 mr-2">{t('status')}:</Text>
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg ${
                event.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
              }`}
              onPress={() =>
                handleEventStatusChange(
                  event.id,
                  event.status === 'pending' ? 'completed' : 'pending'
                )
              }
            >
              <Text
                className={`${
                  event.status === 'completed' ? 'text-green-700' : 'text-yellow-700'
                }`}
              >
                {t(event.status)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="bg-blue-100 p-2 rounded-lg"
              onPress={() => router.push({
                pathname: "/(screens)/addEvent",
                params: { 
                  editMode: true,
                  eventId: event.id,
                  eventType: event.type,
                  eventDate: event.date,
                  eventDescription: event.description,
                  eventCowIds: JSON.stringify(event.cowIds)
                }
              })}
            >
              <Feather name="edit-2" size={20} color="blue" />
            </TouchableOpacity>
            
            {event.status === 'completed' && (
              <TouchableOpacity
                className="bg-red-100 p-2 rounded-lg"
                onPress={() => {
                  Alert.alert(
                    t('confirmDelete'),
                    t('deleteEventConfirmation'),
                    [
                      {
                        text: t('cancel'),
                        style: 'cancel'
                      },
                      {
                        text: t('delete'),
                        style: 'destructive',
                        onPress: () => handleDeleteEvent(event.id)
                      }
                    ]
                  );
                }}
              >
                <Feather name="trash-2" size={20} color="red" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="w-full h-full">
      <View className="flex-1 bg-gray-100 ">
        {/* Header */}
        <View className="flex-row justify-between bg-green-400 p-4 items-center mb-4">
          <Text className="text-xl font-bold">{t('events')}</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white p-2 mx-4 rounded-lg shadow-md mb-4">
          <TouchableOpacity
            className={`flex-1 p-3 rounded-lg ${
              selectedTab === "Individual" ? "bg-teal-500" : "bg-white"
            }`}
            onPress={() => setSelectedTab("Individual")}
          >
            <Text
              className={`text-center ${
                selectedTab === "Individual" ? "text-white" : "text-black"
              }`}
            >
              {t('individual')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 p-3 rounded-lg ${
              selectedTab === "Mass" ? "bg-teal-500" : "bg-white"
            }`}
            onPress={() => setSelectedTab("Mass")}
          >
            <Text
              className={`text-center ${
                selectedTab === "Mass" ? "text-white" : "text-black"
              }`}
            >
              {t('mass')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <Text className="text-center text-gray-500 py-4">
              {t('loading')}...
            </Text>
          ) : error ? (
            <Text className="text-center text-red-500 py-4">{error}</Text>
          ) : filteredEvents.length === 0 ? (
            <View className="flex-1 justify-center items-center py-8">
              <Image source={icons.calendar} style={{ width: 100, height: 100 }} />
              <Text className="text-gray-600 mt-4 text-center">
                {t('addEventsMessage')}
              </Text>
            </View>
          ) : (
            filteredEvents.map(renderEventCard)
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          onPress={() => router.push("/(screens)/addEvent")}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EventsScreen;
