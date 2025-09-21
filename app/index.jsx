import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { changeLanguage, initializeLanguage } from '../redux/slices/langSlice';
import icon from '../assets/images/icon.png'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const OnboardingScreen = () => {
  const router = useRouter();
  const { t }  = useTranslation();
  const dispatch = useDispatch();
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const currentLanguage = useSelector((state) => state.language.lang);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize language when app starts
        await dispatch(initializeLanguage());
        await checkFirstTime();
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [dispatch]);

  const checkFirstTime = async () => {
    try {
      const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');
      if (hasSeenIntro === 'true') {
        setIsFirstTime(false);
        router.replace('/home');
      }
    } catch (error) {
      console.error('Error checking first time status:', error);
    }
  }
  
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
      router.replace('/home');
    } catch (error) {
      console.error('Error setting hasSeenIntro:', error);
    }
  };

  const handleLanguageChange = (lang) => {
    dispatch(changeLanguage(lang));
  };

  const getLanguageName = (lang) => {
    switch (lang) {
      case 'en': return 'English';
      case 'hi': return 'हिंदी';
      case 'mr': return 'मराठी';
      default: return 'English';
    }
  };

  // If loading or not first time, don't render anything
  if (isLoading || !isFirstTime) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Language Selection */}
      <View className="absolute top-10 right-5 z-10">
        <View className="flex-row space-x-2">
          {['en', 'hi', 'mr'].map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => handleLanguageChange(lang)}
              className={`px-4 py-2 rounded-full ${
                currentLanguage === lang ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <Text className={`font-semibold ${
                currentLanguage === lang ? 'text-white' : 'text-gray-700'
              }`}>
                {getLanguageName(lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-5">
        {/* Logo and Title */}
        <View className="items-center mb-8">
          <Image 
            source={icon} 
            className="w-40 h-40 rounded-full" 
          />
          <Text className="text-3xl font-bold mt-4 text-gray-900">
            {t('title')}
          </Text>
          <Text className="text-lg text-gray-600 mt-2">
            {t('tagline')}
          </Text>
        </View>

        {/* Features List */}
        <View className="w-full mb-8">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-full mr-3">
              <Image 
                source={icons.health} 
                className="w-6 h-6" 
              />
            </View>
            <Text className="text-gray-700 flex-1">
              {t('feature1')}
            </Text>
          </View>
          
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-full mr-3">
              <Image 
                source={icons.notification} 
                className="w-6 h-6" 
              />
            </View>
            <Text className="text-gray-700 flex-1">
              {t('feature2')}
            </Text>
          </View>
          
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 p-2 rounded-full mr-3">
              <Image 
                source={icons.report} 
                className="w-6 h-6" 
              />
            </View>
            <Text className="text-gray-700 flex-1">
              {t('feature3')}
            </Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity 
          onPress={handleGetStarted} 
          className="bg-green-600 w-full py-4 rounded-xl"
        >
          <Text className="text-white text-lg font-semibold text-center">
            {t('getStarted')}
          </Text>
        </TouchableOpacity>

        {/* Version Text */}
        <Text className="text-gray-500 mt-6 text-sm">
          Version 1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
