import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from "react-native";
import { useState, useEffect } from "react";
import { AntDesign, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useNavigation } from 'expo-router';
import { fetchTransactions, deleteTransaction } from '../../redux/slices/transactionSlice';
import DateRangeFilter from '../../components/DateRangeFilter';

const TransactionsScreen = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState("Income");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRange, setSelectedRange] = useState('allTime');
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  
  const transactions = useSelector(state => state.transactions.transactions) || [];
  const loading = useSelector(state => state.transactions.loading);
  const error = useSelector(state => state.transactions.error);

  const loadData = async () => {
    try {
      await dispatch(fetchTransactions()).unwrap();
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

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await dispatch(deleteTransaction(transactionId)).unwrap();
      Alert.alert(t('success'), t('transactionDeletedSuccessfully'));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert(t('error'), error.message || t('failedToDeleteTransaction'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('unknown');
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const calculateDateRange = (range) => {
    const today = new Date();
    let startDate = new Date();
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999); // Set end date to end of today

    switch (range) {
      case 'last7Days':
        startDate.setDate(today.getDate() - 6); // Changed from -7 to -6 to include today
        startDate.setHours(0, 0, 0, 0); // Set start date to beginning of the day
        break;
      case 'currentMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'previousMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate.setDate(0); // Last day of previous month
        break;
      case 'last3Months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'last6Months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'last12Months':
        startDate.setMonth(today.getMonth() - 12);
        break;
      case 'currentYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'previousYear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate.setFullYear(today.getFullYear() - 1, 11, 31);
        break;
      case 'last3Years':
        startDate.setFullYear(today.getFullYear() - 3);
        break;
      case 'last6Years':
        startDate.setFullYear(today.getFullYear() - 6);
        break;
      case 'allTime':
        return null; // No date range filter
      default:
        startDate.setDate(today.getDate() - 7); // Default to last 7 days
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Apply date range filter
    const dateRange = calculateDateRange(selectedRange);
    if (dateRange) {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0); // Normalize transaction date to start of day
      
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0); // Normalize start date to start of day
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Set end date to end of day

      // Compare dates using getTime() for accurate comparison
      if (transactionDate.getTime() < startDate.getTime() || transactionDate.getTime() > endDate.getTime()) {
        return false;
      }
    }

    if (selectedTab === "Income") {
      return transaction.type === 'income';
    } else {
      return transaction.type === 'expense';
    }
  });

  const totalAmount = filteredTransactions.reduce((sum, transaction) => {
    return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
  }, 0);

  const renderTransactionCard = (transaction) => {
    const isIncome = transaction.type === 'income';
    return (
      <View key={transaction.id} className="bg-white p-4 mx-2 rounded-lg mb-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <View className={`w-10 h-10 rounded-full ${isIncome ? 'bg-green-100' : 'bg-red-100'} items-center justify-center mr-3`}>
              <Feather name={isIncome ? "arrow-up" : "arrow-down"} size={20} color={isIncome ? "green" : "red"} />
            </View>
            <View>
              <Text className="text-lg font-semibold">{t(transaction.category)}</Text>
              <Text className="text-gray-600">{formatDate(transaction.date)}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className={`text-lg font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(transaction.amount)}
            </Text>
            <View className="flex-row mt-2 space-x-3">
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/(screens)/addTransaction",
                    params: { 
                      editMode: true,
                      transactionId: transaction.id,
                      transactionType: transaction.type,
                      transactionAmount: transaction.amount,
                      transactionDescription: transaction.description,
                      transactionCategory: transaction.category,
                      transactionDate: transaction.date,
                      transactionCowId: transaction.cowId,
                      transactionCowName: transaction.cowName,
                      transactionCowEarTag: transaction.cowEarTag
                    }
                  });
                }}
              >
                <Feather name="edit-2" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    t('confirmDelete'),
                    t('deleteTransactionConfirmation'),
                    [
                      {
                        text: t('cancel'),
                        style: 'cancel'
                      },
                      {
                        text: t('delete'),
                        style: 'destructive',
                        onPress: () => handleDeleteTransaction(transaction.id)
                      }
                    ]
                  );
                }}
              >
                <Feather name="trash-2" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {transaction.description && (
          <Text className="text-gray-600">{transaction.description}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="w-full h-full">
      <View className="flex-1 bg-gray-100 ">
        {/* Header */}
        <View className="flex-row items-center p-4  mt-1 bg-white shadow-md">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text className="ml-4 text-lg font-semibold">{t('transactions')}</Text>
          <TouchableOpacity onPress={() => setShowFilter(true)} className="ml-auto">
            <Feather name="filter" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white p-4 m-2 rounded-lg shadow-md mb-4">
          <TouchableOpacity
            className={`flex-1 p-3 rounded-lg ${
              selectedTab === "Income" ? "bg-green-500" : "bg-white"
            }`}
            onPress={() => setSelectedTab("Income")}
          >
            <Text
              className={`text-center ${
                selectedTab === "Income" ? "text-white" : "text-black"
              }`}
            >
              {t('income')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 p-3 rounded-lg ${
              selectedTab === "Expense" ? "bg-red-500" : "bg-white"
            }`}
            onPress={() => setSelectedTab("Expense")}
          >
            <Text
              className={`text-center ${
                selectedTab === "Expense" ? "text-white" : "text-black"
              }`}
            >
              {t('expenses')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Amount */}
        <View className="bg-white p-4 mx-2 rounded-lg shadow-sm mb-4">
          <Text className="text-gray-600">{t('total')}</Text>
          <Text className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(Math.abs(totalAmount))}
          </Text>
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
          ) : filteredTransactions.length === 0 ? (
            <View className="flex-1 justify-center items-center py-8">
              <Feather name="file-text" size={50} color="#9CA3AF" />
              <Text className="text-gray-600 mt-4 text-center">
                {t('noTransactions')}
              </Text>
            </View>
          ) : (
            filteredTransactions.map(renderTransactionCard)
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          onPress={() => router.push("/(screens)/addTransaction")}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>

        {/* Date Range Filter */}
        <DateRangeFilter
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          onSelect={(range) => setSelectedRange(range)}
          selectedRange={selectedRange}
        />
      </View>
    </SafeAreaView>
  );
};

export default TransactionsScreen;