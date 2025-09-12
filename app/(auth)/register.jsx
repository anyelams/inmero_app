// app/(auth)/register.jsx
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import LogoInmero from "../../components/LogoInmero";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

const { API_URL } = Constants.expoConfig.extra;

// Función para evaluar la seguridad de la contraseña
const getPasswordStrength = (password) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("8+ caracteres");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("mayúscula");
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("número");
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push("carácter especial");
  }

  if (score === 4) return "¡Contraseña segura!";
  return `Falta: ${feedback.join(", ")}`;
};

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = async () => {
    if (!username || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("La contraseña debe incluir al menos una mayúscula.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("La contraseña debe incluir al menos un número.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError("La contraseña debe incluir al menos un carácter especial.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        password,
      });

      const data = response.data;

      if (data.success) {
        setIsRegistered(true);
        setTimeout(() => {
          Alert.alert(
            "¡Registro exitoso!",
            "Te enviamos un correo de confirmación. Verifica tu cuenta antes de iniciar sesión.",
            [{ text: "Entendido", onPress: () => router.push("/login") }]
          );
        }, 1000);
      } else {
        setError(data.message || "Error desconocido.");
      }
    } catch (err) {
      console.error("ERROR:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "No se pudo conectar con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
        <LogoInmero width={150} height={140} />
      </View>

      <Text style={styles.title}>Crear cuenta</Text>

      <CustomInput
        label="Correo"
        placeholder="Correo electrónico"
        value={username}
        onChangeText={setUsername}
        icon="mail-outline"
        keyboardType="email-address"
        editable={!loading}
      />

      <CustomInput
        label="Contraseña"
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed-outline"
        secureTextEntry={true}
        showPasswordToggle={true}
        editable={!loading}
      />

      {/* Evaluación visual de contraseña */}
      {password !== "" && (
        <Text style={styles.passwordStrength}>
          {getPasswordStrength(password)}
        </Text>
      )}

      {/* Error general */}
      {error !== "" && <Text style={styles.error}>{error}</Text>}

      {/* Botón de registro */}
      <CustomButton
        text={loading ? "Registrando..." : "Registrarse"}
        onPress={handleRegister}
        variant="primary"
        icon={!loading ? "arrow-forward" : null}
        disabled={loading}
        fullWidth
        style={{ marginTop: 10 }}
      />

      {/* Link al login */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity
          onPress={() => router.replace("/login")}
          disabled={loading}
        >
          <Text style={styles.linkText}>Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    ...typography.bold.large,
    fontSize: 26, // Override para título principal
    marginTop: 10,
    marginBottom: 20,
    color: colors.text,
  },
  passwordStrength: {
    color: colors.secondary,
    marginBottom: 10,
    ...typography.medium.small,
  },
  error: {
    color: colors.error,
    marginBottom: 10,
    ...typography.regular.small,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: colors.textSec,
    ...typography.regular.medium,
  },
  linkText: {
    color: colors.secondary,
    ...typography.semibold.medium,
  },
});
