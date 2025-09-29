import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButtons from "../../components/ActionButtons";
import ReportHeader from "../../components/ReportHeader";
import {
  GenericSearchResults,
  useSearchResultsConfig,
} from "../../components/SearchResults";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";

// Componentes reutilizables
import CustomPicker from "../../components/CustomPicker";
import DateTimeInput from "../../components/DateTimeInput";
import LocationFilters from "../../components/LocationFilters";

// Hook custom
import useLocationFilters from "../../hooks/useLocationFilters";

// Configuración de URLs de API desde variables de entorno
const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";
const API_URL_PRODUCTO =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO ?? "/api/v1/producto";
const API_URL_PRODUCTO_CATEGORIA =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO_CATEGORIA ??
  "/api/v1/producto_categoria";
const API_URL_ARTICULO_KARDEX =
  Constants.expoConfig?.extra?.API_URL_ARTICULO_KARDEX ??
  "/api/v1/articulo-kardex";
const API_URL_REPORT_KARDEX =
  Constants.expoConfig?.extra?.API_URL_REPORT_KARDEX ?? "/api/v2/report/kardex";
const LOGO_URL = Constants.expoConfig?.extra?.LOGO_URL ?? "";

/**
 * Componente principal para el reporte de Kardex.
 * Permite consultar artículos del kardex con múltiples filtros y generar reportes PDF
 * incluyendo fechas, productos, categorías y ubicaciones geográficas.
 *
 * Funcionalidades:
 * - Filtros principales: Producto, Categoría, Rango de fechas
 * - Filtros de ubicación opcionales (País → Departamento → Municipio → Sede → Bloque → Espacio → Almacén)
 * - Búsqueda/vista previa de datos antes de generar reporte
 * - Generación y descarga de reporte PDF
 * - Validación de rangos de fechas
 * - Autoselección de opciones cuando solo hay una disponible
 *
 * Flujo:
 * 1. Usuario selecciona filtros (categoría/producto y fechas)
 * 2. Presiona "Buscar" para ver preview de artículos del kardex
 * 3. Presiona "Generar Reporte" para crear PDF
 * 4. Sistema descarga y comparte el PDF
 *
 * @component
 * @returns {React.ReactElement} Pantalla de reporte de Kardex
 */
export default function KardexReporte() {
  const router = useRouter();
  const { token, empresaSeleccionada } = useSession();

  // Hook para manejo de ubicación
  const locationFilters = useLocationFilters(token, API_URL);

  // Estados principales
  const [filtro, setFiltro] = useState({
    productoId: null,
    productoCategoriaId: null,
    fechaInicio: "",
    fechaFin: "",
  });

  const [mainData, setMainData] = useState({
    productos: [],
    categorias: [],
  });

  // Estados para resultados
  const [articulos, setArticulos] = useState([]);

  // Estados de loading
  const [loadingData, setLoadingData] = useState(false);
  const [loadingKardex, setLoadingKardex] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Estado para modal de filtros
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  /**
   * Convierte un valor en array si no lo es.
   * Útil para normalizar respuestas de API que pueden venir
   * como array o como objeto con propiedad 'content'.
   *
   * @param {any} x - Valor a convertir
   * @returns {Array} Array con los datos
   */
  const asArray = (x) => (Array.isArray(x) ? x : x?.content ?? []);

  /**
   * Convierte fecha ISO a formato requerido por el backend del reporte.
   * Formato de salida: "YYYY-MM-DD HH:MM:SS"
   *
   * @param {string} val - Fecha en formato ISO (YYYY-MM-DDTHH:MM:SS)
   * @returns {string} Fecha formateada (YYYY-MM-DD HH:MM:SS)
   * @example
   * toReportDateTime("2024-03-15T14:30") // "2024-03-15 14:30:00"
   */
  const toReportDateTime = (val) => {
    if (!val) return "";
    const [d, t] = String(val).split("T");
    const hhmm = (t || "00:00").slice(0, 5);
    return `${d} ${hhmm}:00`;
  };

  /**
   * Obtiene el ID de categoría de un producto.
   * Maneja múltiples estructuras de datos posibles del backend.
   *
   * @param {Object} p - Objeto producto
   * @returns {number|null} ID de la categoría o null si no se encuentra
   */
  const getProdCatId = (p) =>
    p?.productoCategoriaId ??
    p?.categoriaProductoId ??
    p?.categoriaId ??
    p?.categoria?.id ??
    p?.productoCategoria?.id ??
    null;

  /**
   * Detecta si hay filtros de ubicación activos.
   *
   * @returns {boolean} true si hay al menos un filtro de ubicación seleccionado
   */
  const hasActiveFilters = () => {
    return (
      locationFilters.selected.paisId ||
      locationFilters.selected.departamentoId ||
      locationFilters.selected.municipioId ||
      locationFilters.selected.sedeId ||
      locationFilters.selected.bloqueId ||
      locationFilters.selected.espacioId ||
      locationFilters.selected.almacenId
    );
  };

  /**
   * Abre el modal de filtros de ubicación.
   */
  const handleFilterPress = () => {
    setShowFiltersModal(true);
  };

  /**
   * Cierra el modal de filtros de ubicación.
   */
  const handleCloseModal = () => {
    setShowFiltersModal(false);
  };

  /**
   * Valida que el rango de fechas sea correcto.
   * Verifica que la fecha de inicio no sea mayor que la fecha fin.
   *
   * @returns {boolean} true si el rango es válido, false en caso contrario
   */
  const validarRango = () => {
    if (filtro.fechaInicio && filtro.fechaFin) {
      const ini = new Date(filtro.fechaInicio);
      const fin = new Date(filtro.fechaFin);
      if (ini > fin) {
        Alert.alert(
          "Error de fechas",
          "La fecha de inicio no puede ser mayor que la fecha fin."
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Construye objeto de parámetros para el reporte de kardex.
   * Incluye todos los filtros seleccionados (fechas, ubicación, producto, categoría).
   *
   * @returns {Object} Parámetros formateados para el endpoint del reporte
   */
  const construirParametros = () => {
    const logoPath = `${LOGO_URL}${empresaSeleccionada?.empresaId}/logo_empresa.jpeg`;

    return {
      empresa_id: Number(empresaSeleccionada?.empresaId),
      fecha_inicio: toReportDateTime(filtro.fechaInicio),
      fecha_fin: toReportDateTime(filtro.fechaFin),
      logo_empresa: logoPath,
      // Ubicación opcional
      pais_id: locationFilters.selected.paisId || "",
      departamento_id: locationFilters.selected.departamentoId || "",
      municipio_id: locationFilters.selected.municipioId || "",
      sede_id: locationFilters.selected.sedeId || "",
      bloque_id: locationFilters.selected.bloqueId || "",
      espacio_id: locationFilters.selected.espacioId || "",
      almacen_id: locationFilters.selected.almacenId || "",
      // Producto opcional
      producto_id: filtro.productoId || "",
      producto_categoria_id: filtro.productoCategoriaId || "",
    };
  };

  /**
   * Manejador para cambio de producto seleccionado.
   *
   * @param {number|string} value - ID del producto seleccionado
   */
  const handleProductoChange = (value) => {
    setFiltro((prev) => ({ ...prev, productoId: value }));
  };

  /**
   * Manejador para cambio de categoría seleccionada.
   * Al cambiar la categoría, limpia el producto seleccionado.
   *
   * @param {number|string} value - ID de la categoría seleccionada
   */
  const handleCategoriaChange = (value) => {
    setFiltro((prev) => ({
      ...prev,
      productoCategoriaId: value,
      productoId: null,
    }));
  };

  /**
   * Manejador para cambio de fecha de inicio.
   *
   * @param {string} value - Fecha de inicio
   */
  const handleFechaInicioChange = (value) => {
    setFiltro((prev) => ({ ...prev, fechaInicio: value }));
  };

  /**
   * Manejador para cambio de fecha fin.
   *
   * @param {string} value - Fecha fin
   */
  const handleFechaFinChange = (value) => {
    setFiltro((prev) => ({ ...prev, fechaFin: value }));
  };

  /**
   * Lista de productos filtrados por la categoría seleccionada.
   * Si no hay categoría seleccionada, retorna todos los productos.
   *
   * @type {Array<Object>}
   */
  const productosFiltrados = React.useMemo(() => {
    if (!filtro.productoCategoriaId) return mainData.productos;

    return mainData.productos.filter((p) => {
      const catId = getProdCatId(p);
      return Number(catId) === Number(filtro.productoCategoriaId);
    });
  }, [mainData.productos, filtro.productoCategoriaId]);

  /**
   * Auto-selecciona el producto si solo hay uno disponible en el filtro.
   */
  useEffect(() => {
    if (productosFiltrados.length === 1 && !filtro.productoId) {
      setFiltro((prev) => ({
        ...prev,
        productoId: productosFiltrados[0].id,
      }));
    }
  }, [productosFiltrados, filtro.productoId]);

  /**
   * Carga inicial de datos: productos, categorías y ubicaciones.
   * Se ejecuta una vez al montar el componente si existe token.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return;

      setLoadingData(true);
      try {
        const [productosRes, categoriasRes] = await Promise.all([
          fetch(`${API_URL}${API_URL_PRODUCTO}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}${API_URL_PRODUCTO_CATEGORIA}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const productosData = await productosRes.json();
        const categoriasData = await categoriasRes.json();

        setMainData({
          productos: asArray(productosData),
          categorias: asArray(categoriasData),
        });

        // Cargar países para ubicación usando el hook
        await locationFilters.loadInitialData();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        Alert.alert("Error", "Error cargando productos y categorías");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [token]);

  /**
   * Busca artículos del kardex según filtros seleccionados.
   * Muestra preview antes de generar el reporte.
   *
   * @async
   * @function
   */
  const buscarKardex = async () => {
    if (!validarRango()) return;

    setArticulos([]);
    setLoadingKardex(true);

    try {
      const params = construirParametros();
      const queryParams = new URLSearchParams();

      // Agregar parámetros no vacíos
      Object.entries(params).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(
        `${API_URL}${API_URL_ARTICULO_KARDEX}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener datos del kardex");
      }

      const data = await response.json();
      const lista = asArray(data);

      setArticulos(lista);
      Alert.alert(
        "Resultados",
        `Mostrando ${lista.length} registro(s) de kardex.`
      );
    } catch (error) {
      console.error("Error al buscar kardex:", error);
      setArticulos([]);
      Alert.alert("Error", "No se pudo obtener el Kardex.");
    } finally {
      setLoadingKardex(false);
    }
  };

  /**
   * Genera un reporte PDF del kardex y lo comparte.
   *
   * Proceso:
   * 1. Valida datos requeridos (fechas obligatorias)
   * 2. Construye payload con todos los filtros
   * 3. Llama a API para generar PDF
   * 4. Convierte ArrayBuffer a Base64
   * 5. Guarda archivo temporalmente en caché
   * 6. Comparte usando sistema nativo de compartir
   *
   * @async
   * @function
   * @throws {Error} Si faltan fechas o falla la generación del reporte
   */
  const generarReporte = async () => {
    console.log("=== INICIANDO GENERACIÓN DE REPORTE KARDEX ===");

    if (!filtro.fechaInicio || !filtro.fechaFin) {
      Alert.alert("Error", "Completa el rango de fechas.");
      return;
    }

    if (!validarRango()) return;

    if (!token || !empresaSeleccionada?.empresaId) {
      Alert.alert("Error", "No hay sesión activa o empresa seleccionada.");
      return;
    }

    setGeneratingReport(true);

    try {
      const payload = construirParametros();
      console.log("Payload enviado:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_URL}${API_URL_REPORT_KARDEX}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "FrontendMovil/1.0.0 (React Native)",
          Accept: "application/pdf, application/json, */*",
          "Cache-Control": "no-cache",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      console.log("Status respuesta:", response.status);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorBody = await response.json();
            errorMessage += ` - ${JSON.stringify(errorBody)}`;
          } else {
            const errorText = await response.text();
            if (errorText) errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          console.log("No se pudo leer el cuerpo del error:", e.message);
        }
        throw new Error(errorMessage);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log("Archivo recibido:", arrayBuffer.byteLength, "bytes");

      if (arrayBuffer.byteLength === 0) {
        throw new Error("El archivo recibido está vacío");
      }

      // Verificar si realmente es un PDF
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("pdf")) {
        const text = new TextDecoder().decode(arrayBuffer);
        throw new Error(text || "El servidor no devolvió un PDF.");
      }

      // Convertir ArrayBuffer a base64
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Guardar archivo en caché local
      const filename = `reporte_kardex_${Date.now()}.pdf`;
      const uri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: "base64",
      });

      console.log("Archivo guardado en:", uri);

      // Compartir archivo si está disponible la funcionalidad
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir Reporte de Kardex",
        });
      } else {
        Alert.alert("Éxito", "Reporte generado correctamente");
      }

      console.log("Proceso completado exitosamente");
    } catch (error) {
      console.error("Error completo:", error);
      Alert.alert("Error", `No se pudo generar el reporte: ${error.message}`);
    } finally {
      setGeneratingReport(false);
      console.log("=== FIN GENERACIÓN DE REPORTE KARDEX ===");
    }
  };

  // Configuración para el componente de resultados
  const kardexConfig = useSearchResultsConfig("kardex");

  // Pantalla de carga inicial
  if (loadingData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ReportHeader
        title="Reporte de Kardex"
        description="Consulta y genera reportes de kardex de productos"
        onBackPress={() => router.push("/reports")}
        onFilterPress={handleFilterPress}
        filterActive={hasActiveFilters()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContent}>
          {/* === FILTROS PRINCIPALES === */}
          <View style={styles.mainFiltersContainer}>
            <CustomPicker
              label="Categoría Producto"
              items={mainData.categorias}
              selectedValue={filtro.productoCategoriaId}
              onValueChange={handleCategoriaChange}
              placeholder="Selecciona una categoría"
            />

            <CustomPicker
              label="Producto"
              items={productosFiltrados}
              selectedValue={filtro.productoId}
              onValueChange={handleProductoChange}
              placeholder="Selecciona un producto"
              enabled={productosFiltrados.length > 0}
            />

            <DateTimeInput
              label="Fecha Inicio"
              value={filtro.fechaInicio}
              onChangeText={handleFechaInicioChange}
              placeholder="DD/MM/AAAA HH:MM"
            />

            <DateTimeInput
              label="Fecha Fin"
              value={filtro.fechaFin}
              onChangeText={handleFechaFinChange}
              placeholder="DD/MM/AAAA HH:MM"
            />
          </View>

          {/* === BOTONES DE ACCIÓN === */}
          <ActionButtons
            onSearch={buscarKardex}
            onGenerateReport={generarReporte}
            loadingPedido={loadingKardex}
            generatingReport={generatingReport}
          />

          {/* === RESULTADOS === */}
          {articulos.length > 0 && (
            <GenericSearchResults
              data={articulos}
              config={useSearchResultsConfig("kardex")}
            />
          )}

          {/* Loading indicator */}
          {(loadingKardex || generatingReport) && (
            <View style={styles.loadingReport}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={styles.loadingReportText}>
                {loadingKardex ? "Cargando datos..." : "Generando reporte..."}
              </Text>
            </View>
          )}
        </View>

        {/* === MODAL DE FILTROS DE UBICACIÓN === */}
        <Modal
          visible={showFiltersModal}
          animationType="slide"
          onRequestClose={handleCloseModal}
          statusBarTranslucent
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Ubicación</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Contenido scrolleable */}
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <LocationFilters
                selected={locationFilters.selected}
                locationData={locationFilters.locationData}
                handlers={locationFilters.handlers}
              />
            </ScrollView>

            {/* Footer fijo */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
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
  pageContent: {
    paddingHorizontal: 16,
  },
  mainFiltersContainer: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.base,
  },
  loadingText: {
    ...typography.regular.medium,
    marginTop: 10,
    color: colors.textSec,
  },
  loadingReport: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  loadingReportText: {
    ...typography.regular.medium,
    marginLeft: 10,
    color: colors.textSec,
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  modalTitle: {
    ...typography.bold.large,
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    ...typography.bold.large,
    color: colors.textSec,
    lineHeight: 24,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  modalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
});
