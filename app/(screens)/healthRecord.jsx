import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addHealthRecord, updateHealthRecord } from '../../redux/slices/healthSlice';
import { updateCowStatus } from '../../redux/slices/cowSlice';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const HealthRecordScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const healthRecords = useSelector((state) => state.health.records);
  const isEdit = params.id !== undefined;
  const recordToEdit = isEdit ? healthRecords.find(r => r.id === parseInt(params.id)) : null;

  const [formData, setFormData] = useState({
    disease: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    startDate: new Date(),
    endDate: null,
    status: 'active',
    notes: ''
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (isEdit && recordToEdit) {
      setFormData({
        disease: recordToEdit.disease,
        symptoms: recordToEdit.symptoms || '',
        diagnosis: recordToEdit.diagnosis || '',
        treatment: recordToEdit.treatment || '',
        startDate: new Date(recordToEdit.startDate),
        endDate: recordToEdit.endDate ? new Date(recordToEdit.endDate) : null,
        status: recordToEdit.status,
        notes: recordToEdit.notes || ''
      });
    }
  }, [isEdit, recordToEdit]);

  const handleSubmit = async () => {
    if (!formData.disease) {
      Alert.alert(t('error'), t('health.diseaseRequired'));
      return;
    }

    try {
      if (isEdit) {
        await dispatch(updateHealthRecord({
          id: parseInt(params.id),
          ...formData,
          cowId: recordToEdit.cowId,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate ? formData.endDate.toISOString() : null
        })).unwrap();
        await dispatch(updateCowStatus({ 
          cowId: recordToEdit.cowId, 
          isSick: formData.status === 'active' ? 1 : 0
        })).unwrap();
        Alert.alert(t('success'), t('health.healthRecordUpdated'));    
      } else {
        await dispatch(addHealthRecord({
          ...formData,
          cowId: parseInt(params.cowId),
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate ? formData.endDate.toISOString() : null
        })).unwrap();
        await dispatch(updateCowStatus({ 
          cowId: parseInt(params.cowId), 
          isSick: formData.status === 'active' ? 1 : 0
        })).unwrap();
        Alert.alert(t('success'), t('health.healthRecordAdded'));
      }
      router.back();
    } catch (error) {
      Alert.alert(t('error'), error.message || (isEdit ? t('health.failedToUpdateHealthRecord') : t('health.failedToAddHealthRecord')));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center p-4 bg-green-400 shadow-md">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text className="ml-4 text-xl font-bold">
          {isEdit ? t('health.editHealthRecord') : t('health.addHealthRecord')}
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Disease */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.disease')} *</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300"
            value={formData.disease}
            onChangeText={(value) => setFormData(prev => ({ ...prev, disease: value }))}
            placeholder={t('health.enterDisease')}
          />
        </View>

        {/* Symptoms */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.symptoms')}</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300"
            value={formData.symptoms}
            onChangeText={(value) => setFormData(prev => ({ ...prev, symptoms: value }))}
            placeholder={t('health.enterSymptoms')}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Diagnosis */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.diagnosis')}</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300"
            value={formData.diagnosis}
            onChangeText={(value) => setFormData(prev => ({ ...prev, diagnosis: value }))}
            placeholder={t('health.enterDiagnosis')}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Treatment */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.treatment')}</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300"
            value={formData.treatment}
            onChangeText={(value) => setFormData(prev => ({ ...prev, treatment: value }))}
            placeholder={t('health.enterTreatment')}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Start Date */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.startDate')}</Text>
          <TouchableOpacity
            className="bg-white p-3 rounded-lg border border-gray-300"
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text>{formatDate(formData.startDate)}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setFormData(prev => ({ ...prev, startDate: selectedDate }));
                }
              }}
            />
          )}
        </View>

        {/* End Date */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.endDate')}</Text>
          <TouchableOpacity
            className="bg-white p-3 rounded-lg border border-gray-300"
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text>{formatDate(formData.endDate)}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={formData.endDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setFormData(prev => ({ ...prev, endDate: selectedDate }));
                }
              }}
            />
          )}
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.status')}</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg ${
                formData.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
              }`}
              onPress={() => setFormData(prev => ({ ...prev, status: 'active' }))}
            >
              <Text className={`text-center ${
                formData.status === 'active' ? 'text-green-700' : 'text-gray-700'
              }`}>
                {t('health.active')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg ${
                formData.status === 'recovered' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
              onPress={() => setFormData(prev => ({ ...prev, status: 'recovered' }))}
            >
              <Text className={`text-center ${
                formData.status === 'recovered' ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {t('health.recovered')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">{t('health.notes')}</Text>
          <TextInput
            className="bg-white p-3 rounded-lg border border-gray-300"
            value={formData.notes}
            onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
            placeholder={t('health.enterNotes')}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-green-500 p-4 rounded-lg mb-8"
          onPress={handleSubmit}
        >
          <Text className="text-white text-center font-semibold">
            {isEdit ? t('save') : t('health.addHealthRecord')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HealthRecordScreen; 