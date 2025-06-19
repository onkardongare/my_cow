import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';

const AboutScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:omkaryou2005@gmail.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://www.omkaryou.com');
  };

  return (
    <SafeAreaView className="h-full w-full">
      <View className="flex-1 bg-gray-100 pb-4">
        {/* Header */}
        <View className="flex-row items-center p-4 bg-white shadow-md">
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text className="ml-4 text-lg font-semibold">{t('about')}</Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* App Info Section */}
          <View className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <View className="items-center mb-4">
              <MaterialIcons name="agriculture" size={60} color="#0D9488" />
              <Text className="text-2xl font-bold text-teal-600 mt-2">My Cow</Text>
              <Text className="text-gray-500">Version 1.0.0</Text>
            </View>
            <Text className="text-gray-600 text-center">
              {t('aboutDescription')}
            </Text>
          </View>

          {/* Features Section */}
          <View className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">{t('features')}</Text>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Feather name="check-circle" size={20} color="#0D9488" />
                <Text className="ml-2 text-gray-600">{t('feature1')}</Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="check-circle" size={20} color="#0D9488" />
                <Text className="ml-2 text-gray-600">{t('feature2')}</Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="check-circle" size={20} color="#0D9488" />
                <Text className="ml-2 text-gray-600">{t('feature3')}</Text>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">{t('contactUs')}</Text>
            <TouchableOpacity 
              className="flex-row items-center p-3 bg-gray-50 rounded-lg mb-3"
              onPress={handleEmailPress}
            >
              <MaterialIcons name="email" size={24} color="#0D9488" />
              <Text className="ml-3 text-gray-600">dongareonkar27@gmail.com</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center p-3 bg-gray-50 rounded-lg"
              onPress={handleWebsitePress}
            >
              <MaterialIcons name="language" size={24} color="#0D9488" />
              <Text className="ml-3 text-gray-600">www.onkardongare.com</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Section */}
          <View className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">{t('legal')}</Text>
            <TouchableOpacity className="mb-3">
              <Text className="text-teal-600">{t('privacyPolicy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="text-teal-600">{t('termsOfService')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AboutScreen; 