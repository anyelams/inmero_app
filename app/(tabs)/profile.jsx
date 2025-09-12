import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";

const mockUser = {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan.perez@example.com",
  identificacion: "1234567890",
  telefono: "+57 300 123 4567",
};

const Profile = () => {
  const router = useRouter();
  const { cerrarSesion } = useSession();

  const handleLogout = () => {
    cerrarSesion();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[typography.semibold.big, styles.title]}>Mi perfil</Text>

        <View style={styles.card}>
          <Ionicons
            name="person-circle-outline"
            size={80}
            color={colors.primary}
            style={styles.avatar}
          />
          <Text
            style={styles.name}
          >{`${mockUser.nombre} ${mockUser.apellido}`}</Text>
          <Text style={styles.email}>{mockUser.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          <View style={styles.infoRow}>
            <Ionicons name="id-card-outline" size={22} color={colors.gray} />
            <Text style={styles.infoLabel}>Identificación:</Text>
            <Text style={styles.infoValue}>{mockUser.identificacion}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={22} color={colors.gray} />
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{mockUser.telefono}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => router.push("/profile/changePassword")}
        >
          <Ionicons name="key-outline" size={20} color="#fff" />
          <Text style={styles.changePasswordText}>Cambiar contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.base,
  },
  container: {
    padding: 20,
  },
  title: {
    color: colors.darkGray,
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: "center",
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 32,
  },
  avatar: {
    marginBottom: 12,
  },
  name: {
    ...typography.semibold.medium,
    color: colors.darkGray,
  },
  email: {
    ...typography.regular.small,
    color: colors.gray,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.semibold.small,
    color: colors.darkGray,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    ...typography.regular.medium,
    marginLeft: 8,
    marginRight: 4,
    color: colors.gray,
  },
  infoValue: {
    ...typography.regular.medium,
    color: colors.darkGray,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#e53935",
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },

  changePasswordButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  changePasswordText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default Profile;
