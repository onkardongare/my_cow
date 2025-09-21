import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCows } from '../../redux/slices/cowSlice';
import { Feather } from "@expo/vector-icons";
import { icons } from "../../constants";
import { AntDesign } from "@expo/vector-icons";

const FilterCattleScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { cows, deletedCows, loading } = useSelector(state => state.cows);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredCows, setFilteredCows] = useState([]);

  const loadCows = useCallback(async () => {
    try {
      await dispatch(fetchCows()).unwrap();
    } catch (err) {
      console.error('Error loading cows:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    loadCows();
  }, [loadCows]);

  useEffect(() => {
    if (cows && params.filter) {
      const filterType = params.filter;
      let filtered = [];

      switch (filterType) {
        case 'sick':
          filtered = cows.filter(cow => cow.isSick === 1);
          break;
        case 'pregnant':
          filtered = cows.filter(cow => (cow.cattleStatus === 'pregnant'|| cow.cattleStatus === 'lactatingAndPregnant' || cow.cattleStatus === 'nonLactatingAndPregnant'));
          break;
        case 'milking':
          filtered = cows.filter(cow => (cow.cattleStatus === 'lactating' || cow.cattleStatus === 'inseminatedAndLactating' || cow.cattleStatus === 'lactatingAndPregnant'));
          break;
        case 'dry':
          filtered = cows.filter(cow => (cow.cattleStatus === 'nonLactating' || cow.cattleStatus === 'nonLactatingAndPregnant'|| cow.cattleStatus === 'inseminatedAndNonLactating'));
          break;
        case 'inseminated':
          filtered = cows.filter(cow => (cow.cattleStatus === 'inseminated' || cow.cattleStatus === 'inseminatedAndLactating' || cow.cattleStatus === 'inseminatedAndNonLactating'));
          break;
        case 'fresh':
          filtered = cows.filter(cow => cow.cattleStatus === 'fresh');
          break;
        case 'open':
          filtered = cows.filter(cow => cow.cattleStatus === 'open');
          break;
        case 'delete':
          filtered = deletedCows;
          break;
        case 'activecattle':
          filtered = cows.filter(cow => cow.isPresent === 1);
          break;
        case 'calves':
          filtered = cows.filter(cow => cow.cattleStage === 'calf');
          break;
        case 'heifers':
          filtered = cows.filter(cow => cow.cattleStage === 'heifer');
          break;
        case 'cows':
          filtered = cows.filter(cow => cow.cattleStage === 'cow');
          break;
        default:
          filtered = [...cows, ...deletedCows];
      }

      setFilteredCows(filtered);
    }
  }, [cows, params.filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCows();
    } finally {
      setRefreshing(false);
    }
  }, [loadCows]);

  const formatDate = (dateString) => {
    if (!dateString) return t('unknown');
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getFilterTitle = () => {
    console.log(params.filter)
    switch (params.filter) {
      case 'sick': return t('sick');
      case 'pregnant': return t('pregnant');
      case 'milking': return t('milking');
      case 'dry': return t('dry');
      case 'inseminated': return t('inseminated');
      case 'fresh': return t('fresh');
      case 'open': return t('open');
      case 'delete': return t('delete')
      case 'calves': return t('calves');
      case 'heifers': return t('heifers');
      case 'cows': return t('cows');
      case 'activecattle': return t('activeCattle');
      default: return t('allCattle');
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="h-full w-full">
        <View className="flex-1 justify-center items-center">
          <Text>{t('loading')}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full w-full">
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="flex-row items-center p-4 bg-green-400 shadow-md">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-2"
          >
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">{getFilterTitle()}</Text>
        </View>

        {/* Content */}
        {filteredCows.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <View className="flex-1 justify-center items-center">
              <View className="bg-purple-200 p-6 rounded-lg items-center">
                <Image
                  source={icons.cow}
                  className="w-36 h-36 mb-2"
                  resizeMode="contain"
                />
                <Text className="text-center text-gray-700 text-base">
                  {t('noCattleMatchFilters')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
            className="absolute bottom-6 right-6 bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            onPress={() => router.push("/(screens)/addCow")}
          >
            <AntDesign name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <ScrollView 
              className="flex-1 p-4"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {filteredCows.map((cow) => (
                <TouchableOpacity
                  key={cow.id}
                  className="bg-white p-4 rounded-lg mb-4 shadow-sm"
                  onPress={() => router.push({
                    pathname: `/(screens)/cowDetails`,
                    params: { id: cow.id, source: cow }
                  })}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-lg font-semibold">{cow.name || t('unnamed')}</Text>
                      <Text className="text-gray-600">ID: {cow.earTagNumber}</Text>
                    </View>
                    <View className="flex-row items-center">
                      {cow.isPresent ? (
                        <>
                          {cow.isSick === 1 && (
                            <View className="bg-red-100 px-3 py-1 rounded-full mr-2">
                              <Text className="text-red-700 font-medium">{t('sick')}</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            className="bg-blue-100 p-2 rounded-lg ml-2"
                            onPress={() => router.push({
                              pathname: "/(screens)/addCow",
                              params: { 
                                cowId: cow.id,
                                edit: true,
                                cowData: JSON.stringify(cow)
                              }
                            })}
                          >
                            <Feather name="edit" size={20} color="blue" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <Text className="text-red-500 font-semibold">
                          {t(cow.status)}
                          {cow.saleAmount ? ` (${t('soldFor')}: ₹${cow.saleAmount})` : ''}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="mt-3 space-y-1">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('gender')}:</Text>
                      <Text className="font-medium">{t(cow.gender)}</Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('breed')}:</Text>
                      <Text className="font-medium">{t(cow.cattleBreed || 'unknown')}</Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('stage')}:</Text>
                      <Text className="font-medium">{t(cow.cattleStage || 'unknown')}</Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('status')}:</Text>
                      <Text className="font-medium">{t(cow.cattleStatus || 'unknown')}</Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('weight')}:</Text>
                      <Text className="font-medium">{cow.weight || '0'} kg</Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('dateOfBirth')}:</Text>
                      <Text className="font-medium">{formatDate(cow.dateOfBirth)}</Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('dateOfEntry')}:</Text>
                      <Text className="font-medium">{formatDate(cow.dateOfEntry)}</Text>
                    </View>

                    {(cow.cattleStatus === 'inseminated' || 
                      cow.cattleStatus === 'inseminatedAndLactating' || 
                      cow.cattleStatus === 'inseminatedAndNonLactating') && 
                      cow.inseminationDate && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">{t('inseminationDate')}:</Text>
                        <Text className="font-medium">{formatDate(cow.inseminationDate)}</Text>
                      </View>
                    )}

                    {cow.motherTagNo && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">{t('motherTagNo')}:</Text>
                        <Text className="font-medium">{cow.motherTagNo}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {(params.filter=="allcattle" || params.filter=="activecattle") && <TouchableOpacity
              className="absolute bottom-6 right-6 bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              onPress={() => router.push("/(screens)/addCow")}
            >
              <AntDesign name="plus" size={24} color="white" />
            </TouchableOpacity>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default FilterCattleScreen;
