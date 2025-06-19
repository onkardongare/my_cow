import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

const CattleFilter = ({ 
  visible, 
  onClose, 
  onApply, 
  breeds, 
  stages, 
  statuses,
  initialFilters = {}
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    breed: initialFilters.breed || '',
    stage: initialFilters.stage || '',
    status: initialFilters.status || '',
    dateOfBirth: initialFilters.dateOfBirth || null,
    dateOfBirthRange: initialFilters.dateOfBirthRange || 'all', // 'all', 'before', 'after'
    customDate: initialFilters.customDate || new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setFilters({
        breed: initialFilters.breed || '',
        stage: initialFilters.stage || '',
        status: initialFilters.status || '',
        dateOfBirth: initialFilters.dateOfBirth || null,
        dateOfBirthRange: initialFilters.dateOfBirthRange || 'all',
        customDate: initialFilters.customDate || new Date(),
      });
    }
  }, [visible, initialFilters]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilters(prev => ({ ...prev, customDate: selectedDate }));
    }
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      breed: '',
      stage: '',
      status: '',
      dateOfBirth: null,
      dateOfBirthRange: 'all',
      customDate: new Date(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-4 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold">{t('filterCattle')}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-[70vh]">
            {/* Breed Filter */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">{t('breed')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg mr-2 ${
                    filters.breed === '' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setFilters(prev => ({ ...prev, breed: '' }))}
                >
                  <Text className={filters.breed === '' ? 'text-white' : 'text-gray-700'}>
                    {t('all')}
                  </Text>
                </TouchableOpacity>
                {breeds.map((breed, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`px-4 py-2 rounded-lg mr-2 ${
                      filters.breed === breed ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    onPress={() => setFilters(prev => ({ ...prev, breed }))}
                  >
                    <Text className={filters.breed === breed ? 'text-white' : 'text-gray-700'}>
                      {t(breed) || breed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Stage Filter */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">{t('stage')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg mr-2 ${
                    filters.stage === '' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setFilters(prev => ({ ...prev, stage: '' }))}
                >
                  <Text className={filters.stage === '' ? 'text-white' : 'text-gray-700'}>
                    {t('all')}
                  </Text>
                </TouchableOpacity>
                {stages.map((stage, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`px-4 py-2 rounded-lg mr-2 ${
                      filters.stage === stage ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    onPress={() => setFilters(prev => ({ ...prev, stage }))}
                  >
                    <Text className={filters.stage === stage ? 'text-white' : 'text-gray-700'}>
                      {t(stage) || stage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Status Filter */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">{t('status')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg mr-2 ${
                    filters.status === '' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setFilters(prev => ({ ...prev, status: '' }))}
                >
                  <Text className={filters.status === '' ? 'text-white' : 'text-gray-700'}>
                    {t('all')}
                  </Text>
                </TouchableOpacity>
                {statuses.map((status, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`px-4 py-2 rounded-lg mr-2 ${
                      filters.status === status ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    onPress={() => setFilters(prev => ({ ...prev, status }))}
                  >
                    <Text className={filters.status === status ? 'text-white' : 'text-gray-700'}>
                      {t(status) || status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Date of Birth Filter */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">{t('dateOfBirth')}</Text>
              <View className="flex-row mb-2">
                <TouchableOpacity
                  className={`flex-1 px-4 py-2 rounded-lg mr-2 ${
                    filters.dateOfBirthRange === 'all' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setFilters(prev => ({ ...prev, dateOfBirthRange: 'all', dateOfBirth: null }))}
                >
                  <Text className={filters.dateOfBirthRange === 'all' ? 'text-white' : 'text-gray-700'}>
                    {t('all')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 px-4 py-2 rounded-lg mr-2 ${
                    filters.dateOfBirthRange === 'before' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setFilters(prev => ({ ...prev, dateOfBirthRange: 'before' }))}
                >
                  <Text className={filters.dateOfBirthRange === 'before' ? 'text-white' : 'text-gray-700'}>
                    {t('before')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    filters.dateOfBirthRange === 'after' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setFilters(prev => ({ ...prev, dateOfBirthRange: 'after' }))}
                >
                  <Text className={filters.dateOfBirthRange === 'after' ? 'text-white' : 'text-gray-700'}>
                    {t('after')}
                  </Text>
                </TouchableOpacity>
              </View>

              {filters.dateOfBirthRange !== 'all' && (
                <TouchableOpacity
                  className="bg-gray-200 p-3 rounded-lg"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className="text-gray-700">
                    {filters.customDate ? filters.customDate.toLocaleDateString() : t('selectDate')}
                  </Text>
                </TouchableOpacity>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={filters.customDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
          </ScrollView>

          <View className="flex-row justify-between mt-4">
            <TouchableOpacity
              className="bg-gray-200 px-6 py-3 rounded-lg"
              onPress={handleReset}
            >
              <Text className="text-gray-700 font-medium">{t('reset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-500 px-6 py-3 rounded-lg"
              onPress={handleApply}
            >
              <Text className="text-white font-medium">{t('apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CattleFilter; 