import { Stack } from 'expo-router';


export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="addCow"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="addEvent"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="cowDetails"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="transactions"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="addTransaction"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="addMilk"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="milkRecords"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="privacyPolicy"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="filterCattle"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="healthRecord"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
