import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { fetchMilkRecords, setDateRange, deleteMilkRecord } from '../../redux/slices/milkSlice';
import { fetchCows } from '../../redux/slices/cowSlice';
import DateRangeFilter from '../../components/DateRangeFilter';
import { icons } from '../../constants';
import { Loader } from '../../components';

const MilkRecordsScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [showFilter, setShowFilter] = useState(false);
  const { records, loading, selectedRange } = useSelector(state => state.milk);
  const { cows } = useSelector(state => state.cows);

  const summary = useMemo(() => {
    if (!records || records.length === 0) {
      return { totalMilk: '0.00', totalIncome: '0.00' };
    }
    const totalMilk = records.reduce((sum, record) => sum + (parseFloat(record.totalProduced) || 0), 0);
    const totalIncome = records.reduce((sum, record) => sum + (parseFloat(record.totalIncome) || 0), 0);
    return {
      totalMilk: totalMilk.toFixed(2),
      totalIncome: totalIncome.toFixed(2)
    };
  }, [records]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  };

  const calculateDateRange = (range) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999); // Set end date to end of today

    switch (range) {
      case 'last7Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6); // Include today and 6 days before
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'currentMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'previousMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'last3Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last6Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last12Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 12, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'currentYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'previousYear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      case 'last3Years':
        startDate = new Date(today.getFullYear() - 3, 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'last6Years':
        startDate = new Date(today.getFullYear() - 6, 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'allTime':
        return null; // No date range filter
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6); // Default to last 7 days
        startDate.setHours(0, 0, 0, 0);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const loadMilkRecords = () => {
    const dateRange = calculateDateRange(selectedRange);
    console.log('Date Range:', dateRange); // Add logging to debug
    dispatch(fetchMilkRecords(dateRange));
  };

  useEffect(() => {
    loadMilkRecords();
    dispatch(fetchCows());
  }, [selectedRange]);

  const handleEdit = (record) => {
    router.push({
      pathname: "/(screens)/addMilk",
      params: { record: JSON.stringify(record) }
    });
  };

  const handleDelete = (record) => {
    Alert.alert(
      t('confirmDelete'),
      t('deleteMilkRecordConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            dispatch(deleteMilkRecord(record.id))
              .unwrap()
              .then(() => {
                loadMilkRecords();
              })
              .catch(error => {
                Alert.alert(t('error'), error.message || t('failedToDeleteMilkRecord'));
              });
          }
        }
      ]
    );
  };

  const getCowNames = (cowIds) => {
    if (!cowIds || cowIds.length === 0) return t('allCows');
    if (cowIds[0] === 'all') return t('allCows');
    
    return cowIds.map(id => {
      const cow = cows.find(c => c.id.toString() === id.toString());
      return cow ? `${cow.earTagNumber}${cow.name ? ` - ${cow.name}` : ''}` : id;
    }).join(', ');
  };

  const renderMilkRecord = ({ item }) => (
    <View className="bg-white p-4 rounded-lg mb-2 shadow-sm">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          {formatDate(item.date)}
        </Text>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            className="bg-blue-500 p-2 rounded-full"
          >
            <Ionicons name="pencil" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            className="bg-red-500 p-2 rounded-full"
          >
            <Ionicons name="trash" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">{t('cows')}:</Text>
        <Text className="font-semibold text-right flex-1 ml-2">{getCowNames(item.cowIds)}</Text>
      </View>
      
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">{t('amTotal')}:</Text>
        <Text className="font-semibold">{item.amTotal} L</Text>
      </View>
      
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">{t('pmTotal')}:</Text>
        <Text className="font-semibold">{item.pmTotal} L</Text>
      </View>
      
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">{t('totalProduced')}:</Text>
        <Text className="font-semibold">{item.totalProduced} L</Text>
      </View>

      <View className="border-t border-gray-200 my-2" />

      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-600">{t('amRatePerLitre')}:</Text>
        <Text className="font-semibold">₹{item.milkRateAm?.toFixed(2) || '0.00'}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">{t('pmRatePerLitre')}:</Text>
        <Text className="font-semibold">₹{item.milkRatePm?.toFixed(2) || '0.00'}</Text>
      </View>

      <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
        <Text className="text-gray-800 font-bold">{t('totalIncome')}:</Text>
        <Text className="font-bold text-lg text-green-600">₹{item.totalIncome?.toFixed(2) || '0.00'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-green-500 shadow-sm">
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold">{t('milkRecords')}</Text>
        <TouchableOpacity onPress={() => setShowFilter(true)}>
          <Feather name="filter" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Summary Section */}
      {!loading && records.length > 0 && (
        <View className="p-4 bg-white border-b border-gray-200 mx-4 mt-4 rounded-lg shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">{t('summary')}</Text>
          <View className="flex-row justify-around">
            <View className="items-center p-2 flex-1">
              <Text className="text-gray-600">{t('totalMilk')}</Text>
              <Text className="text-2xl font-bold text-blue-600">{summary.totalMilk} L</Text>
            </View>
            <View className="items-center p-2 flex-1">
              <Text className="text-gray-600">{t('totalIncome')}</Text>
              <Text className="text-2xl font-bold text-green-600">₹{summary.totalIncome}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Loader />
        </View>
      ) : records.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Image 
            source={icons.noData}
            className="w-16 h-16 mb-4"
            tintColor="#9CA3AF"
          />
          <Text className="text-gray-500 text-center">
            {t('noMilkRecords')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderMilkRecord}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/(screens)/addMilk")}
      >
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Date Range Filter */}
      <DateRangeFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onSelect={(range) => dispatch(setDateRange(range))}
        selectedRange={selectedRange}
      />
    </SafeAreaView>
  );
};

export default MilkRecordsScreen; 