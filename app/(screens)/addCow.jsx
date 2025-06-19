import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router"
import { AntDesign, Feather } from "@expo/vector-icons"; // Icons for fields
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from 'react-i18next';
import { addCow, updateCow } from "../../redux/slices/cowSlice";
import DateTimePicker from '@react-native-community/datetimepicker';

const AddCattleScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const params = useLocalSearchParams();
  const isEdit = params.edit === 'true';
  const cowId = params.cowId;
  const cowData = params.cowData ? JSON.parse(params.cowData) : null;
  
  const [selectedGender, setSelectedGender] = useState(() => {
    if (isEdit && cowData) {
      return cowData.gender || null;
    }
    return 'female';
  });
  const [showObtainedModal, setShowObtainedModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEarTagInfo, setShowEarTagInfo] = useState(false);
  const [showDateOfBirthPicker, setShowDateOfBirthPicker] = useState(false);
  const [showDateOfEntryPicker, setShowDateOfEntryPicker] = useState(false);
  const [showInseminationDatePicker, setShowInseminationDatePicker] = useState(false);
  const [showLastDeliveryDatePicker, setShowLastDeliveryDatePicker] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState(() => {
    if (isEdit && cowData && cowData.cattleObtained === 'purchase') {
      return cowData.purchasePrice?.toString() || '';
    }
    return '';
  });
  const [inseminationDate, setInseminationDate] = useState(() => {
    if(isEdit && cowData && (cowData.cattleStatus === 'pregnant' || cowData.cattleStatus === 'inseminated' || 
       cowData.cattleStatus === 'inseminatedAndLactating' || 
       cowData.cattleStatus === 'inseminatedAndNonLactating' ||
       formData.cattleStatus === 'nonLactatingAndPregnant' || 
       formData.cattleStatus === 'lactatingAndPregnant')){
      return cowData.inseminationDate?.toString() || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);


  const [formData, setFormData] = useState(() => {
    if (isEdit && cowData) {
      return {
        earTagNumber: cowData.earTagNumber || '',
        cattleObtained: cowData.cattleObtained || '',
        cattleBreed: cowData.cattleBreed || '',
        cattleStage: cowData.cattleStage || '',
        cattleStatus: cowData.cattleStatus || '',
        name: cowData.name || '',
        weight: cowData.weight || '',
        dateOfBirth: cowData.dateOfBirth || '',
        dateOfEntry: cowData.dateOfEntry || '',
        motherTagNo: cowData.motherTagNo || '',
        lastDeliveryDate: cowData.lastDeliveryDate || '',
        // fatherTagNo: cowData.fatherTagNo || '',
        isSick: cowData.isSick || false
      };
    }
    return {
      earTagNumber: '',
      cattleObtained: '',
      cattleBreed: '',
      cattleStage: '',
      cattleStatus: '',
      name: '',
      weight: '',
      dateOfBirth: '',
      dateOfEntry: '',
      motherTagNo: '',
      lastDeliveryDate: '',
      // fatherTagNo: '',
      isSick: false
    };
  });

  const cattleStatusOptions = [
    'pregnant',
    'inseminated',
    'lactating',
    'nonLactating',
    'inseminatedAndLactating',
    'inseminatedAndNonLactating',
    'lactatingAndPregnant',
    'nonLactatingAndPregnant',
    'other'
  ];

  const cattleBreeds = [
    'jersey',
    'holsteinFriesian',
    'sahiwal',
    'gir',
    'redSindhi',
    'tharparkar',
    'other'
  ];

  const handleInputChange = (field, value) => {
    if (field === 'cattleStage' && (value === 'calf')) {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        cattleStatus: 'other'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleDateChange = (event, selectedDate, field) => {
    if (Platform.OS === 'android') {
      if (field === 'dateOfBirth') {
        setShowDateOfBirthPicker(false);
      } else if (field === 'dateOfEntry') {
        setShowDateOfEntryPicker(false);
      } else if (field === 'inseminationDate') {
        setShowInseminationDatePicker(false);
      } else if (field === 'lastDeliveryDate') {
        setShowLastDeliveryDatePicker(false);
      }
    }
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleInputChange(field, formattedDate);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSubmit = async () => {
    if (!formData.earTagNumber || !selectedGender || !formData.cattleObtained || !formData.cattleBreed || !formData.cattleStage || (formData.cattleStage === 'cow' && !formData.cattleStatus) ) {
      Alert.alert(t('error'), t('requiredFields'));
      return;
    }

    setLoading(true);
    try {
      const cowData = {
        ...formData,
        gender: selectedGender,
        breed: formData.cattleBreed || '',
        purchasePrice: formData.cattleObtained === 'purchase' ? parseFloat(purchasePrice) : null,
        inseminationDate: (formData.cattleStatus === 'pregnant' || 
                          formData.cattleStatus === 'nonLactatingAndPregnant' || 
                          formData.cattleStatus === 'lactatingAndPregnant' || 
                          formData.cattleStatus === 'inseminated' || 
                          formData.cattleStatus === 'inseminatedAndLactating' || 
                          formData.cattleStatus === 'inseminatedAndNonLactating') ? 
                          formData.inseminationDate : null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        dateOfEntry: formData.dateOfEntry ? new Date(formData.dateOfEntry).toISOString() : null,
        isSick: formData.isSick
      };

      if (isEdit) {
        await dispatch(updateCow({ cowId, cowData })).unwrap();
        Alert.alert(t('success'), t('cowUpdatedSuccessfully'));
      } else {
        await dispatch(addCow(cowData)).unwrap();
        Alert.alert(t('success'), t('cowAddedSuccessfully'));
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('error'), error.message || (isEdit ? t('failedToUpdateCow') : t('failedToAddCow')));
    } finally {
      setLoading(false);
    }
  };

  const renderOptionModal = (title, options, selectedValue, onSelect, showModal, setShowModal) => (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-4">
            <Text className="text-lg font-semibold mb-4">{title}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                className={`p-4 border-b border-gray-200 ${
                  selectedValue === option ? 'bg-teal-50' : ''
                }`}
                onPress={() => {
                  onSelect(option);
                  setShowModal(false);
                }}
              >
                <Text className={`text-center ${
                  selectedValue === option ? 'text-teal-500 font-semibold' : 'text-gray-700'
                }`}>
                  {t(option)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="p-4 mt-4 bg-gray-100 rounded-lg"
              onPress={() => setShowModal(false)}
            >
              <Text className="text-center text-gray-700">{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderEarTagInfoModal = () => (
    <Modal
      visible={showEarTagInfo}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowEarTagInfo(false)}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPress={() => setShowEarTagInfo(false)}
      >
        <View className="bg-white rounded-lg p-6 mx-4 w-[90%]">
          <Text className="text-lg font-semibold mb-4">{t('earTagNumber')}</Text>
          <Text className="text-gray-600 mb-6">{t('earTagNumberPlaceholder')}</Text>
          <TouchableOpacity
            className="bg-teal-500 p-3 rounded-lg"
            onPress={() => setShowEarTagInfo(false)}
          >
            <Text className="text-center text-white font-semibold">{t('ok')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView className="h-full w-full">
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="flex-row items-center p-4 bg-white shadow-md">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text className="ml-4 text-lg font-semibold">{t('addCattle')}</Text>
        </View>

        {/* Form */}
        <ScrollView className="p-4">
          {/* Gender Selection */}
          <Text className="text-gray-700 font-semibold mb-2">{t('gender')} *</Text>
          <View className="flex-row mb-4">
          <TouchableOpacity 
              className={`flex-1 p-3 mr-2 rounded-lg border ${
                selectedGender === 'female' ? 'border-blue-500 bg-sky-200' : 'border-gray-300 bg-white'
              }`}
              onPress={() => setSelectedGender('female')}
            >
              <Text className={`text-center ${
                selectedGender === 'female' ? 'text-teal-500 font-semibold' : 'text-gray-700'
              }`}>
                {t('female')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 p-3 rounded-lg border ${
                selectedGender === 'male' ? 'border-blue-500 bg-sky-200' : 'border-gray-300 bg-white'
              }`}
              onPress={() => setSelectedGender('male')}
            >
              <Text className={`text-center ${
                selectedGender === 'male' ? 'text-teal-500 font-semibold' : 'text-gray-700'
              }`}>
                {t('male')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ear Tag Number */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('earTagNumber')} *</Text>
            <View className="flex-row items-center bg-white pl-1 pr-3 rounded-lg border border-gray-300">
              <TextInput 
                className="flex-1 text-gray-600 p-3"
                value={formData.earTagNumber}
                onChangeText={(value) => handleInputChange('earTagNumber', value)}
              />
              <TouchableOpacity onPress={() => setShowEarTagInfo(true)}>
                <AntDesign name="infocirlceo" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          </View>

          {/* How Cattle Obtained */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('cattleObtained')} *</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-white p-3 rounded-lg border border-gray-300"
              onPress={() => setShowObtainedModal(true)}
            >
              <Text className="flex-1 text-gray-600">
                {formData.cattleObtained ? t(formData.cattleObtained) : ""}
              </Text>
              <AntDesign name="down" size={16} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Cattle Breed */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('cattleBreed')}</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-white p-3 rounded-lg border border-gray-300"
              onPress={() => setShowBreedModal(true)}
            >
              <Text className="flex-1 text-gray-600">
                {formData.cattleBreed ? t(formData.cattleBreed) : ""}
              </Text>
              <AntDesign name="down" size={16} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Cattle Stage */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('cattleStage')}</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-white p-3 rounded-lg border border-gray-300"
              onPress={() => setShowStageModal(true)}
            >
              <Text className="flex-1 text-gray-600">
                {formData.cattleStage ? t(formData.cattleStage) : ""}
              </Text>
              <AntDesign name="down" size={16} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Cattle Status */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('cattleStatus')}</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-white p-3 rounded-lg border border-gray-300"
              onPress={() => setShowStatusModal(true)}
            >
              <Text className="flex-1 text-gray-600">
                {formData.cattleStatus ? t(formData.cattleStatus) : ""}
              </Text>
              <AntDesign name="down" size={16} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Other Input Fields */}
          {[
            { field: 'name', label: t('name') },
            { field: 'weight', label: t('weight') },
            { field: 'motherTagNo', label: t('motherTagNo') },
          ].map((field, index) => (
            <View key={index} className="mb-4">
              <Text className="text-gray-700 font-semibold mb-1">{field.label}</Text>
              <View className="bg-white pl-1 rounded-lg border border-gray-300">
                <TextInput 
                  className="text-gray-600 p-3"
                  value={formData[field.field]}
                  onChangeText={(value) => handleInputChange(field.field, value)}
                />
              </View>
            </View>
          ))}

          {/* Date of Birth */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('dateOfBirth')}</Text>
            <TouchableOpacity 
              className="bg-white pl-1 rounded-lg border border-gray-300"
              onPress={() => setShowDateOfBirthPicker(true)}
            >
              <Text className="text-gray-600 p-3">
                {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : ""}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date of Entry */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">{t('dateOfEntry')}</Text>
            <TouchableOpacity 
              className="bg-white pl-1 rounded-lg border border-gray-300"
              onPress={() => setShowDateOfEntryPicker(true)}
            >
              <Text className="text-gray-600 p-3">
                {formData.dateOfEntry ? formatDate(formData.dateOfEntry) : ""}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Insemination Date - Only show when status is related to insemination */}
          {(formData.cattleStatus === 'pregnant' || 
            formData.cattleStatus === 'nonLactatingAndPregnant' || 
            formData.cattleStatus === 'lactatingAndPregnant' || 
            formData.cattleStatus === 'inseminated' || 
            formData.cattleStatus === 'inseminatedAndLactating' || 
            formData.cattleStatus === 'inseminatedAndNonLactating') && (
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-1">{t('inseminationDate')}</Text>
              <TouchableOpacity 
                className="bg-white pl-1 rounded-lg border border-gray-300"
                onPress={() => setShowInseminationDatePicker(true)}
              >
                <Text className="text-gray-600 p-3">
                  {formData.inseminationDate ? formatDate(formData.inseminationDate) : ""}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Purchase Price Input */}
          {formData.cattleObtained === 'purchase' && (
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-1">{t('purchasePrice')}</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                placeholder={t('enterPurchasePrice')}
                keyboardType="numeric"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
              />
            </View>
          )}

          {/* Last Delivery Date */}
          {formData.cattleStage === 'cow' && (
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-1">{t('lastDeliveryDate')}</Text>
              <TouchableOpacity 
                className="bg-white pl-1 rounded-lg border border-gray-300"
                onPress={() => setShowLastDeliveryDatePicker(true)}
              >
                <Text className="text-gray-600 p-3">
                  {formData.lastDeliveryDate ? formatDate(formData.lastDeliveryDate) : ""}
                </Text>
              </TouchableOpacity>
           </View>
          )}
          
          {/* Health Status */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">{t('healthStatus')}</Text>
            <TouchableOpacity
              className={`p-4 rounded-lg ${
                formData.isSick ? 'bg-red-100' : 'bg-green-100'
              }`}
              onPress={() => setFormData(prev => ({ ...prev, isSick: !prev.isSick }))}
            >
              <View className="flex-row items-center justify-between">
                <Text className={`font-medium ${
                  formData.isSick ? 'text-red-700' : 'text-green-700'
                }`}>
                  {formData.isSick ? t('sick') : t('healthy')}
                </Text>
                <Feather 
                  name={formData.isSick ? "activity" : "check-circle"} 
                  size={20} 
                  color={formData.isSick ? "red" : "green"} 
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className={`p-4 mb-8 rounded-lg ${loading ? 'bg-gray-400' : 'bg-teal-500'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? t('saving') : t('save')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modals */}
        {renderEarTagInfoModal()}
        {renderOptionModal(
          t('cattleObtained'),
          ['bornOnFarm', 'purchase', 'other'],
          formData.cattleObtained,
          (value) => handleInputChange('cattleObtained', value),
          showObtainedModal,
          setShowObtainedModal
        )}

        {renderOptionModal(
          t('cattleBreed'),
          cattleBreeds,
          formData.cattleBreed,
          (value) => handleInputChange('cattleBreed', value),
          showBreedModal,
          setShowBreedModal
        )}

        {renderOptionModal(
          t('cattleStage'),
          ['calf', 'heifer', 'cow'],
          formData.cattleStage,
          (value) => handleInputChange('cattleStage', value),
          showStageModal,
          setShowStageModal
        )}

        {renderOptionModal(
          t('cattleStatus'),
          cattleStatusOptions,
          formData.cattleStatus,
          (value) => handleInputChange('cattleStatus', value),
          showStatusModal,
          setShowStatusModal
        )}

        {/* Date Pickers */}
        {showDateOfBirthPicker && (
          <DateTimePicker
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => handleDateChange(event, date, 'dateOfBirth')}
            maximumDate={new Date()}
          />
        )}

        {showDateOfEntryPicker && (
          <DateTimePicker
            value={formData.dateOfEntry ? new Date(formData.dateOfEntry) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => handleDateChange(event, date, 'dateOfEntry')}
            maximumDate={new Date()}
          />
        )}

        {showInseminationDatePicker && (
          <DateTimePicker
            value={formData.inseminationDate ? new Date(formData.inseminationDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => handleDateChange(event, date, 'inseminationDate')}
            maximumDate={new Date()}
          />
        )}

        {showLastDeliveryDatePicker && (
            <DateTimePicker
              value={formData.lastDeliveryDate ? new Date(formData.lastDeliveryDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleDateChange(event, date, 'lastDeliveryDate')}
              maximumDate={new Date()}
            />
        )}

      </View>
    </SafeAreaView>
  );
};

export default AddCattleScreen;
