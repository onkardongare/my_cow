import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl, Alert, TextInput, Modal } from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { icons } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCows, updateCowStatus } from '../../redux/slices/cowSlice';
import { CattleFilter } from '../../components';

const CattleRecordScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { cows, loading, error } = useSelector(state => state.cows);
  const [refreshing, setRefreshing] = useState(false);
  const [showSaleInput, setShowSaleInput] = useState(false);
  const [selectedCow, setSelectedCow] = useState(null);
  const [saleAmount, setSaleAmount] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredCows, setFilteredCows] = useState([]);
  const [isFromOtherScreen, setIsFromOtherScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);

  // Extract unique breeds, stages, and statuses from cows
  const breeds = [...new Set(cows.map(cow => cow.cattleBreed).filter(Boolean))];
  const stages = [...new Set(cows.map(cow => cow.cattleStage).filter(Boolean))];
  const statuses = [...new Set(cows.map(cow => cow.cattleStatus).filter(Boolean))];

  const loadCows = useCallback(async () => {
    try {
      await dispatch(fetchCows()).unwrap();
    } catch (err) {
      console.error('Error loading cows:', err);
    }
  }, [dispatch]);

  // Load cows when component mounts
  useEffect(() => {
    loadCows();
  }, [loadCows]);

  // Check if coming from another screen
  useEffect(() => {
    if (params.from) {
      setIsFromOtherScreen(true);
    }
  }, [params.from]);

  // Apply filters whenever cows, activeFilters, or searchQuery change, but only if not coming from another screen
  useEffect(() => {
    if (!isFromOtherScreen) {
      applyFilters(cows, activeFilters);
    } else {
      // If coming from another screen, don't apply filters
      setFilteredCows(cows);
    }
  }, [cows, activeFilters, isFromOtherScreen, searchQuery]);

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const applyFilters = (cowsToFilter, filters) => {
    let result = [...cowsToFilter];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(cow => {
        const searchableFields = [
          cow.earTagNumber,
          cow.name,
          cow.cattleBreed,
          cow.cattleStage,
          cow.cattleStatus
        ].map(field => (field || '').toLowerCase());

        return searchableFields.some(field => field.includes(query));
      });
    }
    
    // Apply breed filter
    if (filters.breed) {
      result = result.filter(cow => cow.cattleBreed === filters.breed);
    }
    
    // Apply stage filter
    if (filters.stage) {
      result = result.filter(cow => cow.cattleStage === filters.stage);
    }
    
    // Apply status filter
    if (filters.status) {
      result = result.filter(cow => cow.cattleStatus === filters.status);
    }
    
    // Apply date of birth filter
    if (filters.dateOfBirthRange && filters.dateOfBirthRange !== 'all' && filters.customDate) {
      const filterDate = new Date(filters.customDate);
      filterDate.setHours(0, 0, 0, 0);
      
      result = result.filter(cow => {
        if (!cow.dateOfBirth) return false;
        
        const cowDate = new Date(cow.dateOfBirth);
        cowDate.setHours(0, 0, 0, 0);
        
        if (filters.dateOfBirthRange === 'before') {
          return cowDate <= filterDate;
        } else if (filters.dateOfBirthRange === 'after') {
          return cowDate >= filterDate;
        }
        
        return true;
      });
    }
    
    setFilteredCows(result);
  };

  // Update filtered cows whenever search query changes
  useEffect(() => {
    applyFilters(cows, activeFilters);
  }, [searchQuery, cows, activeFilters]);

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

  const handleDeleteCow = (cow) => {
    Alert.alert(
      t('deleteCow'),
      t('deleteCowConfirmation'),
      [
        {
          text: t('died'),
          onPress: () => {
            dispatch(updateCowStatus({ 
              cowId: cow.id, 
              status: 'died' 
            })).unwrap()
              .then(() => {
                Alert.alert(t('success'), t('cowStatusUpdated'));
              })
              .catch(error => {
                Alert.alert(t('error'), error.message || t('failedToUpdateStatus'));
              });
          }
        },
        {
          text: t('sold'),
          onPress: () => {
            setSelectedCow(cow);
            setShowSaleInput(true);
          }
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  const handleSaleSubmit = () => {
    if (saleAmount && !isNaN(saleAmount)) {
      dispatch(updateCowStatus({ 
        cowId: selectedCow.id, 
        status: 'sold',
        saleAmount: parseFloat(saleAmount)
      })).unwrap()
        .then(() => {
          Alert.alert(t('success'), t('cowStatusUpdated'));
          setShowSaleInput(false);
          setSaleAmount('');
          setSelectedCow(null);
        })
        .catch(error => {
          Alert.alert(t('error'), error.message || t('failedToUpdateStatus'));
        });
    } else {
      Alert.alert(t('error'), t('invalidAmount'));
    }
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setIsFromOtherScreen(false); // Reset the flag when filters are applied
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

  if (error && !refreshing) {
    return (
      <SafeAreaView className="h-full w-full">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity 
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={loadCows}
          >
            <Text className="text-white">{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Use filteredCows if filters are active, otherwise use all cows
  const displayCows = Object.keys(activeFilters).length > 0 ? filteredCows : cows;

  return (
    <SafeAreaView className="h-full w-full">
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="flex-row items-center p-4 bg-green-400 shadow-md">
          <Text className="ml-2 text-xl font-bold">{t('cattle')}</Text>
          <View className="flex-row ml-auto">
            <TouchableOpacity 
              className="bg-white p-2 rounded-lg mr-2"
              onPress={() => {
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              <AntDesign name="search1" size={20} color="green" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-white p-2 rounded-lg mr-2"
              onPress={() => setShowFilter(true)}
            >
              <Feather name="filter" size={20} color="green" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View className="p-4 bg-white border-b border-gray-200">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2">
              <AntDesign name="search1" size={20} color="gray" />
              <TextInput
                ref={searchInputRef}
                className="flex-1 ml-2 text-gray-700"
                placeholder={t('searchCows')}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  applyFilters(cows, activeFilters);
                }}
                autoFocus={true}
              />
              {searchQuery ? (
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    applyFilters(cows, activeFilters);
                  }}
                >
                  <AntDesign name="closecircle" size={20} color="gray" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity 
                className="ml-2"
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  applyFilters(cows, activeFilters);
                }}
              >
                <Text className="text-gray-600">{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredCows.length === 0 ? (
            <View className="p-4 items-center">
              <Text className="text-gray-500">{t('cowNotFound')}</Text>
            </View>
          ) : (
            filteredCows.map((cow) => (
              <TouchableOpacity
                key={cow.id}
                className="bg-white p-4 rounded-lg mb-4 shadow-sm"
                onPress={() => router.push({
                  pathname :`/(screens)/cowDetails`,
                  params: {id: cow.id, source: cow}
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
                        <TouchableOpacity
                          className="bg-red-100 p-2 rounded-lg ml-2"
                          onPress={() => handleDeleteCow(cow)}
                        >
                          <Feather name="trash-2" size={20} color="red" />
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

                  {cow.cattleStage === 'cow' && cow.lastDeliveryDate && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">{t('lastDeliveryDate')}:</Text>
                      <Text className="font-medium">{formatDate(cow.lastDeliveryDate)}</Text>
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
            ))
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          onPress={() => router.push("/(screens)/addCow")}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Sale Amount Input Modal */}
      <Modal
        visible={showSaleInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSaleInput(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-4 rounded-lg w-4/5">
            <Text className="text-lg font-semibold mb-2">{t('saleAmount')}</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder={t('enterSaleAmount')}
              keyboardType="numeric"
              value={saleAmount}
              onChangeText={setSaleAmount}
            />
            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity
                className="bg-gray-200 px-4 py-2 rounded-lg"
                onPress={() => {
                  setShowSaleInput(false);
                  setSaleAmount('');
                  setSelectedCow(null);
                }}
              >
                <Text>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-500 px-4 py-2 rounded-lg"
                onPress={handleSaleSubmit}
              >
                <Text className="text-white">{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cattle Filter Modal */}
      <CattleFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilters}
        breeds={breeds}
        stages={stages}
        statuses={statuses}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

export default CattleRecordScreen;
