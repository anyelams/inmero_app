// app/reportes/index.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

// Colores corporativos consistentes con home
const reportColors = {
  pedido: {
    background: "#eff6ff", // Azul claro
    icon: "#2563eb", // Azul corporativo
    accent: "#1d4ed8",
  },
  kardex: {
    background: "#f6fdf9", // Verde muy claro
    icon: "#16a34a", // Verde suave
    accent: "#15803d",
  },
  vencidos: {
    background: "#fff7ed", // Naranja muy claro
    icon: "#ea580c", // Naranja profesional
    accent: "#c2410c",
  },
  factura: {
    background: "#fef2f2", // Rojo muy claro
    icon: "#dc2626", // Rojo corporativo
    accent: "#b91c1c",
  },
  orden: {
    background: "#faf5ff", // Púrpura muy claro
    icon: "#7c3aed", // Púrpura
    accent: "#6d28d9",
  },
};

const reportes = [
  {
    id: "1",
    title: "Reporte de\nPedido",
    icon: "clipboard-check-outline",
    route: "/reports/reportePedido",
    moduleColors: reportColors.pedido,
  },
  {
    id: "2",
    title: "Reporte de\nKardex",
    icon: "package-variant-closed",
    route: "/reports/reporteKardex",
    moduleColors: reportColors.kardex,
  },
  {
    id: "3",
    title: "Productos\nVencidos",
    icon: "calendar-alert",
    route: "/reports/reporteProductosVencidos",
    moduleColors: reportColors.vencidos,
  },
  {
    id: "4",
    title: "Reporte de\nFactura",
    icon: "file-document-edit-outline",
    route: "/reports/reporteFactura",
    moduleColors: reportColors.factura,
  },
  {
    id: "5",
    title: "Orden de\nCompra",
    icon: "cart-outline",
    route: "/reports/reporteOrdencompra",
    moduleColors: reportColors.orden,
  },
];

// Componente ReportCard usando el mismo diseño que ModuleCard
const ReportCard = ({ title, icon, moduleColors, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: moduleColors.background,
            borderColor: moduleColors.icon + "33",
          },
        ]}
      >
        <View style={styles.content}>
          {/* Icono principal - contenedor con color más oscuro */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: moduleColors.accent + "15",
                borderColor: moduleColors.accent + "33",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={moduleColors.icon}
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ReportesIndex() {
  const router = useRouter();

  const handleReportePress = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header
        title="Módulo reportes"
        description="Genera y consulta todos tus reportes disponibles."
        onBackPress={() => router.push("/(tabs)/home")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reportes Section */}
        <View style={styles.reportsSection}>
          <View style={styles.grid}>
            {reportes.map((reporte) => (
              <ReportCard
                key={reporte.id}
                title={reporte.title}
                icon={reporte.icon}
                moduleColors={reporte.moduleColors}
                onPress={() => handleReportePress(reporte.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
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
  reportsSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardContainer: {
    width: "48%",
    marginBottom: 20,
  },
  card: {
    height: 130,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 18,
    justifyContent: "flex-start",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
  },
  title: {
    ...typography.semibold.regular,
    color: colors.text,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});
