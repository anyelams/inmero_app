// app/(auth)/forgotPassword.jsx
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import LogoInmero from "../../components/LogoInmero";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";

// Configuración de la API
const { API_URL, API_URL_FORGOT_PASSWORD } = Constants.expoConfig.extra;

/**
 * Pantalla de recuperación de contraseña
 * Permite al usuario solicitar un enlace de restablecimiento de contraseña
 * mediante su email. Incluye validación de email y manejo de errores específicos.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Valida formato de email usando regex
   * @param {string} email - Email a validar
   * @returns {boolean} - true si el email es válido
   */
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /**
   * Maneja cambios en el campo email y limpia errores relacionados
   * @param {string} value - Nuevo valor del email
   */
  const handleEmailChange = (value) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  /**
   * Envía solicitud de restablecimiento de contraseña
   * Valida el email, hace la petición al servidor y maneja la respuesta
   */
  const handleSendResetEmail = async () => {
    if (isLoading) return;

    setErrors({});
    setIsLoading(true);

    // Validaciones del formulario
    if (!email.trim()) {
      setErrors({ email: t("validation.emailRequired") });
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: t("validation.emailInvalid") });
      setIsLoading(false);
      return;
    }

    try {
      // Enviar solicitud de restablecimiento al servidor
      await axios.post(`${API_URL}${API_URL_FORGOT_PASSWORD}`, {
        email: email.trim(),
      });

      // Limpiar formulario y navegar a pantalla de confirmación
      setEmail("");
      router.replace("/EmailVerificationSent");
    } catch (error) {
      console.error("Error en forgot password:", error);
      console.error("Detalles del error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Manejo granular de errores HTTP y de red
      let errorMessage;
      if (error.response?.status === 404) {
        errorMessage = t("errors.accountNotFound");
      } else if (error.response?.status === 400) {
        errorMessage = t("errors.invalidData");
      } else if (
        error.message?.includes("Network Error") ||
        error.code === "NETWORK_ERROR"
      ) {
        errorMessage = t("errors.networkError");
      } else if (error.message?.includes("timeout")) {
        errorMessage = t("errors.connectionTimeout");
      } else {
        errorMessage = t("errors.serverError");
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo de la empresa */}
      <View style={[styles.logoContainer, { marginTop: insets.top + 20 }]}>
        <LogoInmero width={150} height={140} />
      </View>

      {/* Título principal */}
      <Text style={styles.title}>{t("forgotPassword.title")}</Text>

      {/* Subtítulo explicativo */}
      <Text style={styles.subtitle}>{t("forgotPassword.subtitle")}</Text>

      {/* Error general para errores de servidor */}
      {errors.general && (
        <Text style={styles.generalError}>{errors.general}</Text>
      )}

      {/* Campo de email con validación */}
      <CustomInput
        label={t("auth.email")}
        placeholder={t("auth.enterEmail")}
        value={email}
        onChangeText={handleEmailChange}
        icon="mail-outline"
        keyboardType="email-address"
        editable={!isLoading}
        error={errors.email}
      />

      {/* Botón para enviar enlace de restablecimiento */}
      <CustomButton
        text={
          isLoading ? t("forgotPassword.sending") : t("forgotPassword.sendLink")
        }
        onPress={handleSendResetEmail}
        variant="primary"
        disabled={isLoading}
        fullWidth
        style={styles.sendButton}
      />

      {/* Footer con enlace para volver al login */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t("forgotPassword.rememberPassword")}{" "}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/login")}
          disabled={isLoading}
        >
          <Text style={styles.linkText}>{t("auth.signIn")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal de la pantalla
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },

  // Contenedor del logo con espaciado dinámico
  logoContainer: {
    alignItems: "center",
  },

  // Título principal de la pantalla
  title: {
    ...typography.bold.big,
    fontSize: 26,
    marginTop: 10,
    marginBottom: 10,
    color: colors.text,
  },

  // Subtítulo explicativo
  subtitle: {
    ...typography.regular.regular,
    fontSize: 14,
    color: colors.textSec,
    marginBottom: 20,
    lineHeight: 20,
  },

  // Error general con fondo destacado
  generalError: {
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
    ...typography.regular.regular,
    backgroundColor: colors.errorLight || "#ffebee",
    padding: 12,
    borderRadius: 8,
  },

  // Espaciado del botón principal
  sendButton: {
    marginTop: 20,
  },

  // Footer con enlace de navegación
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    color: colors.textSec,
    ...typography.regular.medium,
  },
  linkText: {
    color: colors.secondary,
    ...typography.semibold.regular,
  },
});
