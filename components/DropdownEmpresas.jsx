// components/DropdownEmpresas.jsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Formatea nombres de roles removiendo prefijos y aplicando capitalización
 * @param {string} roleName - Nombre del rol a formatear
 * @returns {string} - Nombre del rol formateado
 */
const formatRoleName = (roleName) => {
  if (!roleName) return "Rol sin nombre";

  return roleName
    .replace(/^ROLE_/, "") // Quitar prefijo ROLE_
    .replace(/_/g, " ") // Cambiar _ por espacios
    .toLowerCase() // Todo en minúsculas
    .split(" ") // Dividir en palabras
    .map((word) => {
      // Capitalizar primera letra de cada palabra
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" "); // Unir con espacios
};

/**
 * Capitaliza la primera letra de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto con primera letra mayúscula
 */
const capitalizeFirstLetter = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Dropdown expansible para seleccionar empresas y roles
 * Muestra una lista de empresas con sus roles asociados, permitiendo
 * expandir/colapsar cada empresa y seleccionar roles específicos
 * @param {Object} props
 * @param {Array} [props.data=[]] - Array de empresas con sus roles
 * @param {Object} props.seleccion - Objeto con empresaId y rolId seleccionados
 * @param {Function} props.onSelectEmpresa - Callback al seleccionar una empresa
 * @param {Function} props.onSelectRol - Callback al seleccionar un rol
 */
export default function DropdownEmpresas({
  data = [],
  seleccion,
  onSelectEmpresa,
  onSelectRol,
}) {
  // Estados para controlar expansión y animaciones
  const [empresaExpandida, setEmpresaExpandida] = useState(null);
  const [animatedValues, setAnimatedValues] = useState({});

  /**
   * Inicializa valores de animación y auto-expande si solo hay una empresa
   */
  useEffect(() => {
    const values = {};
    data.forEach((item) => {
      values[item.empresaId] = new Animated.Value(0);
    });
    setAnimatedValues(values);

    // Auto-expandir si solo hay una empresa
    if (data && data.length === 1 && !empresaExpandida) {
      setEmpresaExpandida(data[0].empresaId);
      setTimeout(() => {
        Animated.timing(values[data[0].empresaId], {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }, 100);
    }
  }, [data]);

  /**
   * Maneja la expansión/colapso de una empresa
   * @param {number} empresaId - ID de la empresa a expandir/colapsar
   * @param {Array} roles - Roles asociados a la empresa
   */
  const handleEmpresaPress = (empresaId, roles) => {
    const isCurrentlyExpanded = empresaExpandida === empresaId;
    const newExpanded = isCurrentlyExpanded ? null : empresaId;

    setEmpresaExpandida(newExpanded);

    // Animar expansión/colapso
    if (animatedValues[empresaId]) {
      Animated.timing(animatedValues[empresaId], {
        toValue: isCurrentlyExpanded ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    if (onSelectEmpresa) {
      onSelectEmpresa(empresaId, roles);
    }
  };

  /**
   * Maneja la selección de un rol específico
   * @param {number} empresaId - ID de la empresa
   * @param {number} rolId - ID del rol seleccionado
   * @param {string} rolNombre - Nombre del rol seleccionado
   */
  const handleRolPress = (empresaId, rolId, rolNombre) => {
    if (onSelectRol) {
      onSelectRol(empresaId, rolId);
    }
  };

  // Estado vacío cuando no hay datos
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay empresas disponibles</Text>
        <Text style={styles.emptySubtext}>Contacta al administrador</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {data.map((item, index) => {
          const isExpandida = item.empresaId === empresaExpandida;
          const seleccionActual = seleccion?.empresaId === item.empresaId;
          const animatedValue =
            animatedValues[item.empresaId] || new Animated.Value(0);

          // Interpolaciones para animaciones
          const rolesHeight = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, (item.roles?.length || 0) * 60],
          });

          const rotateChevron = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "180deg"],
          });

          return (
            <View
              key={item.empresaId}
              style={[styles.card, seleccionActual && styles.cardActiva]}
            >
              {/* Header expansible de la empresa */}
              <TouchableOpacity
                style={styles.empresaHeader}
                onPress={() => handleEmpresaPress(item.empresaId, item.roles)}
                activeOpacity={0.7}
              >
                <View style={styles.empresaContent}>
                  <View style={styles.empresaInfo}>
                    <Text
                      style={[
                        styles.empresaNombre,
                        seleccionActual && styles.empresaNombreActiva,
                      ]}
                      numberOfLines={1}
                    >
                      {item.empresaNombre || "Empresa sin nombre"}
                    </Text>
                    <Text style={styles.rolesCount}>
                      {item.roles?.length || 0} rol
                      {(item.roles?.length || 0) !== 1 ? "es" : ""}
                    </Text>
                  </View>
                </View>

                {/* Chevron animado */}
                <Animated.View
                  style={[
                    styles.chevronContainer,
                    { transform: [{ rotate: rotateChevron }] },
                  ]}
                >
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSec}
                  />
                </Animated.View>
              </TouchableOpacity>

              {/* Contenedor animado para los roles */}
              <Animated.View
                style={[
                  styles.rolesAnimatedContainer,
                  { height: isExpandida ? rolesHeight : 0 },
                ]}
              >
                <View style={styles.rolesContainer}>
                  {item.roles && item.roles.length > 0 ? (
                    item.roles.map((rol, rolIndex) => {
                      const isSelected =
                        seleccion?.empresaId === item.empresaId &&
                        seleccion?.rolId === rol.rolId;

                      return (
                        <TouchableOpacity
                          key={rol.rolId || rolIndex}
                          style={[
                            styles.rolItem,
                            isSelected && styles.rolSeleccionado,
                          ]}
                          onPress={() =>
                            handleRolPress(
                              item.empresaId,
                              rol.rolId,
                              rol.rolNombre
                            )
                          }
                          activeOpacity={0.7}
                        >
                          {/* Indicador visual de selección */}
                          {isSelected && (
                            <View style={styles.selectedIndicator} />
                          )}

                          <Text
                            style={[
                              styles.rolNombre,
                              isSelected && styles.rolNombreSeleccionado,
                            ]}
                            numberOfLines={1}
                          >
                            {formatRoleName(rol.rolNombre)}
                          </Text>

                          {/* Checkmark para rol seleccionado */}
                          {isSelected && (
                            <View style={styles.checkContainer}>
                              <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={colors.secondary}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    // Estado cuando no hay roles
                    <View style={styles.noRolesContainer}>
                      <Text style={styles.noRolesText}>
                        No hay roles disponibles
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 0,
  },

  // Tarjetas principales de empresa
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActiva: {
    borderColor: colors.secondary + "30",
    shadowOpacity: 0.1,
  },

  // Header expansible de empresa
  empresaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    backgroundColor: "#f8fafc",
    minHeight: 70,
  },
  empresaContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  empresaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.secondary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  empresaIconActiva: {
    backgroundColor: colors.secondary,
  },
  empresaInfo: {
    flex: 1,
  },
  empresaNombre: {
    ...typography.semibold.regular,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  empresaNombreActiva: {
    color: colors.secondary,
  },
  rolesCount: {
    ...typography.regular.small,
    fontSize: 13,
    color: colors.textSec,
  },
  chevronContainer: {
    padding: 4,
  },

  // Contenedor animado de roles
  rolesAnimatedContainer: {
    overflow: "hidden",
  },
  rolesContainer: {
    backgroundColor: colors.white,
  },
  rolItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    paddingLeft: 24,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 60,
  },
  rolSeleccionado: {
    backgroundColor: "#f8fafc",
    paddingLeft: 24,
  },
  selectedIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.secondary,
  },
  rolNombre: {
    ...typography.regular.regular,
    fontSize: 15,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  rolNombreSeleccionado: {
    ...typography.semibold.regular,
    color: colors.secondary,
  },
  checkContainer: {
    marginLeft: 12,
  },

  // Estados vacíos
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    ...typography.semibold.regular,
    fontSize: 16,
    color: colors.textSec,
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtext: {
    ...typography.regular.small,
    fontSize: 14,
    color: colors.textSec,
    textAlign: "center",
    opacity: 0.7,
  },
  noRolesContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: colors.base,
  },
  noRolesText: {
    ...typography.regular.regular,
    fontSize: 14,
    color: colors.textSec,
    textAlign: "center",
    fontStyle: "italic",
  },
});
