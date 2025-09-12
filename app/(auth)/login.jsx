// app/(auth)/login.jsx
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
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
import { useSession } from "../../context/SessionContext";

const { API_URL, API_URL_LOGIN, eas } = Constants.expoConfig.extra;
const projectId = eas?.projectId;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setUsername, guardarSesionCompleta } = useSession();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    if (!correo.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      setIsLoading(false);
      return;
    }

    if (!contrasena.trim()) {
      setError("Por favor ingresa tu contraseña");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(correo)) {
      setError("Correo electrónico inválido");
      setIsLoading(false);
      return;
    }

    try {
      // NUEVO FLUJO: Login devuelve token inmediatamente
      const response = await axios.post(`${API_URL}${API_URL_LOGIN}`, {
        username: correo.trim(),
        password: contrasena,
      });

      const { token, empresaId, rolId, rolesByCompany, usuarioEstado } =
        response.data;

      // Validar datos críticos del login
      if (!token) {
        setError("Error: No se recibió token del servidor");
        setIsLoading(false);
        return;
      }

      // Validaciones de estado del usuario
      if (usuarioEstado === 2) {
        router.replace("/registro-persona");
        setIsLoading(false);
        return;
      } else if (usuarioEstado === 3) {
        router.replace("/registro-empresa");
        setIsLoading(false);
        return;
      }

      if (!rolesByCompany || rolesByCompany.length === 0) {
        setError("No tienes empresas asociadas.");
        setIsLoading(false);
        return;
      }

      await setUsername(correo.trim());

      const empresaActual = rolesByCompany.find(
        (empresa) => empresa.empresaId === empresaId && empresa.rolId === rolId
      );

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

      await configurarNotificacionesPush(correo.trim());

      router.replace("/home");
    } catch (err) {
      console.error("Error en login:", err);
      console.error("Detalles del error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      // Manejo de errores
      if (err.response?.status === 401) {
        setError("Usuario o contraseña incorrectos.");
      } else if (err.response?.status === 404) {
        setError("Cuenta no encontrada. Verifica tus datos.");
      } else if (err.response?.status === 400) {
        setError("Datos inválidos. Revisa la información ingresada.");
      } else if (
        err.message?.includes("Network Error") ||
        err.code === "NETWORK_ERROR"
      ) {
        setError("Error de conexión. Verifica tu conexión a internet.");
      } else if (err.message?.includes("timeout")) {
        setError("La conexión tardó demasiado. Intenta nuevamente.");
      } else {
        setError("Error inesperado. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Notificaciones Push con importación dinámica
  const configurarNotificacionesPush = async (userEmail) => {
    try {
      if (!Device.isDevice) {
        console.log(
          "No es un dispositivo físico, saltando notificaciones push"
        );
        return;
      }

      // Importación dinámica para evitar problemas de carga
      const Notifications = await import("expo-notifications");

      // Configurar el manejador de notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === "granted") {
        const pushToken = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId || "local/FrontendMovil",
          })
        ).data;

        console.log("Token de notificaciones obtenido:", pushToken);

        const notificationEndpoint = `${API_URL}/notifications/token`;

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

        // Guardar la suscripción para limpiarla después si es necesario
        // En un app real, podrías almacenar esto en el contexto o estado global
      } else {
        console.log("Permisos de notificaciones denegados");
      }
    } catch (error) {
      console.error("Error configurando notificaciones push:", error);
      // No fallar el login si las notificaciones fallan
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
        <LogoInmero width={150} height={140} />
      </View>

      <Text style={styles.title}>Iniciar Sesión</Text>

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <CustomInput
        label="Correo Electrónico"
        placeholder="Ingresa tu correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        icon="mail-outline"
        keyboardType="email-address"
        editable={!isLoading}
      />

      <CustomInput
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        icon="lock-closed-outline"
        secureTextEntry={true}
        showPasswordToggle={true}
        editable={!isLoading}
      />

      <CustomButton
        text={isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        onPress={handleLogin}
        variant="primary"
        icon={!isLoading ? "arrow-forward" : null}
        disabled={isLoading}
        fullWidth
        style={{ marginTop: 10 }}
      />

      <TouchableOpacity
        onPress={() => router.push("/forgotPassword")}
        disabled={isLoading}
      >
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity
          onPress={() => router.push("/register")}
          disabled={isLoading}
        >
          <Text style={styles.registerLink}>Regístrate aquí</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    backgroundColor: colors.white,
  },
  logoContainer: {
    alignItems: "center",
  },
  title: {
    ...typography.bold.big,
    fontSize: 26,
    marginTop: 8,
    marginBottom: 16,
    color: colors.text,
  },
  linkText: {
    marginTop: 12,
    color: colors.secondary,
    textAlign: "center",
    ...typography.semibold.regular,
  },
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
    ...typography.regular.regular,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: colors.textSec,
    ...typography.regular.regular,
  },
  registerLink: {
    color: colors.secondary,
    ...typography.semibold.regular,
  },
  error: {
    color: colors.error,
    marginBottom: 8,
    textAlign: "center",
    ...typography.regular.regular,
  },
});
