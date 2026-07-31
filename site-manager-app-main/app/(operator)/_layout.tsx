import { Stack } from 'expo-router';

export default function OperatorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#111315' } }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="tasks" />
    </Stack>
  );
}
