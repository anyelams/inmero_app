// screens/profile/Profile.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import LanguageSheet from "../../components/LanguageSheet"; // <--- IMPORT
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";

const Profile = () => {
  const router = useRouter();
  const { cerrarSesion, userEmail, empresaSeleccionada, getUserInitials } =
    useSession();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("es");

  // lista de idiomas soportados
  const languages = [
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ];

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const settings = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(settings.granted);
      } catch (e) {
        console.log("Error consultando permisos de notificaciones:", e);
      }
    };
    checkPermissions();
  }, []);

  const handleLogout = () => {
    cerrarSesion();
    router.replace("/(auth)/login");
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings(); // abre config de app
    } catch (e) {
      console.log("Error abriendo configuración de notificaciones:", e);
    }
  };

  const handleLanguageSelect = (code) => {
    setCurrentLanguage(code);
    setLanguageSheetVisible(false);
    // aquí podrías integrar i18n.changeLanguage(code) si usas i18next
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Mi perfil" onBackPress={() => router.push("/")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar + info usuario */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {empresaSeleccionada?.empresaNombre || "Nombre empresa"}
            </Text>
            <Text style={styles.userEmail}>
              {userEmail || "DireccionCorreo@gmail.com"}
            </Text>
          </View>
        </View>

        {/* Sección General */}
        <Text style={styles.sectionLabel}>General</Text>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={handleOpenNotificationSettings}
        >
          <Text style={styles.optionText}>Notificaciones</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleOpenNotificationSettings}
            trackColor={{ false: colors.lightGray, true: colors.primary }}
            thumbColor={notificationsEnabled ? colors.white : "#f4f3f4"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/profile/changePassword")}
        >
          <Text style={styles.optionText}>Cambiar contraseña</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textSec}
          />
        </TouchableOpacity>

        {/* Sección Preferencias */}
        <Text style={styles.sectionLabel}>Preferencias</Text>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setLanguageSheetVisible(true)}
        >
          <Text style={styles.optionText}>Idioma</Text>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>
              {languages.find((l) => l.code === currentLanguage)?.name}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSec}
            />
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
          <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de idioma */}
      <LanguageSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
        languages={languages}
        currentLanguage={currentLanguage}
        onSelect={handleLanguageSelect}
        t={(key) => {
          const map = {
            "welcome.selectLanguage": "Selecciona un idioma",
            "common.cancel": "Cancelar",
          };
          return map[key] || key;
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    ...typography.medium.large,
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  userEmail: {
    ...typography.regular.large,
    color: colors.textSec,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.regular.large,
    color: colors.textSec,
    marginTop: 26,
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  optionText: {
    ...typography.medium.large,
    color: colors.text,
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionValue: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginRight: 6,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginTop: 24,
  },
  logoutText: {
    ...typography.medium.large,
    color: colors.red,
  },
});

export default Profile;
