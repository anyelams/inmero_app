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

// Previene que se oculte automáticamente el splash screen
SplashScreen.preventAutoHideAsync();

/**
 * Componente inicializador que maneja la carga de fuentes, splash screen y navegación
 * Gestiona la lógica de redirección basada en el estado de autenticación del usuario
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar
 */
function AppInitializer({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const { token, tokenEsValido } = useSession();
  const [isReady, setIsReady] = useState(false);

  // Carga fuentes personalizadas y de iconos
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

  /**
   * Configura warnings ignorados para desarrollo
   * Oculta warnings conocidos que no afectan la funcionalidad
   */
  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed from function components in a future major release",
      "Expected newLocale to be a string",
    ]);
  }, []);

  /**
   * Prepara aplicación una vez cargadas las fuentes
   * Oculta el splash screen y marca la app como lista
   */
  useEffect(() => {
    const prepareApp = async () => {
      if (fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
          setIsReady(true);
        } catch (error) {
          console.error("Error ocultando splash screen:", error);
          setIsReady(true); // Continuar aunque falle el splash
        }
      }
    };
    prepareApp();
  }, [fontsLoaded]);

  /**
   * Maneja navegación automática basada en autenticación
   * Lógica compleja para evitar redirecciones innecesarias y loops
   */
  useEffect(() => {
    // No hace nada hasta que la app esté lista
    if (!isReady) return;

    const isAuthenticated = token && tokenEsValido();
    const currentRoute = segments[segments.length - 1] || segments[0];

    // Debug logging para troubleshooting
    console.log("Navigation Debug:", {
      isAuthenticated,
      currentRoute,
      segments,
      token: !!token,
    });

    // Validaciones para evitar redirecciones innecesarias

    // Usuario autenticado ya en área protegida - no redirigir
    if (
      isAuthenticated &&
      (currentRoute === "home" || segments.includes("tabs"))
    ) {
      console.log("Usuario autenticado ya en ruta válida, no redirigiendo");
      return;
    }

    // Usuario no autenticado ya en welcome - no redirigir
    if (!isAuthenticated && currentRoute === "welcome") {
      console.log("Usuario no autenticado ya en welcome, no redirigiendo");
      return;
    }

    // Determina cuándo sí es necesario redirigir

    // Condiciones básicas que requieren redirección
    const shouldRedirect =
      segments.length === 1 &&
      (segments[0] === "login" ||
        segments[0] === "register" ||
        segments[0] === "index");

    // Usuario autenticado pero en welcome necesita ir a home
    const needsAuthRedirect = isAuthenticated && currentRoute === "welcome";

    // Ejecuta redirección si es necesaria
    if (shouldRedirect || needsAuthRedirect) {
      const targetRoute = isAuthenticated ? "/(tabs)/home" : "/welcome";
      console.log("Redirigiendo a:", targetRoute);
      router.replace(targetRoute);
    }
  }, [isReady, token, segments, router, tokenEsValido]);

  // Muestra pantalla en blanco mientras se prepara la app
  if (!isReady) {
    return null;
  }

  return <View style={{ flex: 1 }}>{children}</View>;
}

/**
 * Layout principal de la aplicación:
 * 1. LanguageProvider - Manejo de idiomas
 * 2. SessionProvider - Autenticación y sesión de usuario
 * 3. AppInitializer - Lógica de inicialización y navegación
 */
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
