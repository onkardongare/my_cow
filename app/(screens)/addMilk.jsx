import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AntDesign } from "@expo/vector-icons";
import { addMilkRecord, updateMilkRecord, fetchMilkRecords } from '../../redux/slices/milkSlice';
import { fetchCows } from '../../redux/slices/cowSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddMilkScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCowSelector, setShowCowSelector] = useState(false);
  const [selectedCows, setSelectedCows] = useState([]);
  const [recordMode, setRecordMode] = useState('mass'); // 'mass' or 'individual'
  const { cows } = useSelector((state) => state.cows);
  const { records: milkRecords } = useSelector(state => state.milk);
  const [formData, setFormData] = useState({
    date: new Date(),
    cowIds: [],
    amTotal: '',
    pmTotal: '',
    totalProduced: '',
    milkRateAm: '',
    milkRatePm: '',
    totalIncome: ''
  });

  // Load existing record data if editing
  useEffect(() => {
    if (params.record) {
      const record = JSON.parse(params.record);
      setFormData({
        ...record,
        date: new Date(record.date), // Convert string date to Date object
        amTotal: (record.amTotal ?? '').toString(),
        pmTotal: (record.pmTotal ?? '').toString(),
        totalProduced: (record.totalProduced ?? '').toString(),
        milkRateAm: (record.milkRateAm ?? record.milkRate ?? '').toString(),
        milkRatePm: (record.milkRatePm ?? record.milkRate ?? '').toString(),
        totalIncome: (record.totalIncome ?? '').toString(),
      });
      if (record.cowIds && record.cowIds.length === 1 && record.cowIds[0] !== 'all') {
        setRecordMode('individual');
        setSelectedCows(record.cowIds);
      }
    } else if (params.fromCowDetails && params.cowId) {
      // If coming from cow details, pre-select individual mode and the specific cow
      setRecordMode('individual');
      setSelectedCows([params.cowId]);
      setFormData(prev => ({
        ...prev,
        cowIds: [params.cowId]
      }));
    }
    dispatch(fetchCows());
    dispatch(fetchMilkRecords());
  }, [params.record, params.fromCowDetails, params.cowId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updatedFormData = { ...prev, [field]: value };

      const amTotal = parseFloat(updatedFormData.amTotal) || 0;
      const pmTotal = parseFloat(updatedFormData.pmTotal) || 0;
      const milkRateAm = parseFloat(updatedFormData.milkRateAm) || 0;
      const milkRatePm = parseFloat(updatedFormData.milkRatePm) || 0;

      const totalProduced = amTotal + pmTotal;
      const totalIncome = (amTotal * milkRateAm) + (pmTotal * milkRatePm);

      return {
        ...updatedFormData,
        totalProduced: totalProduced.toString(),
        totalIncome: totalIncome.toString(),
      };
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  };

  const toggleCowSelection = (cowId) => {
    if (recordMode === 'individual') {
      setSelectedCows([cowId]);
    } else {
      setSelectedCows(prev => 
        prev.includes(cowId) 
          ? prev.filter(id => id !== cowId)
          : [...prev, cowId]
      );
    }
  };

  const handleSubmit = () => {
    // Validate form data
    if (!formData.date) {
      Alert.alert(t('error'), t('dateRequired'));
      return;
    }
    if (!formData.totalProduced){
      Alert.alert(t('error'),t('requiredFields'))
      return
    }

    // Prevent adding a new mass record if one already exists for the selected date
    if (!params.record && recordMode === 'mass') {
      const selectedDateStr = formData.date.toISOString().split('T')[0];
      const massRecordExists = milkRecords.some(record => {
        const recordDateStr = new Date(record.date).toISOString().split('T')[0];
        const isMassRecord = Array.isArray(record.cowIds) && record.cowIds.length === 1 && record.cowIds[0] === 'all';
        return recordDateStr === selectedDateStr && isMassRecord;
      });

      if (massRecordExists) {
        Alert.alert(t('error'), t('massRecordExistsForDate'));
        return;
      }
    }

    if (recordMode === 'individual' && selectedCows.length === 0) {
      Alert.alert(t('error'), t('selectAtLeastOneCow'));
      return;
    }

    // Convert string values to numbers
    const totalProducedNum = parseFloat(formData.totalProduced) || 0;
    const totalIncomeNum = parseFloat(formData.totalIncome) || 0;

    const milkData = {
      ...formData,
      amTotal: parseFloat(formData.amTotal) || 0,
      pmTotal: parseFloat(formData.pmTotal) || 0,
      date: formData.date instanceof Date ? formData.date.toISOString() : new Date(formData.date).toISOString(),
      totalProduced: totalProducedNum,
      milkRateAm: parseFloat(formData.milkRateAm) || 0,
      milkRatePm: parseFloat(formData.milkRatePm) || 0,
      totalIncome: totalIncomeNum,
      // for backward compatibility
      cowIds: recordMode === 'individual' ? selectedCows.map(String) : ['all']
    };

    const action = params.record 
      ? updateMilkRecord({ id: JSON.parse(params.record).id, milkData })
      : addMilkRecord(milkData);

    dispatch(action)
      .unwrap()
      .then(() => {
        Alert.alert(t('success'), params.record ? t('milkRecordUpdated') : t('milkRecordAdded'), [
          { text: 'OK', onPress: () => router.back() }
        ]);
      })
      .catch(error => {
        Alert.alert(t('error'), error.message || t('failedToSaveMilkRecord'));
      });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 pb-4">
      {/* Header */}
      <View className="flex-row items-center justify-start p-4 bg-white shadow-sm">
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Text className="pl-2 text-xl font-semibold">
          {params.record ? t('editMilkRecord') : t('newMilkRecord')}
        </Text>
        
      </View>

      {/* Form */}
      <ScrollView className="flex-1 p-4">
        {/* Date Picker */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('milkingDate')} *</Text>
          <TouchableOpacity 
            className="bg-white p-3 rounded-lg border border-gray-300"
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formatDate(formData.date)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Record Mode Selection */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">{t('recordType')}</Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setRecordMode('mass')}
              className={`flex-1 p-3 rounded-l-lg border ${
                recordMode === 'mass' ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-center ${recordMode === 'mass' ? 'text-white' : 'text-gray-700'}`}>
                {t('mass')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRecordMode('individual')}
              className={`flex-1 p-3 rounded-r-lg border ${
                recordMode === 'individual' ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-center ${recordMode === 'individual' ? 'text-white' : 'text-gray-700'}`}>
                {t('individual')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cow Selection */}
        {recordMode === 'individual' && (
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('selectCows')} *</Text>
            <TouchableOpacity 
              className="bg-white p-3 rounded-lg border border-gray-300"
              onPress={() => setShowCowSelector(true)}
            >
              <Text className="text-gray-500">
                {selectedCows.length > 0 
                  ? params.fromCowDetails 
                    ? `${params.cowName || t('unnamed')} (${params.earTagNumber})`
                    : `${selectedCows.length} ${t('cowsSelected')}`
                  : t('selectCows')
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Milk Quantities */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">{t('milkTotals')}</Text>
          <View className="flex-row space-x-2">
            <View className="flex-1">
              <Text className="text-gray-600 mb-1">{t('amTotal')}</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                keyboardType="numeric"
                value={formData.amTotal}
                onChangeText={(value) => handleInputChange('amTotal', value)}
                placeholder="0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 mb-1">{t('pmTotal')}</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                keyboardType="numeric"
                value={formData.pmTotal}
                onChangeText={(value) => handleInputChange('pmTotal', value)}
                placeholder="0"
              />
            </View>
          </View>
        </View>

        {/* Total Produced */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('totalProduced')} *</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300"
            value={formData.totalProduced}
            editable={false}
          />
        </View>

        {/* Milk Rates */}
        <View className="mb-4">
          <View className="flex-row space-x-2">
            <View className="flex-1">
              <Text className="text-gray-700 font-semibold mb-2">AM Rate per Litre (₹)</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                keyboardType="numeric"
                value={formData.milkRateAm}
                onChangeText={(value) => handleInputChange('milkRateAm', value)}
                placeholder="0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 font-semibold mb-2">PM Rate per Litre (₹)</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                keyboardType="numeric"
                value={formData.milkRatePm}
                onChangeText={(value) => handleInputChange('milkRatePm', value)}
                placeholder="0"
              />
            </View>
          </View>
        </View>

        {/* Total Income */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">Total Income (₹)</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300"
            value={formData.totalIncome}
            editable={false}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
            className="bg-blue-500 p-4 mb-4 rounded-lg"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center font-semibold">
              {params.record ? t('update') : t('addMilkRecord')}
            </Text>
          </TouchableOpacity>
      </ScrollView>

      {/* Cow Selection Modal */}
      <Modal
        visible={showCowSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCowSelector(false)}
      >
        <View className="flex-1 bg-white">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-semibold">{t('selectCows')}</Text>
              <TouchableOpacity onPress={() => setShowCowSelector(false)}>
                <AntDesign name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-4">
              {cows.map((cow) => (
                <TouchableOpacity
                  key={cow.id}
                  onPress={() => toggleCowSelection(cow.id)}
                  className={`flex-row items-center p-3 border-b border-gray-100 ${
                    selectedCows.includes(cow.id) ? 'bg-green-50' : ''
                  }`}
                >
                  <View className={`w-6 h-6 rounded-full border-2 mr-3 ${
                    selectedCows.includes(cow.id) 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedCows.includes(cow.id) && (
                      <AntDesign name="check" size={20} color="white" />
                    )}
                  </View>
                  <Text className="flex-1">{cow.earTagNumber} - {cow.name || t('unnamed')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setShowCowSelector(false)}
                className="bg-green-500 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  {t('done')} ({selectedCows.length} {t('selected')})
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddMilkScreen; 