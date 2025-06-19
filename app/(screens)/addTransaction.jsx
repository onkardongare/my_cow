import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { addTransaction, updateTransaction } from '../../redux/slices/transactionSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const isEditMode = params.editMode === 'true';
  const [type, setType] = useState(isEditMode ? params.transactionType : 'income');
  const [amount, setAmount] = useState(isEditMode ? params.transactionAmount : '');
  const [description, setDescription] = useState(isEditMode ? params.transactionDescription : '');
  const [category, setCategory] = useState(isEditMode ? params.transactionCategory : '');
  const [date, setDate] = useState(isEditMode ? new Date(params.transactionDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCow, setSelectedCow] = useState(null);
  const [showCowSelector, setShowCowSelector] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const cows = useSelector(state => state.cows.cows);

  // Handle pre-selection of cow when coming from cow details or edit mode
  useEffect(() => {
    const setupCow = () => {
      if (params.fromCowDetails && params.cowId) {
        setSelectedCow({
          id: params.cowId,
          name: params.cowName,
          earTagNumber: params.earTagNumber
        });
      } else if (isEditMode && params.transactionCowId && cows.length > 0) {
        if (params.transactionCowId === 'all') {
          setSelectedCow({ id: 'all', name: t('allCows'), earTagNumber: 'all' });
        } else {
          const cow = cows.find(c => c.id === parseInt(params.transactionCowId));
          if (cow) {
            setSelectedCow({
              id: cow.id,
              name: cow.name,
              earTagNumber: cow.earTagNumber
            });
          }
        }
      }
    };

    setupCow();
  }, [params.fromCowDetails, params.cowId, isEditMode, params.transactionCowId, params.cowName, params.earTagNumber]);

  const handleSubmit = async () => {
    if (!amount || !category || !date) {
      Alert.alert(t('error'), t('requiredFields'));
      return;
    }

    try {
      const transactionData = {
        type,
        amount: parseFloat(amount),
        description: selectedCow 
          ? selectedCow.id === 'all'
            ? `${description} (${t('allCows')})`
            : `${description} (${selectedCow.name || t('unnamed')} - ${selectedCow.earTagNumber})`
          : description,
        category,
        date: date.toISOString().split('T')[0],
        cowId: selectedCow?.id
      };

      if (isEditMode) {
        await dispatch(updateTransaction({ 
          transactionId: params.transactionId,
          ...transactionData 
        })).unwrap();
        Alert.alert(t('success'), t('transactionUpdatedSuccessfully'));
      } else {
        await dispatch(addTransaction(transactionData)).unwrap();
        Alert.alert(t('success'), t('transactionAddedSuccessfully'));
      }
      router.back();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert(t('error'), error.message || (isEditMode ? t('failedToUpdateTransaction') : t('failedToAddTransaction')));
    }
  };

  const incomeCategories = [
    { key: 'milkSales', label: t('milkSales') },
    { key: 'cattleSales', label: t('cattleSales') },
    { key: 'manureSales', label: t('manureSales') },
    { key: 'otherIncome', label: t('otherIncome') }
  ];

  const expenseCategories = [
    { key: 'feed', label: t('feed') },
    { key: 'veterinary', label: t('veterinary') },
    { key: 'labor', label: t('labor') },
    { key: 'equipment', label: t('equipment') },
    { key: 'utilities', label: t('utilities') },
    { key: 'otherExpenses', label: t('otherExpenses') }
  ];

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <SafeAreaView className="w-full h-full">
      {/* Header */}
      <View className="flex-row items-center p-4 mt-1 bg-white shadow-md">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Text className="ml-4 text-lg font-semibold">
          {isEditMode ? t('editTransaction') : t('addTransaction')}
        </Text>
      </View>

      <View className="flex-1 bg-gray-100 p-4">
        <ScrollView>
          {/* Type Selection */}
          <View className="flex-row bg-white p-2 rounded-lg shadow-md mb-4">
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg ${
                type === 'income' ? "bg-green-500" : "bg-white"
              }`}
              onPress={() => setType('income')}
            >
              <Text
                className={`text-center ${
                  type === 'income' ? "text-white" : "text-black"
                }`}
              >
                {t('income')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg ${
                type === 'expense' ? "bg-red-500" : "bg-white"
              }`}
              onPress={() => setType('expense')}
            >
              <Text
                className={`text-center ${
                  type === 'expense' ? "text-white" : "text-black"
                }`}
              >
                {t('expenses')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cow Selection */}
          <TouchableOpacity
            className="bg-white p-4 rounded-lg shadow-sm mb-4"
            onPress={() => setShowCowSelector(true)}
          >
            <Text className="text-gray-600">
              {selectedCow
                ? `${selectedCow.name || t('unnamed')} (${selectedCow.earTagNumber})`
                : t('selectCows')}
            </Text>
          </TouchableOpacity>

          {/* Amount */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-gray-600 mb-2">{t('amount')}</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder={t('enterAmount')}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Category */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-gray-600 mb-2">{t('category')}</Text>
            <View className="flex-row flex-wrap">
              {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  className={`p-2 m-1 rounded-lg ${
                    category === cat.key ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text
                    className={`${
                      category === cat.key ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-gray-600 mb-2">{t('date')}</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg p-3"
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>

          {/* Description */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-gray-600 mb-2">{t('description')}</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 h-24"
              placeholder={t('enterDescription')}
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center font-semibold">
              {isEditMode ? t('updateTransaction') : t('addTransaction')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

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

            <ScrollView>
              {/* Add "All" option at the top */}
              <TouchableOpacity
                className={`p-4 border-b border-gray-200 ${
                  selectedCow?.id === 'all' ? 'bg-blue-50' : ''
                }`}
                onPress={() => {
                  setSelectedCow({ id: 'all', name: t('allCows'), earTagNumber: 'all' });
                  setShowCowSelector(false);
                }}
              >
                <Text className="text-gray-800 font-semibold">{t('allCows')}</Text>
              </TouchableOpacity>

              {cows.map(cow => (
                <TouchableOpacity
                  key={cow.id}
                  className={`p-4 border-b border-gray-200 ${
                    selectedCow?.id === cow.id ? 'bg-blue-50' : ''
                  }`}
                  onPress={() => {
                    setSelectedCow(cow);
                    setShowCowSelector(false);
                  }}
                >
                  <Text className="text-gray-800">
                    {cow.name || cow.earTagNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddTransactionScreen; 