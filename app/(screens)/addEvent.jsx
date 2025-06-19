import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addEvent, updateEvent } from '../../redux/slices/eventSlice';
import { useTranslation } from 'react-i18next';
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchCows } from '../../redux/slices/cowSlice';

const AddEventScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useLocalSearchParams();
  const cows = useSelector(state => state.cows.cows);

  const isEditMode = params.editMode === 'true';
  const [eventType, setEventType] = useState(isEditMode ? params.eventType : '');
  const [description, setDescription] = useState(isEditMode ? params.eventDescription : '');
  const [date, setDate] = useState(isEditMode ? new Date(params.eventDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCowSelector, setShowCowSelector] = useState(false);
  const [selectedCows, setSelectedCows] = useState(isEditMode ? JSON.parse(params.eventCowIds) : []);

  useEffect(() => {
    dispatch(fetchCows());
  }, [dispatch]);

  // Handle pre-selection of cow when coming from cow details
  useEffect(() => {
    if (params.fromCowDetails && params.cowId) {
      setSelectedCows([params.cowId]);
    }
  }, [params.fromCowDetails, params.cowId]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Set time to start of day
      selectedDate.setHours(0, 0, 0, 0);
      setDate(selectedDate);
    }
  };

  const toggleCowSelection = (cowId) => {
    setSelectedCows(prev => {
      if (prev.includes(cowId)) {
        return prev.filter(id => id !== cowId);
      } else {
        return [...prev, cowId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedCows.length === cows.length) {
      setSelectedCows([]);
    } else {
      setSelectedCows(cows.map(cow => cow.id));
    }
  };

  const handleSubmit = async () => {
    if (!eventType) {
      Alert.alert(t('error'), t('eventTypeRequired'));
      return;
    }

    if (!date) {
      Alert.alert(t('error'), t('dateRequired'));
      return;
    }

    if (selectedCows.length === 0) {
      Alert.alert(t('error'), t('selectAtLeastOneCow'));
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        type: eventType,
        date: date.toISOString(),
        description,
        cowIds: selectedCows,
      };

      if (isEditMode) {
        await dispatch(updateEvent({ eventId: params.eventId, ...eventData })).unwrap();
        Alert.alert(t('success'), t('eventUpdatedSuccessfully'));
      } else {
        await dispatch(addEvent(eventData)).unwrap();
        Alert.alert(t('success'), t('eventAddedSuccessfully'));
      }
      router.back();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert(t('error'), error.message || (isEditMode ? t('failedToUpdateEvent') : t('failedToAddEvent')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="h-full w-full">
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="flex-row items-center p-4 bg-white shadow-md">
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text className="ml-4 text-lg font-semibold">{t('addEvent')}</Text>
        </View>

        {/* Form */}
        <ScrollView className="p-4">
          <TouchableOpacity
            className="bg-white p-4 rounded-lg mb-4"
            onPress={() => setShowCowSelector(true)}
          >
            <Text className="text-gray-600">
              {selectedCows.length > 0
                ? params.fromCowDetails && params.cowId
                  ? `${params.cowName || t('unnamed')} (${params.earTagNumber})`
                  : `${selectedCows.length} ${t('cowsSelected')}`
                : t('selectCows')}
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-700 font-semibold mb-2">{t('eventType')}</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300 mb-4"
            value={eventType}
            onChangeText={setEventType}
            placeholder={t('enterEventType')}
          />

          <Text className="text-gray-700 font-semibold mb-2">{t('date')}</Text>
          <TouchableOpacity
            className="bg-white p-3 rounded-lg border border-gray-300 mb-4"
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <Text className="text-gray-700 font-semibold mb-2">{t('description')}</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300 mb-4 h-32"
            value={description}
            onChangeText={setDescription}
            placeholder={t('enterDescription')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            className={`p-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? (isEditMode ? t('updating') : t('adding')) : (isEditMode ? t('updateEvent') : t('addEvent'))}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Cow Selector Modal */}
        <Modal
          visible={showCowSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCowSelector(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-4 max-h-[80%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold">{t('selectCows')}</Text>
                <TouchableOpacity onPress={() => setShowCowSelector(false)}>
                  <AntDesign name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>

              {/* Select All Button */}
              <TouchableOpacity
                className="bg-blue-100 p-3 rounded-lg mb-4"
                onPress={toggleSelectAll}
              >
                <Text className="text-blue-600 text-center font-semibold">
                  {selectedCows.length === cows.length
                    ? t('deselectAll')
                    : t('selectAll')}
                </Text>
              </TouchableOpacity>

              <ScrollView>
                {cows.map(cow => (
                  <TouchableOpacity
                    key={cow.id}
                    className={`p-4 border-b border-gray-200 ${
                      selectedCows.includes(cow.id) ? 'bg-blue-50' : ''
                    }`}
                    onPress={() => toggleCowSelection(cow.id)}
                  >
                    <Text className="text-gray-800">
                      {cow.name || cow.earTagNumber}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                className="bg-blue-500 p-4 rounded-lg mt-4"
                onPress={() => setShowCowSelector(false)}
              >
                <Text className="text-white text-center font-semibold">
                  {t('done')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default AddEventScreen;
