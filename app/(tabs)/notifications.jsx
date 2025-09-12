import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "../../components/CustomHeader";

const mockData = [
  {
    id: 1,
    titulo: "Nuevo mensaje",
    mensaje: "Revisa la bandeja de entrada.",
    fecha: "hace 5 min",
    estado: "no leida",
  },
  {
    id: 2,
    titulo: "Sistema actualizado",
    mensaje: "La versión 1.4 está disponible.",
    fecha: "hace 1 hora",
    estado: "leida",
  },
  {
    id: 3,
    titulo: "Sensor desconectado",
    mensaje: "Sensor 03 perdió conexión.",
    fecha: "ayer",
    estado: "no leida",
  },
];

export default function NotificationsScreen() {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    setNotificaciones(mockData);
  }, []);

  const marcarComoLeida = (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, estado: "leida" } : n))
    );
  };

  const marcarTodoComoLeido = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, estado: "leida" })));
  };

  const unreadCount = notificaciones.filter((n) => n.estado !== "leida").length;

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <CustomHeader title="Notificaciones" backRoute="(tabs)/home" />

      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => marcarComoLeida(item.id)}
            disabled={item.estado === "leida"}
            style={[styles.card, item.estado === "leida" && styles.cardLeida]}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name={
                  item.estado === "leida"
                    ? "notifications-outline"
                    : "notifications"
                }
                size={22}
                color={item.estado === "leida" ? "#888" : "#007AFF"}
              />
            </View>
            <View style={styles.textContainer}>
              <View style={styles.textHeader}>
                <Text style={styles.titulo}>{item.titulo}</Text>
                <Text style={styles.fecha}>{item.fecha}</Text>
              </View>
              <Text style={styles.mensaje}>{item.mensaje}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {unreadCount > 0 && (
        <TouchableOpacity onPress={marcarTodoComoLeido} style={styles.fab}>
          <Text style={styles.fabText}>Marcar todo leído</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  card: {
    backgroundColor: "#ECEEF1",
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#B0B0B0",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeida: {
    backgroundColor: "#F2F2F2",
    borderLeftColor: "#B0B0B0",
    opacity: 0.9,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  textContainer: { flex: 1 },
  textHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  titulo: { fontWeight: "bold", fontSize: 16, color: "#333" },
  fecha: { fontSize: 12, color: "#777" },
  mensaje: { fontSize: 14, color: "#444" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
