import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderHome from "../../components/HeaderHome";
import { useSession } from "../../context/SessionContext";

const modules = [
  {
    id: "1",
    title: "Modulo\nInventario",
    icon: "clipboard-check",
    route: "modules/inventories",
    backgroundColor: "#E3F2FD",
  },
  {
    id: "2",
    title: "Modulo\nde IoT",
    icon: "access-point",
    route: "modules/IoT/iotScreen",
    backgroundColor: "#E8F5E8",
  },
  {
    id: "3",
    title: "Modulo\nSeguridad",
    icon: "shield-lock-outline",
    route: "modules/security",
    backgroundColor: "#FFF3E0",
  },
  {
    id: "4",
    title: "Modulo\nReportes",
    icon: "chart-line",
    route: "modules/Reportes/ReportesIndex",
    backgroundColor: "#FFEBEE",
  },
];

export default function Home() {
  const router = useRouter();
  const { empresaSeleccionada, rolesByCompany, token } = useSession();

  useEffect(() => {
    console.log("Token recibido en Home:", token);
    console.log("Roles disponibles:", rolesByCompany);
    console.log("Cantidad de roles:", rolesByCompany?.length);
  }, [token, rolesByCompany]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom", "left", "right"]}
    >
      <HeaderHome />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>¡Bienvenido!</Text>
        </View>

        {/* Empresa actual */}
        <View style={styles.empresaContainer}>
          <Text style={styles.empresaText}>
            Empresa actual: {empresaSeleccionada?.empresaNombre}
          </Text>
          {rolesByCompany?.length > 1 && (
            <TouchableOpacity
              onPress={() => router.replace("/company/selection")}
            >
              <Text style={styles.cambiarLink}>Cambiar empresa</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Módulos */}
        <View style={styles.grid}>
          {modules.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.moduleCard,
                { backgroundColor: item.backgroundColor },
              ]}
              onPress={() => router.push(item.route)}
              activeOpacity={0.85}
            >
              <View style={styles.moduleContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={28}
                    color="#666"
                  />
                </View>
                <Text style={styles.moduleTitle}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  welcomeSection: { marginBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 4 },
  empresaContainer: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  empresaText: { fontSize: 14, color: "#333", marginBottom: 6 },
  cambiarLink: { fontSize: 13, color: "#1976D2", fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  moduleCard: {
    width: "48%",
    height: 140,
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    justifyContent: "center",
  },
  moduleContent: { alignItems: "flex-start" },
  iconContainer: { marginBottom: 12 },
  moduleTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    lineHeight: 20,
  },
});
