// app/_layout.js
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { LogBox, View } from "react-native";
import { LanguageProvider } from "../context/LanguageContext";
import { SessionProvider, useSession } from "../context/SessionContext";

SplashScreen.preventAutoHideAsync();

function AppInitializer({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const { token, tokenEsValido } = useSession();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    RobotoBold: require("../assets/fonts/Roboto-Bold.ttf"),
    RobotoSemiBold: require("../assets/fonts/Roboto-SemiBold.ttf"),
    RobotoMedium: require("../assets/fonts/Roboto-Medium.ttf"),
    RobotoRegular: require("../assets/fonts/Roboto-Regular.ttf"),
    RobotoLight: require("../assets/fonts/Roboto-Light.ttf"),
    ...AntDesign.font,
    ...Ionicons.font,
    ...Feather.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed from function components in a future major release",
      "Expected newLocale to be a string",
    ]);
  }, []);

  useEffect(() => {
    const prepareApp = async () => {
      if (fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
          setIsReady(true);
        } catch (error) {
          console.error("Error ocultando splash screen:", error);
          setIsReady(true);
        }
      }
    };
    prepareApp();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!isReady) return;

    const isAuthenticated = token && tokenEsValido();

    const shouldRedirect =
      segments.length === 1 &&
      (segments[0] === "login" ||
        segments[0] === "register" ||
        segments[0] === "index");

    if (shouldRedirect) {
      const targetRoute = isAuthenticated ? "/(tabs)/home" : "/welcome";
      router.replace(targetRoute);
    }
  }, [isReady, token, segments, router, tokenEsValido]);

  if (!isReady) {
    return null;
  }

  return <View style={{ flex: 1 }}>{children}</View>;
}

export default function Layout() {
  return (
    <LanguageProvider>
      <SessionProvider>
        <AppInitializer>
          <Slot />
          <StatusBar style="dark" translucent={true} />
        </AppInitializer>
      </SessionProvider>
    </LanguageProvider>
  );
}
