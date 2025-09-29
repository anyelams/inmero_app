// app/iot/_layout.jsx
import { Stack } from "expo-router";

export default function IotLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
