import { Stack } from 'expo-router';

export default function ManagerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#111315' } }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="assets" />
      <Stack.Screen name="scheduling" />
      <Stack.Screen name="operations" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
