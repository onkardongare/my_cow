import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';

const PrivacyPolicyScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="h-full w-full">
      <View className="flex-1 bg-gray-100 pb-4">
        {/* Header */}
        <View className="flex-row items-center p-4 bg-white shadow-md">
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text className="ml-4 text-lg font-semibold">{t('privacyPolicy')}</Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Privacy Policy Content */}
          <View className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <Text className="text-gray-600 mb-4">
              {t('privacyPolicyContent')}
            </Text>
            <Text className="text-gray-800 font-bold mb-2">Introduction</Text>
            <Text className="text-gray-600 mb-4">
              This Privacy Policy describes how My Cow collects, uses, and shares information about you when you use our application.
            </Text>
            <Text className="text-gray-800 font-bold mb-2">Information Collection</Text>
            <Text className="text-gray-600 mb-4">
              We collect information you provide directly to us, such as when you create an account, update your profile, or use interactive features of the app.
            </Text>
            <Text className="text-gray-800 font-bold mb-2">Use of Information</Text>
            <Text className="text-gray-600 mb-4">
              We use the information we collect to provide, maintain, and improve our services, and to communicate with you.
            </Text>
            <Text className="text-gray-800 font-bold mb-2">Data Sharing and Disclosure</Text>
            <Text className="text-gray-600 mb-4">
              We do not share your personal information with third parties except as necessary to provide our services or as required by law.
            </Text>
            <Text className="text-gray-800 font-bold mb-2">Data Security</Text>
            <Text className="text-gray-600 mb-4">
              We implement security measures to protect your information from unauthorized access and use.
            </Text>
            <Text className="text-gray-800 font-bold mb-2">User Rights</Text>
            <Text className="text-gray-600 mb-4">
              You have the right to access, update, or delete your personal information at any time.
            </Text>
            <Text className="text-gray-800 font-bold mb-2">Changes to the Privacy Policy</Text>
            <Text className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </Text>
            <Text className="text-gray-800 font-bold mb-2">Contact Information</Text>
            <Text className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at omkaryou2005@gmail.com.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen; 