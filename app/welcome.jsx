// app/welcome.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../components/CustomButton";
import LanguageSheet from "../components/LanguageSheet";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useLanguage } from "../context/LanguageContext";
import { useSession } from "../context/SessionContext";

/**
 * Pantalla de bienvenida de la aplicación
 * Primera pantalla que ven los usuarios no autenticados, con opciones para
 * registrarse, iniciar sesión y cambiar idioma
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { token, tokenEsValido } = useSession();
  const {
    t,
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isLoading: languageLoading,
  } = useLanguage();

  // Estados locales para manejo de loading y modal
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  /**
   * Verificar autenticación y redirigir si el usuario ya está logueado
   * Se ejecuta cuando cambian el token o el estado de carga del idioma
   */
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Esperar a que termine de cargar el contexto de idioma
      if (languageLoading) return;

      try {
        const isAuthenticated = token && tokenEsValido();

        // Si está autenticado, ir directamente al home
        if (isAuthenticated) {
          router.replace("/(tabs)/home");
          return;
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Ejecutar verificación cuando los datos estén disponibles
    if (token !== null && !languageLoading) {
      checkAuthAndRedirect();
    } else if (!languageLoading) {
      setIsLoading(false);
    }
  }, [token, tokenEsValido, router, languageLoading]);

  /**
   * Manejar cambio de idioma y cerrar modal
   * @param {string} language - Código del idioma seleccionado
   */
  const handleLanguageChange = async (language) => {
    await changeLanguage(language);
    setShowLanguageModal(false);
  };

  // Pantalla de loading mientras se cargan contextos y se verifica auth
  if (isLoading || languageLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contenido principal de la pantalla */}
        <View style={styles.topContent}>
          {/* Logo de la empresa */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Imagen de bienvenida/ilustración */}
          <Image
            source={require("../assets/images/welcome.png")}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Textos de bienvenida traducidos */}
          <Text style={styles.welcomeText}>
            {t("welcome.title", { appName: "Inmero" })}
          </Text>

          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

          {/* Selector de idioma interactivo */}
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() => setShowLanguageModal(true)}
          >
            <Ionicons name="language-outline" size={16} color={colors.gray} />
            <Text style={styles.languageText}>{t("welcome.language")}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.gray} />
          </TouchableOpacity>
        </View>

        {/* Botones de navegación a registro e inicio de sesión */}
        <View style={styles.buttonContainer}>
          <CustomButton
            text={t("welcome.register")}
            route="/register"
            variant="secondary"
          />

          <CustomButton
            text={t("welcome.signIn")}
            route="/login"
            variant="primary"
          />
        </View>
      </ScrollView>

      {/* Modal bottom sheet para selección de idioma */}
      <LanguageSheet
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        languages={availableLanguages}
        currentLanguage={currentLanguage}
        onSelect={handleLanguageChange}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal con color de fondo base
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },

  // Configuración del scroll para distribución vertical
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 24,
  },

  // Pantalla de loading centrada
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    width: 150,
    height: 140,
    opacity: 0.8,
  },
  loadingText: {
    ...typography.medium.medium,
    marginTop: 20,
    color: colors.textSec,
  },

  // Contenido superior centrado
  topContent: {
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  logo: {
    width: 130,
    height: 150,
  },

  // Imagen de bienvenida
  image: {
    width: 280,
    height: 240,
    marginTop: 0,
    marginBottom: 8,
  },

  // Textos principales con jerarquía tipográfica
  welcomeText: {
    ...typography.bold.big,
    fontSize: 27,
    textAlign: "center",
    marginBottom: 10,
    color: colors.text,
  },
  subtitle: {
    ...typography.regular.large,
    color: colors.textSec,
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 30,
    lineHeight: 22,
  },

  // Selector de idioma con iconos
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    gap: 16,
  },
  languageText: {
    ...typography.regular.large,
    color: colors.textSec,
  },

  // Contenedor de botones de acción
  buttonContainer: {
    width: "100%",
    gap: 20,
    marginTop: 10,
    marginBottom: 85,
    alignItems: "center",
  },
});
