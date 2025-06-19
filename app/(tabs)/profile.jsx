import { View, Text, Image, TouchableOpacity, ScrollView, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { images } from "../../constants";
import { useRouter } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { fetchCows } from "../../redux/slices/cowSlice";
import { fetchEvents } from "../../redux/slices/eventSlice";
import { fetchTransactions } from "../../redux/slices/transactionSlice";
import { fetchMilkRecords } from "../../redux/slices/milkSlice";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  
  // Get data from Redux store with proper error handling
  const { cows, loading: cowsLoading, error: cowsError, stats: cowsStats} = useSelector(state => state.cows);
  const { events, loading: eventsLoading, error: eventsError } = useSelector(state => state.events);
  const { transactions, loading: transactionsLoading, error: transactionsError } = useSelector(state => state.transactions);
  const { records: milkRecords, loading: milkLoading, error: milkError } = useSelector(state => state.milk);

  const loading = cowsLoading || eventsLoading || transactionsLoading || milkLoading;
  const error = cowsError || eventsError || transactionsError || milkError;

  // Calculate farm statistics with proper null checks
  const stats = {
    totalCows: cowsStats.total || 0,
    activeCows: cowsStats.presentCows || 0,
    soldCows: cowsStats.sold || 0,
    diedCows: cowsStats.died || 0,
    pendingEvents: events?.filter(event => event.status === 'pending').length || 0,
    completedEvents: events?.filter(event => event.status === 'completed').length || 0,
    totalIncome: transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0,
    totalExpense: transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0,
    totalMilk: milkRecords?.reduce((sum, record) => sum + (parseFloat(record.totalProduced) || 0), 0) || 0,
    averageDailyMilk: milkRecords?.length > 0 
      ? milkRecords.reduce((sum, record) => sum + (parseFloat(record.totalProduced) || 0), 0) / milkRecords.length 
      : 0
  };

  const loadData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      await Promise.all([
        dispatch(fetchCows({includeDisposed: true})),
        dispatch(fetchEvents()),
        dispatch(fetchTransactions()),
        dispatch(fetchMilkRecords())
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('error'), t('failedToLoadData'));
    }
  }, [dispatch, t]);

  // Use useEffect instead of useFocusEffect
  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  // Show loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">{t('loading')}...</Text>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity 
          className="bg-blue-500 px-4 py-2 rounded-lg"
          onPress={loadData}
        >
          <Text className="text-white">{t('retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const menuItems = [
    {
      id: "1",
      title: t('myCattle'),
      icon: <Feather name="users" size={24} color="#4F46E5" />,
      onPress: () => router.push("/(tabs)/cow")
    },
    {
      id: "2",
      title: t('events'),
      icon: <Feather name="calendar" size={24} color="#4F46E5" />,
      onPress: () => router.push("/(tabs)/events")
    },
    // {
    //   id: "3",
    //   title: t('settings'),
    //   icon: <Feather name="settings" size={24} color="#4F46E5" />,
    //   onPress: () => router.push("/(screens)/settings")
    // },
    {
      id: "4",
      title: t('help'),
      icon: <Feather name="help-circle" size={24} color="#4F46E5" />,
      onPress: () => router.push("/(screens)/about")
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center p-4 bg-green-400 shadow-md">
          <Text className="ml-2 text-xl font-bold">{t('profile')}</Text>
        </View>
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Profile Header */}
          <View className="bg-white rounded-xl shadow-sm p-4 items-center mb-4">
            <Image
              source={images.kisan}
              className="w-24 h-24 rounded-full mb-3"
            />
            <Text className="text-xl font-bold text-gray-900">{t('dairyFarmer')}</Text>
          </View>

          {/* Farm Statistics */}
          <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <Text className="font-bold text-lg text-gray-900 mb-4">{t('farmStatistics')}</Text>
            <View className="space-y-4">
              {/* Cattle Stats */}
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <Feather name="users" size={20} color="#4F46E5" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('totalCattle')}</Text>
                    <Text className="font-bold text-gray-900">{stats.totalCows}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-lg mr-3">
                    <Feather name="check-circle" size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('activeCattle')}</Text>
                    <Text className="font-bold text-gray-900">{stats.activeCows}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-red-100 p-2 rounded-lg mr-3">
                    <Feather name="x-circle" size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('deceasedCattle')}</Text>
                    <Text className="font-bold text-gray-900">{stats.diedCows}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-purple-100 p-2 rounded-lg mr-3">
                    <Feather name="dollar-sign" size={20} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('soldCattle')}</Text>
                    <Text className="font-bold text-gray-900">{stats.soldCows}</Text>
                  </View>
                </View>
              </View>

              {/* Events Stats */}
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Feather name="calendar" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('pendingEvents')}</Text>
                    <Text className="font-bold text-gray-900">{stats.pendingEvents}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-yellow-100 p-2 rounded-lg mr-3">
                    <Feather name="check-square" size={20} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('completedEvents')}</Text>
                    <Text className="font-bold text-gray-900">{stats.completedEvents}</Text>
                  </View>
                </View>
              </View>

              {/* Financial Stats */}
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-lg mr-3">
                    <Feather name="trending-up" size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('totalIncome')}</Text>
                    <Text className="font-bold text-gray-900">₹{stats.totalIncome.toFixed(2)}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-red-100 p-2 rounded-lg mr-3">
                    <Feather name="trending-down" size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('totalExpense')}</Text>
                    <Text className="font-bold text-gray-900">₹{stats.totalExpense.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {/* Milk Stats */}
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Feather name="droplet" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('totalMilk')}</Text>
                    <Text className="font-bold text-gray-900">{stats.totalMilk.toFixed(2)} L</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-yellow-100 p-2 rounded-lg mr-3">
                    <Feather name="bar-chart" size={20} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-gray-600">{t('averageDailyMilk')}</Text>
                    <Text className="font-bold text-gray-900">{stats.averageDailyMilk.toFixed(2)} L</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <Text className="font-bold text-lg text-gray-900 mb-4">{t('quickActions')}</Text>
            <View className="flex-row flex-wrap gap-4">
              <TouchableOpacity 
                className="bg-indigo-100 p-4 rounded-xl flex-1"
                onPress={() => router.push("/(screens)/addCow")}
              >
                <View className="flex-row items-center">
                  <Feather name="plus-circle" size={20} color="#4F46E5" />
                  <Text className="ml-2 text-indigo-600 font-medium">{t('addCattle')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-indigo-100 p-4 rounded-xl flex-1"
                onPress={() => router.push("/(screens)/addEvent")}
              >
                <View className="flex-row items-center">
                  <Feather name="calendar" size={20} color="#4F46E5" />
                  <Text className="ml-2 text-indigo-600 font-medium">{t('addEvent')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu List */}
          <View className="bg-white rounded-xl shadow-sm">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="p-4 flex-row items-center border-b border-gray-100 last:border-b-0"
                onPress={item.onPress}
              >
                <View className="bg-indigo-100 p-2 rounded-lg mr-3">
                  {item.icon}
                </View>
                <Text className="text-gray-900 font-medium">{item.title}</Text>
                <View className="ml-auto">
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;