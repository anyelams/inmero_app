import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CompanySwitcher from "../../components/CompanySwitcher";
import HeaderHome from "../../components/HeaderHome";
import ModuleCard from "../../components/ModuleCard";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";

// Colores corporativos con naranja para seguridad
const corporateColors = {
  inventory: {
    background: "#eff6ff", // Azul claro
    icon: "#2563eb", // Azul corporativo
    accent: "#1d4ed8", // Azul más intenso
  },
  iot: {
    background: "#faf5ff", // Púrpura muy claro
    icon: "#7c3aed", // Púrpura
    accent: "#6d28d9", // Púrpura intenso
  },
  security: {
    background: "#fff7ed", // Naranja muy claro
    icon: "#ea580c", // Naranja profesional
    accent: "#c2410c", // Naranja intenso
  },
  reports: {
    background: "#f6fdf9", // Verde muy claro
    icon: "#16a34a", // Verde suave
    accent: "#15803d", // Verde oscuro profesional
  },
};

const modules = [
  {
    id: "1",
    title: "Módulo\nInventario",
    icon: "clipboard-check",
    route: "inventory",
    moduleColors: corporateColors.inventory,
  },
  {
    id: "2",
    title: "Módulo\nde IoT",
    icon: "access-point",
    route: "iot",
    moduleColors: corporateColors.iot,
  },
  {
    id: "3",
    title: "Módulo\nSeguridad",
    icon: "shield-lock-outline",
    route: "security",
    moduleColors: corporateColors.security,
  },
  {
    id: "4",
    title: "Módulo\nReportes",
    icon: "chart-line",
    route: "reports",
    moduleColors: corporateColors.reports,
  },
];

export default function Home() {
  const router = useRouter();
  const {
    empresaSeleccionada,
    rolesByCompany,
    token,
    userEmail,
    getUserInitials,
  } = useSession();
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);

  useEffect(() => {
    console.log("Token recibido en Home:", token);
    console.log("Email del usuario:", userEmail);
    console.log("Iniciales del usuario:", getUserInitials());
    console.log("Roles disponibles:", rolesByCompany);
    console.log("Cantidad de roles:", rolesByCompany?.length);
  }, [token, rolesByCompany, userEmail]);

  const handleOpenCompanySwitcher = () => {
    setShowCompanySwitcher(true);
  };

  const handleCloseCompanySwitcher = () => {
    setShowCompanySwitcher(false);
  };

  // Función para obtener un saludo basado en la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días!";
    if (hour < 18) return "Buenas tardes!";
    return "Buenas noches!";
  };

  // Función para obtener el nombre del usuario del email
  const getUserDisplayName = () => {
    if (!userEmail) return "";
    const localPart = userEmail.split("@")[0];
    return localPart
      .replace(/[._-]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <HeaderHome />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con información del usuario */}
        <View style={styles.userSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>
              {rolesByCompany?.length > 1
                ? "Recuerda que desde 'Empresa' podrás cambiar tu sesión actual."
                : getUserDisplayName() || "Accede a los módulos de tu empresa"}
            </Text>
          </View>
        </View>

        {/* Empresa actual */}
        {rolesByCompany?.length > 1 && (
          <View style={styles.companySection}>
            <TouchableOpacity
              onPress={handleOpenCompanySwitcher}
              style={styles.empresaContainer}
            >
              <View style={styles.empresaContent}>
                <View style={styles.empresaIconContainer}>
                  <View style={styles.empresaIcon}>
                    <MaterialCommunityIcons
                      name="domain"
                      size={20}
                      color={colors.textSec}
                    />
                  </View>
                </View>
                <View style={styles.empresaInfo}>
                  <Text style={styles.empresaLabel}>Empresa</Text>
                  <Text style={styles.empresaText} numberOfLines={1}>
                    {empresaSeleccionada?.empresaNombre}
                  </Text>
                </View>
                <View style={styles.chevronContainer}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={colors.textSec}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Módulos Section */}
        <View style={styles.modulesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Módulos disponibles</Text>
          </View>
          <View style={styles.grid}>
            {modules.map((item) => (
              <ModuleCard
                key={item.id}
                title={item.title}
                icon={item.icon}
                moduleColors={item.moduleColors}
                onPress={() => router.push(item.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal del Company Switcher */}
      <CompanySwitcher
        visible={showCompanySwitcher}
        asModal={true}
        onClose={handleCloseCompanySwitcher}
        onSwitch={handleCloseCompanySwitcher}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  userSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    ...typography.bold.big,
    fontSize: 26,
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  userName: {
    ...typography.regular.large,
    color: colors.textSec,
    letterSpacing: 0.1,
  },
  companySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  empresaContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  empresaContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  empresaIconContainer: {
    marginRight: 12,
  },
  empresaIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  empresaInfo: {
    flex: 1,
  },
  empresaLabel: {
    ...typography.medium.regular,
    color: colors.textSec,
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  empresaText: {
    ...typography.semibold.medium,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.1,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  modulesSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.semibold.large,
    color: colors.text,
    letterSpacing: -0.2,
  },
  countText: {
    ...typography.bold.small,
    color: colors.white,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
