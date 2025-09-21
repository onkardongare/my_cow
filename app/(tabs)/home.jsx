import { View, Text, Image, ScrollView, Pressable, TouchableOpacity, Animated, TouchableWithoutFeedback, Modal, RefreshControl, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { icons, images } from "../../constants";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from 'react-i18next';
import { changeLanguage } from "../../redux/slices/langSlice";
import { fetchCows } from "../../redux/slices/cowSlice";
import { fetchTransactions } from "../../redux/slices/transactionSlice";
import { fetchEvents } from "../../redux/slices/eventSlice";
import { fetchMilkRecords } from "../../redux/slices/milkSlice";
import { Feather, MaterialIcons } from "@expo/vector-icons";

const CattleTypeCard = ({ title, name, count, color, icon, router }) => (
  <TouchableOpacity
    onPress={() => router.push({
      pathname: "/(screens)/filterCattle",
      params: { filter: name.toLowerCase() }
    })}
    style={{ backgroundColor: color }} className="rounded-lg mr-1 flex-1 items-center"  >
  <View style={{ backgroundColor: color }} className="rounded-lg mr-1 flex-1 items-center">
    <Image 
      source={icon} 
      className="w-10 h-10 mb-1" 
    />
    <Text className="text-white text-sm font-semibold" numberOfLines={1} >{title}</Text>
    <Text className="text-white text-xl font-bold">{count}</Text>
  </View>
  </TouchableOpacity>
);

const SummaryHeader = ({ title }) => (
  <View className="bg-[#454F63] rounded-t-lg p-3">
    <Text className="text-white text-lg font-semibold">{title}</Text>
  </View>
);

const CountCard = ({ icon, name, iconclass, label, count, showArrow = false, tailwind, router }) => (
  <TouchableOpacity 
    className={`flex-row justify-between items-center bg-white p-2 border-2 border-blue-700 rounded-lg ${tailwind}`}
    onPress={() => router.push({
      pathname: "/(screens)/filterCattle",
      params: { filter: name.toLowerCase() }
    })}
  >
    <View className="flex-row items-center">
      {icon && (
        <Image 
          source={icon} 
          className={`w-10 h-10 ${iconclass}`}
        />
      )}
      <Text className="text-gray-600 text-base">{label}</Text>
    </View>
    <View className="flex-row items-center">
      <Text className="text-lg font-semibold text-gray-900 ml-1">{count}</Text>
      {showArrow && (
        <Image 
          source={icons.pnext} 
          tintColor={"blue"}
          className="w-4 h-4 m-1 ml-0"
        />
      )}
    </View>
  </TouchableOpacity>
);

const ConditionCard = ({ icon, name, label, count, color, router }) => (
  <TouchableOpacity 
    style={{ backgroundColor: color }} 
    className="rounded-lg mr-2 pr-1 mb-1 flex-row items-center justify-between w-[160px]"
    onPress={() => router.push({
      pathname: "/(screens)/filterCattle",
      params: { filter: name.toLowerCase() }
    })}
  >
    <Image 
      source={icon} 
      className="w-8 h-8 m-1" 
      tintColor="white"
    />
    <Text className="text-white text-sm font-medium" numberOfLines={1}>{label}</Text>
    <Text className="text-white text-xl font-bold">{count}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const currentLanguage = useSelector((state) => state.language.lang);
  const { cows, stats, loading } = useSelector((state) => state.cows);
  const { transactions } = useSelector((state) => state.transactions);
  const { events } = useSelector((state) => state.events);
  const { records: milkRecords } = useSelector((state) => state.milk);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // const slideAnim = useState(new Animated.Value(-250))[0];

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchCows({ includeDisposed: true })),
        dispatch(fetchTransactions()),
        dispatch(fetchEvents()),
        dispatch(fetchMilkRecords())
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const toggleSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleLanguageChange = (lang) => {
    dispatch(changeLanguage(lang));
    setShowLanguageModal(false);
  };

  const getLanguageName = (lang) => {
    switch (lang) {
      case 'en': return 'English';
      case 'hi': return 'हिंदी';
      case 'mr': return 'मराठी';
      default: return 'English';
    }
  };

  const cattleTypes = [
    // { title: t('bulls'), count: stats.bulls, color: '#1ABC9C', icon: icons.bull },
    { title: t('calves'), name: 'calves', count: stats.calves, color: '#E84393', icon: icons.calve },
    { title: t('heifers'), name: 'heifers', count: stats.heifers, color: '#9B59B6', icon: icons.heifer },
    { title: t('cows'), name: 'cows', count: stats.cows, color: '#FF7675', icon: icons.cow },
  ];

  const conditions = [
    { name: 'sick', label: t('sick'), count: stats.sick, color: '#FF7675', icon: icons.health },
    { name: 'pregnant', label: t('pregnant'), count: stats.pregnant, color: '#9B59B6', icon: icons.pregnant },
    { name: 'milking', label: t('milking'), count: stats.lactating, color: '#1ABC9C', icon: icons.milking },
    { name: 'dry', label: t('dry'), count: stats.nonLactating, color: '#3498DB', icon: icons.nmilking },
  ];

  const otherMetrics = [
    { name: 'inseminated', label: t('inseminated'), value: stats.inseminated, arrow: true, icon: icons.semen, color: "blue-300" },
    { name: 'fresh', label: t('fresh'), value: stats.lactating, arrow: true, icon: icons.fresh, color: "blue-400" },
    { name: 'open', label: t('open'), value: stats.open, arrow: true, icon: icons.open, color: "blue-500" },
  ];

  const menuSections = [
    {
      title: t('ourFeatures'),
      items: [
        { icon: icons.cow, title: t('addCattle'), onPress: () => router.push("/(screens)/addCow") },
        { icon: icons.event, title: t('manageEvents'), onPress: () => router.push("/(screens)/addEvent") },
        { icon: icons.milking, title: t('createMilkLedger'), onPress: () => router.push("/(screens)/addMilk") },
        { icon: icons.report, title: t('trackTransactions'), onPress: () => router.push("/(screens)/addTransaction") }
      ]
    },
    {
      title: t('preferences'),
      items: [
        { icon: icons.aboutUs, title: t('about'), onPress: () => router.push("/(screens)/about") },
        { icon: icons.privacy, title: t('privacyPolicy'), onPress: () => Linking.openURL('https://www.privacypolicies.com/live/27800d9c-f108-476a-b8e1-ee1bf81d2842') }
      ]
    }
  ];

  // Calculate milk statistics
  const calculateMilkStats = () => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    
    const recentRecords = milkRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= last7Days && recordDate <= today;
    });

    const totalMilk = recentRecords.reduce((sum, record) => sum + (record.totalProduced || 0), 0);
    const averageDailyMilk = recentRecords.length > 0 ? totalMilk / recentRecords.length : 0;

    return {
      totalMilk: totalMilk.toFixed(1),
      averageDailyMilk: averageDailyMilk.toFixed(1),
      recordsCount: recentRecords.length
    };
  };

  const milkStats = calculateMilkStats();

  // Calculate financial metrics from transactions
  const calculateFinancialMetrics = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      receivables: 0, // Placeholder for future implementation
      debts: 0 // Placeholder for future implementation
    };
  };

  const financialMetrics = [
    { 
      label: t('incomes'), 
      value: `₹${calculateFinancialMetrics().income.toFixed(2)}`,
      color: 'text-[#3BB273]'
    },
    { 
      label: t('expenses'), 
      value: `₹${calculateFinancialMetrics().expenses.toFixed(2)}`,
      color: 'text-red-500'
    },
    { 
      label: t('receivables'), 
      value: `₹${calculateFinancialMetrics().receivables.toFixed(2)}`,
      color: 'text-orange-400'
    },
    { 
      label: t('debts'), 
      value: `₹${calculateFinancialMetrics().debts.toFixed(2)}`,
      color: 'text-red-400'
    },
  ];

  const milkMetrics = [
    { label: t('totalMilk'), value: `${milkStats.totalMilk} L`, icon: icons.milk, color: "blue-300" },
    { label: t('averageDailyMilk'), value: `${milkStats.averageDailyMilk} L`, icon: icons.milking, color: "blue-400" },
    { label: t('recordsCount'), value: milkStats.recordsCount, icon: icons.calendar, color: "blue-500" },
  ];

  // Get upcoming events sorted by date
  const getUpcomingEvents = () => {
    
    if (!events || events.length === 0) {
      return [];
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const upcomingEvents = events
      .filter(event => {
        if (!event.date) {
          return false;
        }
        
        // Get event date in YYYY-MM-DD format
        const eventDate = new Date(event.date).toISOString().split('T')[0];
        
        // Compare dates as strings and check status
        return eventDate >= today && event.status === 'pending';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
    return upcomingEvents;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('tomorrow');
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-300">
      {/* Header */}
      <View className="flex-row items-center p-2 bg-green-500">
        <TouchableOpacity onPress={toggleSidebar} className="p-2">
          <Image 
            source={icons.menu} 
            className="w-6 h-6"
            tintColor="white"
          />
        </TouchableOpacity>

        <Text className="text-2xl font-semibold text-white flex-1">{t('title')}</Text>

        {/* Refresh Button */}
        <TouchableOpacity 
          onPress={onRefresh}
          className="p-2 mr-2"
          disabled={refreshing}
        >
          <Feather 
            name="refresh-cw" 
            size={24} 
            color="white"
            style={{ transform: [{ rotate: refreshing ? '360deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {/* Language Selection with Current Language */}
        <TouchableOpacity 
          onPress={() => setShowLanguageModal(true)}
          className="flex-row items-center bg-green-600 px-3 py-1 rounded-full"
        >
          <Image 
            source={icons.language} 
            className="w-5 h-5 mr-2"
            tintColor="white"
          />
          <Text className="text-white text-sm font-semibold">
            {getLanguageName(currentLanguage)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLanguageModal(false)}>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-lg p-4 w-3/4">
              <Text className="text-lg font-semibold mb-4 text-center">Select Language</Text>
              {['en', 'hi', 'mr'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => handleLanguageChange(lang)}
                  className={`flex-row items-center p-3 rounded-lg mb-2 ${
                    currentLanguage === lang ? 'bg-green-100' : 'bg-gray-50'
                  }`}
                >
                  <Image 
                    source={icons.language} 
                    className="w-5 h-5 mr-3"
                    tintColor={currentLanguage === lang ? '#3BB273' : '#666'}
                  />
                  <Text className={`text-base ${
                    currentLanguage === lang ? 'text-green-700 font-semibold' : 'text-gray-700'
                  }`}>
                    {getLanguageName(lang)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Sidebar */}
      {isSidebarOpen && (
        <>
          <TouchableOpacity
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 99,
            }}
            activeOpacity={1}
            onPress={() => setIsSidebarOpen(false)}
          />
          <View
            style={{
              position: 'absolute', top: 26, left: 0, height: '100%', width: 256,
              backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 2, height: 0 },
              shadowOpacity: 0.2, shadowRadius: 8, elevation: 10, zIndex: 100,
            }}
          >
            <View className="flex-row p-4 border-b bg-green-500 border-gray-200">
              <Text className="text-2xl font-bold text-white">My Cow</Text>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)} className="pt- p-2 rounded-lg py-1 ml-16 bg-blue-800">
                <Text className="text-white text-bold">{t('close')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1">
                {menuSections.map((section, sectionIndex) => (
                  <View key={sectionIndex} className="mb-6">
                    <Text className="px-4 py-2 text-gray-500 text-base font-medium">
                      {section.title}
                    </Text>
                    {section.items.map((item, itemIndex) => (
                      <TouchableOpacity
                        key={itemIndex}
                        onPress={() => {
                          item.onPress();
                        }}
                        className="flex-row items-center px-4 py-3 border-b border-gray-100"
                      >
                        <Image 
                          source={item.icon} 
                          className="w-6 h-6 mr-4"
                          tintColor="#666666"
                        />
                        <Text className="text-base text-gray-800">{item.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
          </View>
        </>
      )}

      {/* Main Content */}
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Number of Section */}
        <View className="p-2">
          <View className="bg-white rounded-lg shadow-sm mb-2">                
            <SummaryHeader title={t('numberOf')} />
            <View className="p-2">
              {/* All Cattle Count */}
              <TouchableOpacity onPress={()=> router.push("/cow")}>
                <CountCard
                  icon={icons.cow}
                  name={'allCattle'}
                  label={t('allCattle')}
                  count={stats.total}
                  showArrow={true}
                  router={router}
                />
              </TouchableOpacity>

              {/* Cattle Types Grid */}
              <View className="flex-row pl-2 gap-2 mt-2">
                {cattleTypes.map((type, index) => (
                  <CattleTypeCard key={index} {...type} router={router} />
                ))}
              </View>

              {/* Disposed and Deleted */}
              <View className="flex-row justify-between mt-4">
                <CountCard
                  label={t('deleted')}
                  name = {'delete'}
                  count={stats.disposed}
                  showArrow={true}
                  router={router}
                />
                <CountCard
                  label={t('activeCattle')}
                  name = {'activeCattle'}
                  count={stats.presentCows}
                  showArrow={true}
                  router={router}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Conditional Summary Section */}
        <View className="p-2">
          <View className="bg-white rounded-lg shadow-sm mb-4">
            <SummaryHeader title={t('conditionalSummary')} />
            <View className="p-2 flex-row">
              <View className="flex-1 mb-4">
                {conditions.map((condition, index) => (
                  <ConditionCard 
                    key={index} 
                    name = {condition.name}
                    {...condition} 
                    router={router}
                  />
                ))}
              </View>

              <View className="flex-1 justify-start">
                {otherMetrics.map((metrics, index) => (
                  <CountCard
                    key={index}
                    name = {metrics.name}
                    icon={metrics.icon}
                    iconclass="w-6 h-6"
                    label={metrics.label}
                    count={metrics.value}
                    showArrow={metrics.arrow}
                    tailwind={`mt-2 ${metrics.color}`}
                    router={router}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Incomes/Expenses Section */}
        <View className="p-4">
          <View className="bg-white rounded-lg shadow-sm mb-4">
            <View className="flex-row justify-between items-center">
              <SummaryHeader title={t('incomesExpenses')} />
              <TouchableOpacity onPress={()=> router.push("/transactions")}>
                <Text className="text-indigo-800 bg-blue-300 rounded-md p-2 font-medium mr-2">{t('viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <View className="p-4">
              <View className="flex-row justify-between mb-4">
                <View>
                  <Text className="text-gray-600">{t('incomes')}</Text>
                  <Text className="text-xl font-bold text-[#3BB273]">
                    ₹{calculateFinancialMetrics().income.toFixed(2)}
                  </Text>
                  {/* <Text className="text-sm text-orange-400">
                    {t('receivables')}: ₹{calculateFinancialMetrics().receivables.toFixed(2)}
                  </Text> */}
                </View>
                <View className="items-end">
                  <Text className="text-gray-600">{t('expenses')}</Text>
                  <Text className="text-xl font-bold text-red-500">
                    ₹{calculateFinancialMetrics().expenses.toFixed(2)}
                  </Text>
                  {/* <Text className="text-sm text-red-400">
                    {t('debts')}: ₹{calculateFinancialMetrics().debts.toFixed(2)}
                  </Text> */}
                </View>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-[#3BB273]" 
                  style={{ 
                    width: `${Math.min(100, (calculateFinancialMetrics().income / (calculateFinancialMetrics().income + calculateFinancialMetrics().expenses)) * 100)}%` 
                  }} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Milk Summary */}
        <View className="p-4">
          <View className="bg-white rounded-lg shadow-sm mb-4">
            <View className="flex-row justify-between items-center">
              <SummaryHeader title={t('milk')} />
              <TouchableOpacity onPress={()=>router.push("/(screens)/milkRecords")}>
                <Text className="text-indigo-800 bg-blue-300 rounded-md p-2 font-medium mr-2">{t('viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <View className="p-4">
              <View className="flex-row justify-between mb-4">
                <View>
                  <Text className="text-gray-600">{t('totalMilk')}</Text>
                  <Text className="text-xl font-bold text-[#3BB273]">
                    {milkStats.totalMilk} L
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-600">{t('averageDailyMilk')}</Text>
                  <Text className="text-xl font-bold text-[#3BB273]">
                    {milkStats.averageDailyMilk} L
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-gray-600">{t('recordsCount')}</Text>
                  <Text className="text-lg font-semibold text-gray-900">
                    {milkStats.recordsCount}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-600">{t('annualDIM')}</Text>
                  <Text className="text-lg font-semibold text-gray-900">
                    {milkStats.recordsCount * 365} {/* Placeholder for actual DIM calculation */}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming Tasks */}
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">{t('upcomingTasks')}</Text>
            <TouchableOpacity onPress={() => router.push("/events")}>
              <Text className="text-indigo-800 bg-blue-300 rounded-md p-2 font-medium mr-2">{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <View className="space-y-3">
            {getUpcomingEvents().length > 0 ? (
              getUpcomingEvents().map((event) => (
                <TouchableOpacity 
                  key={event.id} 
                  className="bg-white p-4 rounded-xl shadow-sm"
                  onPress={() => router.push(`/events`)}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="font-medium text-gray-900">{t(event.type)}</Text>
                      <Text className="text-gray-600">
                        {event.cowIds.length} {event.cowIds.length === 1 ? t('cow') : t('cows')}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push({
                            pathname: "/(screens)/addEvent",
                            params: { 
                              editMode: true,
                              eventId: event.id,
                              eventType: event.type,
                              eventDate: event.date,
                              eventDescription: event.description,
                              eventCowIds: JSON.stringify(event.cowIds)
                            }
                          });
                        }}
                        className="mr-3"
                      >
                        <MaterialIcons name="edit" size={24} color="#2196F3" />
                      </TouchableOpacity>
                      <View className={`px-3 py-1 rounded-full ${
                        new Date(event.date).toDateString() === new Date().toDateString() 
                          ? 'bg-red-100' 
                          : 'bg-yellow-100'
                      }`}>
                        <Text className={`${
                          new Date(event.date).toDateString() === new Date().toDateString()
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        } font-medium`}>
                          {formatDate(event.date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-white p-4 rounded-xl shadow-sm items-center">
                <Feather name="calendar" size={24} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">{t('noUpcomingEvents')}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}