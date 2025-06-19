import { Tabs } from "expo-router";
import { Image, Text, View, Keyboard } from "react-native";
import { StatusBar } from "expo-status-bar";
import { icons } from "../../constants";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const TabIcon = ({icon, color, name, focused}) => {
  return(
    <View className = "items-center justify-center gap-2 space-y-1 w-60 pt-2">
      <Image
        source={icon}
        resizeMode='contain'
        tintColor={color}
        className= 'w-6 h-6 '
      />
      <Text
        className={`${focused ? "font-bold" : "font-normal"} text-xs`}
        style={{color: color}}
      >
        {name}
      </Text>
    </View>
  )
}

const TabLayout = () => {
  const { t } = useTranslation();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return(
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#FFA001",
          tabBarInactiveTintColor: "#CDCDE0",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#161622",
            borderTopWidth: 1,
            borderTopColor: "#232533",
            height: 55,
            display: isKeyboardVisible ? 'none' : 'flex',
          },
        }}
        >
        <Tabs.Screen
          name="home"
          options={{
            title: t('summary'),
            headerTitle: "Cow Master",
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.home}
                color={color}
                name={t('summary')}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="cow"
          options={{
            title: t('cattle'),
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.cow1}
                color={color}
                name={t('cattle')}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: t('events'),
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.event}
                color={color}
                name={t('events')}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name={t('profile')}
                focused={focused}
              />
            )
          }}
        />
      </Tabs>
      <StatusBar backgroundColor="#161622" style="light" />
    </>
  )
}

export default TabLayout;