// app/(auth)/login.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useSession } from "../../context/SessionContext";

// Configuración de la API y proyecto
const { API_URL, API_URL_LOGIN, API_URL_NOTIFICATIONS_TOKEN, eas } =
  Constants.expoConfig.extra;
const projectId = eas?.projectId;

// Clave para persistir el último email utilizado
const LAST_EMAIL_KEY = "@last_login_email";

/**
 * Pantalla de inicio de sesión con funcionalidades avanzadas
 * Incluye validación granular, manejo de estados de usuario, recordar email,
 * configuración de notificaciones push y navegación condicional
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // Estados del formulario
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errors, setErrors] = useState({}); // Errores específicos por campo
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(true);

  const { setUsername, guardarSesionCompleta } = useSession();

  /**
   * Cargar email guardado al inicializar la pantalla
   */
  useEffect(() => {
    loadSavedEmail();
  }, []);

  /**
   * Carga el último email usado desde AsyncStorage
   * Configura el estado inicial del checkbox "recordarme"
   */
  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(LAST_EMAIL_KEY);
      if (savedEmail) {
        setCorreo(savedEmail);
        setRememberEmail(true);
      } else {
        setRememberEmail(true);
      }
    } catch (error) {
      console.log("Error cargando email guardado:", error);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  /**
   * Guarda el email en AsyncStorage para futuras sesiones
   * @param {string} email - Email a guardar
   */
  const saveEmail = async (email) => {
    try {
      await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
    } catch (error) {
      console.log("Error guardando email:", error);
    }
  };

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
    setCorreo(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  /**
   * Maneja cambios en el campo contraseña y limpia errores relacionados
   * @param {string} value - Nuevo valor de la contraseña
   */
  const handlePasswordChange = (value) => {
    setContrasena(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  /**
   * Maneja el proceso completo de inicio de sesión
   * Incluye validaciones, autenticación, manejo de estados de usuario,
   * configuración de sesión y notificaciones push
   */
  const handleLogin = async () => {
    if (isLoading) return;

    setErrors({});
    setIsLoading(true);

    // Validaciones del formulario
    if (!correo.trim()) {
      setErrors({ email: t("validation.emailRequired") });
      setIsLoading(false);
      return;
    }

    if (!contrasena.trim()) {
      setErrors({ password: t("validation.passwordRequired") });
      setIsLoading(false);
      return;
    }

    if (!validateEmail(correo)) {
      setErrors({ email: t("validation.emailInvalid") });
      setIsLoading(false);
      return;
    }

    try {
      // Llamada al API de autenticación
      const response = await axios.post(`${API_URL}${API_URL_LOGIN}`, {
        username: correo.trim(),
        password: contrasena,
      });

      const { token, empresaId, rolId, rolesByCompany, usuarioEstado } =
        response.data;

      if (!token) {
        setErrors({ general: "Error: No se recibió token del servidor" });
        setIsLoading(false);
        return;
      }

      // Guardar email según preferencia del usuario
      if (rememberEmail) {
        await saveEmail(correo.trim());
      } else {
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
      }

      // Manejo de estados especiales del usuario
      // Estado 2: Necesita completar registro de persona
      if (usuarioEstado === 2) {
        router.replace("/registro-persona");
        setIsLoading(false);
        return;
      }
      // Estado 3: Necesita completar registro de empresa
      else if (usuarioEstado === 3) {
        router.replace("/registro-empresa");
        setIsLoading(false);
        return;
      }

      // Validar que el usuario tenga empresas asociadas
      if (!rolesByCompany || rolesByCompany.length === 0) {
        setErrors({ general: t("errors.noAssociatedCompanies") });
        setIsLoading(false);
        return;
      }

      // Configurar sesión del usuario
      await setUsername(correo.trim());

      // Buscar empresa actual en la lista de empresas disponibles
      const empresaActual = rolesByCompany.find(
        (empresa) => empresa.empresaId === empresaId && empresa.rolId === rolId
      );

      // Guardar sesión completa con empresa actual o primera disponible
      if (!empresaActual) {
        console.warn(
          "No se encontró empresa actual, usando primera disponible"
        );
        const primeraEmpresa = rolesByCompany[0];
        await guardarSesionCompleta({
          token,
          empresaId: primeraEmpresa.empresaId,
          rolId: primeraEmpresa.rolId,
          empresaNombre: primeraEmpresa.empresaNombre,
          rolNombre: primeraEmpresa.rolNombre,
          rolesByCompany,
        });
      } else {
        await guardarSesionCompleta({
          token,
          empresaId,
          rolId,
          empresaNombre: empresaActual.empresaNombre,
          rolNombre: empresaActual.rolNombre,
          rolesByCompany,
        });
      }

      // Configurar notificaciones push
      await configurarNotificacionesPush(correo.trim());

      // Navegar a pantalla principal
      router.replace("/home");
    } catch (err) {
      console.error("Error en login:", err);
      console.error("Detalles del error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      // Manejo granular de errores HTTP y de red
      let errorMessage;
      if (err.response?.status === 401) {
        errorMessage = t("errors.loginFailed");
      } else if (err.response?.status === 404) {
        errorMessage = t("errors.accountNotFound");
      } else if (err.response?.status === 400) {
        errorMessage = t("errors.invalidData");
      } else if (
        err.message?.includes("Network Error") ||
        err.code === "NETWORK_ERROR"
      ) {
        errorMessage = t("errors.networkError");
      } else if (err.message?.includes("timeout")) {
        errorMessage = t("errors.connectionTimeout");
      } else {
        errorMessage = t("errors.unknownError");
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Configura notificaciones push para el usuario autenticado
   * Maneja permisos, obtención de token y registro en el servidor
   * @param {string} userEmail - Email del usuario para asociar el token
   */
  const configurarNotificacionesPush = async (userEmail) => {
    try {
      // Solo ejecutar en dispositivos físicos
      if (!Device.isDevice) {
        console.log(
          "No es un dispositivo físico, saltando notificaciones push"
        );
        return;
      }

      // Importación dinámica para evitar errores en desarrollo
      const Notifications = await import("expo-notifications");

      // Configurar handler de notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Verificar y solicitar permisos
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Si se otorgaron permisos, obtener y registrar token
      if (finalStatus === "granted") {
        const pushToken = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId || "local/FrontendMovil",
          })
        ).data;

        console.log("Token de notificaciones obtenido:", pushToken);

        // Registrar token en el servidor
        const notificationEndpoint = `${API_URL}${API_URL_NOTIFICATIONS_TOKEN}`;
        await fetch(notificationEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userEmail,
            token: pushToken,
          }),
        });

        // Configurar listener para notificaciones recibidas
        const subscription = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log("Notificación recibida:", notification);
          }
        );
      } else {
        console.log("Permisos de notificaciones denegados");
      }
    } catch (error) {
      console.error("Error configurando notificaciones push:", error);
    }
  };

  // Pantalla de loading mientras se carga el email guardado
  if (isLoadingEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
          <LogoInmero width={150} height={140} />
        </View>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo de la empresa */}
      <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
        <LogoInmero width={150} height={140} />
      </View>

      {/* Título de la pantalla */}
      <Text style={styles.title}>{t("auth.loginTitle")}</Text>

      {/* Error general para errores de servidor */}
      {errors.general && (
        <Text style={styles.generalError}>{errors.general}</Text>
      )}

      {/* Campo de email con validación */}
      <CustomInput
        label={t("auth.email")}
        placeholder={t("auth.enterEmail")}
        value={correo}
        onChangeText={handleEmailChange}
        icon="mail-outline"
        keyboardType="email-address"
        editable={!isLoading}
        error={errors.email}
      />

      {/* Campo de contraseña con toggle de visibilidad */}
      <CustomInput
        label={t("auth.password")}
        placeholder={t("auth.enterPassword")}
        value={contrasena}
        onChangeText={handlePasswordChange}
        icon="lock-closed-outline"
        secureTextEntry={true}
        showPasswordToggle={true}
        editable={!isLoading}
        error={errors.password}
      />

      {/* Fila con checkbox "Recordarme" y link "Olvidaste contraseña" */}
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setRememberEmail(!rememberEmail)}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={rememberEmail ? "checkbox" : "square-outline"}
            size={20}
            color={rememberEmail ? colors.secondary : colors.textSec}
          />
          <Text style={styles.rememberText}>{t("auth.rememberMe")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/forgotPassword")}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>
            {t("auth.forgotPassword")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón principal de login */}
      <CustomButton
        text={isLoading ? t("auth.loggingIn") : t("auth.login")}
        onPress={handleLogin}
        variant="primary"
        icon={!isLoading ? "arrow-forward" : null}
        disabled={isLoading}
        fullWidth
        style={{ marginTop: 20 }}
      />

      {/* Separador visual */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>{t("auth.orContinueWith")}</Text>
        <View style={styles.divider} />
      </View>

      {/* Footer con enlace a registro */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("auth.dontHaveAccount")} </Text>
        <TouchableOpacity
          onPress={() => router.push("/register")}
          disabled={isLoading}
        >
          <Text style={styles.registerLink}>{t("auth.signUp")}</Text>
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
    paddingTop: 0,
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
    marginTop: 8,
    marginBottom: 16,
    color: colors.text,
  },

  // Separador visual entre secciones
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textSec,
    ...typography.regular.medium,
  },

  // Footer con enlace a registro
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: colors.textSec,
    ...typography.regular.medium,
  },
  registerLink: {
    color: colors.secondary,
    ...typography.semibold.regular,
  },

  // Texto de loading
  loadingText: {
    textAlign: "center",
    color: colors.textSec,
    marginTop: 20,
    ...typography.regular.regular,
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

  // Fila de opciones
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rememberText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.textSec,
    ...typography.regular.medium,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: colors.secondary,
    textAlign: "right",
    ...typography.semibold.regular,
  },
});
