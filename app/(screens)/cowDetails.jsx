import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl, Alert, Modal, TextInput } from "react-native";
import React from "react";
import { AntDesign, MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { icons } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCows, updateCowStatus } from '../../redux/slices/cowSlice';
import { fetchMilkRecords, fetchMilkRecordsByCowId, deleteMilkRecord } from '../../redux/slices/milkSlice';
import { fetchTransactionsByCowId, deleteTransaction } from '../../redux/slices/transactionSlice';
import { fetchCowEvents, updateEventStatus, deleteCowEvent } from '../../redux/slices/eventSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchHealthRecords } from "../../redux/slices/healthSlice";
import { FontAwesome5 } from '@expo/vector-icons';

const CowDetailsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id, source } = useLocalSearchParams();
  const { cows, loading, error } = useSelector(state => state.cows);
  const { cowEvents, loading: eventsLoading } = useSelector(state => state.events);
  const { cowRecords: milkRecords, loading: milkLoading } = useSelector(state => state.milk);
  const { transactionsByCowId } = useSelector(state => state.transactions);
  const healthRecords = useSelector((state) => state.health.records);
  const healthLoading = useSelector((state) => state.health.loading);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [cowDetails, setCowDetails] = useState(null);
  const [showSaleInput, setShowSaleInput] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');

  const loadCows = useCallback(async () => {
    try {
      await dispatch(fetchCows()).unwrap();
    } catch (err) {
      console.error('Error loading cows:', err);
    }
  }, [dispatch]);

  // Load cows when screen comes into focus
  useEffect(() => {
    loadCows();
  }, [loadCows]);

  // Find the specific cow when cows data changes
  useEffect(() => {
    if (cows && id) {
      const foundCow = cows.find(c => c.id === parseInt(id));
      setCowDetails(foundCow);
    }
  }, [cows, id]);

  const loadEvents = async () => {
    try {
      await dispatch(fetchCowEvents(id)).unwrap();
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [id])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadEvents().finally(() => setRefreshing(false));
  }, []);

  const handleEventStatusChange = async (eventId, newStatus) => {
    try {
      await dispatch(updateEventStatus({ eventId, status: newStatus })).unwrap();
      loadEvents(); // Reload events after deletion
    } catch (error) {
      console.error('Error updating event status:', error);
      Alert.alert(t('error'), t('failedToUpdateEventStatus'));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Alert.alert(
      t('confirmDelete'),
      t('deleteEventConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteCowEvent(eventId)).unwrap();
              loadEvents(); // Reload events after deletion
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert(t('error'), t('failedToDeleteEvent'));
            }
          }
        }
      ]
    );
  };


  const handleDelete = () => {
    Alert.alert(
      t('deleteCow'),
      t('deleteCowConfirmation'),
      [
        {
          text: t('died'),
          onPress: () => {
            dispatch(updateCowStatus({ 
              cowId: id, 
              status: 'died' 
            })).unwrap()
              .then(() => {
                Alert.alert(t('success'), t('cowStatusUpdated'));
                router.back();
              })
              .catch(error => {
                Alert.alert(t('error'), error.message || t('failedToUpdateStatus'));
              });
          }
        },
        {
          text: t('sold'),
          onPress: () => {
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
        cowId: id, 
        status: 'sold',
        saleAmount: parseFloat(saleAmount)
      })).unwrap()
        .then(() => {
          Alert.alert(t('success'), t('cowStatusUpdated'));
          setShowSaleInput(false);
          setSaleAmount('');
          router.back();
        })
        .catch(error => {
          Alert.alert(t('error'), error.message || t('failedToUpdateStatus'));
        });
    } else {
      Alert.alert(t('error'), t('invalidAmount'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('unknown');
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const loadMilkRecords = async () => {
    try {
      await dispatch(fetchMilkRecordsByCowId(id)).unwrap();
    } catch (error) {
      console.error('Error loading milk records:', error);
    }
  };

  // Load milk records when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMilkRecords();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      await dispatch(fetchTransactionsByCowId(id)).unwrap();
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Load transactions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [id])
  );

  // Filter transactions for this specific cow
  const cowTransactions = transactionsByCowId;

  // Calculate total milk production for this cow
  const totalMilkProduction = milkRecords.reduce((total, record) => {
    return total + (parseFloat(record.totalProduced) || 0);
  }, 0);

  // Calculate financial summary for this cow
  const financialSummary = {
    income: cowTransactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + (parseFloat(t.amount) || 0), 0),
    expenses: cowTransactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + (parseFloat(t.amount) || 0), 0),
    net: 0
  };
  
  financialSummary.net = financialSummary.income - financialSummary.expenses;

  // Helper function to safely parse JSON
  const safeJsonParse = (str) => {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error('JSON parse error:', error);
      return [];
    }
  };

  // Ensure cowEvents have properly parsed cowIds
  const safeCowEvents = cowEvents.map(event => {
    if (typeof event.cowIds === 'string') {
      return {
        ...event,
        cowIds: safeJsonParse(event.cowIds)
      };
    }
    return event;
  });

  // Load health records when screen comes into focus
  const loadHealthRecord = async () => {
    try {
      await dispatch(fetchHealthRecords(id)).unwrap();
    } catch (error) {
      console.error('Error loading health records:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadHealthRecord();
    }, [id])
  );

  const HealthHistorySection = ({ cowId, healthRecords }) => {
    const router = useRouter();
    const { t } = useTranslation();

    return (
      <View className=" p-3 mb-6 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold">{t('health.healthHistory')}</Text>
          <TouchableOpacity
            className="bg-green-500 px-4 py-2 rounded-lg"
            onPress={() => router.push({
              pathname: '/healthRecord',
              params: { cowId }
            })}
          >
            <Text className="text-white font-semibold">{t('health.addHealthRecord')}</Text>
          </TouchableOpacity>
        </View>

        {healthRecords.length === 0 ? (
          <Text className="text-gray-500 text-center py-4">{t('health.noHealthRecords')}</Text>
        ) : (
          healthRecords.map((record) => (
            <TouchableOpacity
              key={record.id}
              className="bg-white p-4 rounded-lg mb-3 shadow-sm"
              onPress={() => router.push({
                pathname: '/healthRecord',
                params: { id: record.id }
              })}
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold">{record.disease}</Text>
                <View className={`px-2 py-1 rounded ${
                  record.status === 'active' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Text className={`text-sm ${
                    record.status === 'active' ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {t(`health.${record.status}`)}
                  </Text>
                </View>
              </View>
              
              {record.symptoms && (
                <Text className="text-gray-600 mb-2">
                  <Text className="font-semibold">{t('health.symptoms')}: </Text>
                  {record.symptoms}
                </Text>
              )}
              
              {record.diagnosis && (
                <Text className="text-gray-600 mb-2">
                  <Text className="font-semibold">{t('health.diagnosis')}: </Text>
                  {record.diagnosis}
                </Text>
              )}
              
              {record.treatment && (
                <Text className="text-gray-600 mb-2">
                  <Text className="font-semibold">{t('health.treatment')}: </Text>
                  {record.treatment}
                </Text>
              )}

              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-500 text-sm">
                  {t('health.startDate')}: {new Date(record.startDate).toLocaleDateString()}
                </Text>
                {record.endDate && (
                  <Text className="text-gray-500 text-sm">
                    {t('health.endDate')}: {new Date(record.endDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const EventItem = ({ event, onStatusChange, onDelete }) => {
    const { t } = useTranslation();
    const router = useRouter();
    const getStatusIcon = (status) => {
      switch (status) {
        case 'completed':
          return <MaterialIcons name="check-circle" size={24} color="#4CAF50" />;
        case 'pending':
          return <MaterialIcons name="pending" size={24} color="#FFA000" />;
        default:
          return <MaterialIcons name="help" size={24} color="#757575" />;
      }
    };

    return (
      <View className="bg-white p-4 rounded-lg mb-2 shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            {getStatusIcon(event.status)}
            <Text className="ml-2 text-lg font-semibold">{event.type}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: "/(screens)/addEvent",
                params: { 
                  editMode: true,
                  eventId: event.id,
                  eventType: event.type,
                  eventDate: event.date,
                  eventDescription: event.description,
                  eventCowIds: JSON.stringify(event.cowIds)
                }
              })}
              className="mr-3"
            >
              <MaterialIcons name="edit" size={24} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onStatusChange(event.id, event.status === 'completed' ? 'pending' : 'completed')}
              className={`px-3 py-1 rounded-full mr-3 ${
                event.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
              }`}
            >
              <Text className={
                event.status === 'completed' ? 'text-green-700' : 'text-yellow-700'
              }>
                {event.status === 'completed' ? t('completed') : t('pending')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(event.id)}>
              <MaterialIcons name="delete" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-gray-600 mb-1">{formatDate(event.date)}</Text>
        {event.description && (
          <Text className="text-gray-600">{event.description}</Text>
        )}
      </View>
    );
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

  if (!cowDetails) {
    return (
      <SafeAreaView className="h-full w-full">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center">{t('cowNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full w-full">
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="flex-row items-center p-4 bg-green-400 shadow-md">
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text className="ml-4 text-xl font-bold">{cowDetails.name || t('unnamed')}</Text>
        </View>

        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Summary Section */}
          <View className="bg-white  border-b-2 border-black-200 p-4 mb-4">
            <Text className="text-lg font-semibold mb-4">{t('summary')}</Text>
            
            <View className="flex-row justify-between mb-4">
              <View className="bg-blue-50 p-3 rounded-lg flex-1 mr-2">
                <Text className="text-gray-600 text-center">{t('totalMilkProduction')}</Text>
                <Text className="text-blue-600 font-bold text-center text-lg">{totalMilkProduction.toFixed(1)} L</Text>
              </View>
              
              <View className="bg-green-50 p-3 rounded-lg flex-1 ml-2">
                <Text className="text-gray-600 text-center">{t('netValue')}</Text>
                <Text className={`font-bold text-center text-lg ${
                  financialSummary.net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {financialSummary.net >= 0 ? '+' : ''}{financialSummary.net.toFixed(2)}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between">
              <View className="bg-green-50 p-3 rounded-lg flex-1 mr-2">
                <Text className="text-gray-600 text-center">{t('totalIncome')}</Text>
                <Text className="text-green-600 font-bold text-center text-lg">+{financialSummary.income.toFixed(2)}</Text>
              </View>
              
              <View className="bg-red-50 p-3 rounded-lg flex-1 ml-2">
                <Text className="text-gray-600 text-center">{t('totalExpenses')}</Text>
                <Text className="text-red-600 font-bold text-center text-lg">-{financialSummary.expenses.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Cow Image and Basic Info */}
          <View className="bg-white border-2 border-r-0 border-l-0 border-black-200 p-4 mb-4">
            <View className="flex-row justify-end">
                <TouchableOpacity
                  className="flex-row items-center bg-blue-500 px-2 py-2 rounded-lg"
                  onPress={() => router.push({
                    pathname: "/(screens)/addCow",
                    params: { 
                      cowId: cowDetails.id,
                      edit: true,
                      cowData: JSON.stringify(cowDetails)
                    }
                  })}
                >
                  <MaterialIcons name="edit" size={20} color="white" />
                  {/* <Text className="text-white text-lg ml-2 ">{t('edit')}</Text> */}
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-row items-center bg-red-500 ml-2 px-2 py-2 rounded-lg"
                  onPress={handleDelete}
                >
                  <MaterialIcons name="delete" size={20} color="white" />
                  {/* <Text className="text-white ml-2 text-lg ">{t('delete')}</Text> */}
                </TouchableOpacity>

            </View>
            <View className="items-center mb-4">
              <Image
                source={cowDetails.gender === 'male' ? icons.bull : icons.cow}
                className="w-32 h-32"
                resizeMode="contain"
              />
            </View>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('earTagNumber')}:</Text>
                <Text className="font-medium">{cowDetails.earTagNumber}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('gender')}:</Text>
                <Text className="font-medium">{t(cowDetails.gender)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('breed')}:</Text>
                <Text className="font-medium">{t(cowDetails.cattleBreed || 'unknown')}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('stage')}:</Text>
                <Text className="font-medium">{t(cowDetails.cattleStage || 'unknown')}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('status')}:</Text>
                <Text className="font-medium">{t(cowDetails.cattleStatus || 'unknown')}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('healthStatus')}:</Text>
                <Text className={`font-medium ${cowDetails.isSick ? 'text-red-500' : 'text-green-500'}`}>
                  {cowDetails.isSick ? t('sick') : t('healthy')}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('weight')}:</Text>
                <Text className="font-medium">{cowDetails.weight || '0'} kg</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('dateOfBirth')}:</Text>
                <Text className="font-medium">{formatDate(cowDetails.dateOfBirth)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{t('dateOfEntry')}:</Text>
                <Text className="font-medium">{formatDate(cowDetails.dateOfEntry)}</Text>
              </View>
              {(cowDetails.cattleStatus === 'inseminated' || 
                cowDetails.cattleStatus === 'inseminatedAndLactating' || 
                cowDetails.cattleStatus === 'inseminatedAndNonLactating') && 
                cowDetails.inseminationDate && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">{t('inseminationDate')}:</Text>
                  <Text className="font-medium">{formatDate(cowDetails.inseminationDate)}</Text>
                </View>
              )}
              {cowDetails.lastDeliveryDate && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">{t('lastDeliveryDate')}:</Text>
                  <Text className="font-medium">{formatDate(cowDetails.lastDeliveryDate)}</Text>
                </View>
              )}
              {cowDetails.motherTagNo && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">{t('motherTagNo')}:</Text>
                  <Text className="font-medium">{cowDetails.motherTagNo}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Events Section */}
          <View className="bg-gray-50 p-4 rounded-lg mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">{t('events')}</Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: "/(screens)/addEvent",
                  params: { 
                    cowId: id,
                    cowName: cowDetails.name,
                    earTagNumber: cowDetails.earTagNumber,
                    fromCowDetails: true 
                  }
                })}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <View className="flex-row items-center">
                  <Ionicons name="add" size={20} color="white" />
                  <Text className="text-white ml-1">{t('addEvent')}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ maxHeight: 300 }}>
              {eventsLoading ? (
                <Text>{t('loading')}...</Text>
              ) : cowEvents.length === 0 ? (
                <Text className="text-gray-500 text-center">{t('noEvents')}</Text>
              ) : (
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {cowEvents.map(event => (
                    <EventItem
                      key={event.id}
                      event={event}
                      onStatusChange={handleEventStatusChange}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Milk Records Section */}
          <View className="bg-white p-4 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">{t('milkRecords')}</Text>
              <TouchableOpacity 
                className="bg-blue-500 px-4 py-2 rounded-lg"
                onPress={() => {
                  router.push({
                    pathname: "/(screens)/addMilk",
                    params: { 
                      cowId: id,
                      cowName: cowDetails.name,
                      earTagNumber: cowDetails.earTagNumber,
                      fromCowDetails: true 
                    }
                  });
                }}
              >
                <Text className="text-white">{t('addMilkRecord')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ maxHeight: 300 }}>
              {milkLoading ? (
                <Text>{t('loading')}...</Text>
              ) : milkRecords.length === 0 ? (
                <Text className="text-gray-500">{t('noMilkRecords')}</Text>
              ) : (
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {milkRecords.map((record) => (
                    <View key={record.id} className="bg-white p-3 rounded-lg mb-2 shadow-sm">
                      <View className="flex-row justify-between items-center mb-2">
                        <View>
                          <Text className="font-medium">{formatDate(record.date)}</Text>
                          <Text className="text-gray-600 text-sm">{record.notes || ''}</Text>
                        </View>
                        <View className="flex-row items-center space-x-3">
                          <Text className="font-medium">{record.totalProduced} L</Text>
                          <TouchableOpacity
                            onPress={() => {
                              router.push({
                                pathname: "/(screens)/addMilk",
                                params: { record: JSON.stringify(record) }
                              });
                            }}
                          >
                            <Feather name="edit-2" size={20} color="#2196F3" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              Alert.alert(
                                t('confirmDelete'),
                                t('deleteMilkRecordConfirmation'),
                                [
                                  {
                                    text: t('cancel'),
                                    style: 'cancel'
                                  },
                                  {
                                    text: t('delete'),
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        await dispatch(deleteMilkRecord(record.id)).unwrap();
                                        loadMilkRecords();
                                        Alert.alert(t('success'), t('milkRecordDeletedSuccessfully'));
                                      } catch (error) {
                                        console.error('Error deleting milk record:', error);
                                        Alert.alert(t('error'), error.message || t('failedToDeleteMilkRecord'));
                                      }
                                    }
                                  }
                                ]
                              );
                            }}
                          >
                            <Feather name="trash-2" size={20} color="red" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View className="flex-row justify-between mt-2">
                        <View className="flex-row items-center">
                          <Text className="text-gray-600 mr-2">{t('ratePerLitre')}:</Text>
                          <Text className="font-medium">₹{record.milkRate}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="text-gray-600 mr-2">{t('totalIncome')}:</Text>
                          <Text className="font-medium text-green-600">₹{record.totalIncome}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Transactions Section */}
          <View className="bg-white p-4 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">{t('transactions')}</Text>
              <TouchableOpacity 
                className="bg-blue-500 px-4 py-2 rounded-lg"
                onPress={() => {
                  router.push({
                    pathname: "/(screens)/addTransaction",
                    params: { 
                      cowId: id,
                      cowName: cowDetails.name,
                      earTagNumber: cowDetails.earTagNumber,
                      fromCowDetails: true 
                     }
                  });
                }}
              >
                <Text className="text-white">{t('addTransaction')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ maxHeight: 300 }}>
              {cowTransactions.length === 0 ? (
                <Text className="text-gray-500 text-center py-4">
                  {t('noTransactions')}
                </Text>
              ) : (
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {cowTransactions.map(transaction => (
                    <View key={transaction.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-semibold">{formatDate(transaction.date)}</Text>
                        <Text className={`font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'} {transaction.amount}
                        </Text>
                      </View>
                      
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600">{transaction.category}</Text>
                        <View className="flex-row space-x-3">
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
                                  transactionCowName: cowDetails.name,
                                  transactionCowEarTag: cowDetails.earTagNumber
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
                                    onPress: async () => {
                                      try {
                                        await dispatch(deleteTransaction(transaction.id)).unwrap();
                                        loadTransactions();
                                        Alert.alert(t('success'), t('transactionDeletedSuccessfully'));
                                      } catch (error) {
                                        console.error('Error deleting transaction:', error);
                                        Alert.alert(t('error'), error.message || t('failedToDeleteTransaction'));
                                      }
                                    }
                                  }
                                ]
                              );
                            }}
                          >
                            <Feather name="trash-2" size={20} color="red" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {transaction.description && (
                        <Text className="text-gray-600">{transaction.description}</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          <HealthHistorySection 
            cowId={id} 
            healthRecords={healthRecords} 
          />
        </ScrollView>

        {/* Action Buttons */}
        {/* <View className="flex-row justify-around p-1 bg-green-500 border-t border-gray-200">
          <TouchableOpacity
            className="flex-row items-center bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.push({
              pathname: "/(screens)/addCow",
              params: { 
                cowId: cowDetails.id,
                edit: true,
                cowData: JSON.stringify(cowDetails)
              }
            })}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text className="text-white text-lg ml-2 ">{t('edit')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center bg-red-500 px-4 py-2 rounded-lg"
            onPress={handleDelete}
          >
            <MaterialIcons name="delete" size={20} color="white" />
            <Text className="text-white ml-2 text-lg ">{t('delete')}</Text>
          </TouchableOpacity>
        </View> */}
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
    </SafeAreaView>
  );
};

export default CowDetailsScreen; 