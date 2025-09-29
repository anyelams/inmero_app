import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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

// Configuración de URLs de API desde variables de entorno
const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";
const API_URL_PRODUCTO =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO ?? "/api/v1/producto";
const API_URL_PRODUCTO_CATEGORIA =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO_CATEGORIA ??
  "/api/v1/producto_categoria";
const API_URL_REPORT_PRODUCTO_VENCIMIENTO =
  Constants.expoConfig?.extra?.API_URL_REPORT_PRODUCTO_VENCIMIENTO ??
  "/api/v2/report/producto_vencimiento";
const API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO =
  Constants.expoConfig?.extra?.API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO ??
  "/api/v2/report/nuevo/producto_vencimiento";

/**
 * Componente principal para el reporte de productos vencidos.
 * Permite consultar productos por categoría y generar reportes PDF
 * basados en rangos de fechas de vencimiento.
 *
 * @component
 * @returns {React.ReactElement} Pantalla de reporte de productos vencidos
 */
export default function ProductosVencidosReporte() {
  const router = useRouter();
  const { token, empresaSeleccionada } = useSession();

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

  const [resultados, setResultados] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

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
   * Normaliza una fecha al formato requerido por el reporte.
   * Convierte de ISO 8601 a formato "YYYY-MM-DD HH:mm"
   *
   * @param {string} val - Fecha en formato ISO o similar
   * @returns {string} Fecha formateada como "YYYY-MM-DD HH:mm"
   */
  const toReportDTmm = (val) => {
    if (!val) return "";
    const [d, t] = String(val).split("T");
    const hhmm = (t || "00:00").slice(0, 5);
    return `${d} ${hhmm}`;
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
   * Carga inicial de datos: productos y categorías.
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
   * Busca y filtra productos según los criterios seleccionados.
   * Solo para visualización en UI, no afecta la generación del reporte.
   *
   * @async
   * @function
   */
  const buscarProductos = async () => {
    if (!validarRango()) return;

    setResultados([]);
    setLoadingProductos(true);

    try {
      const response = await fetch(`${API_URL}${API_URL_PRODUCTO}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener productos");
      }

      const data = await response.json();
      let lista = asArray(data);

      // Filtrar por categoría si está seleccionada
      if (filtro.productoCategoriaId) {
        lista = lista.filter((p) => {
          const catId = getProdCatId(p);
          return String(catId) === String(filtro.productoCategoriaId);
        });
      }

      // Filtrar por producto específico si está seleccionado
      if (filtro.productoId) {
        lista = lista.filter((p) => String(p.id) === String(filtro.productoId));
      }

      setResultados(lista);
      Alert.alert("Resultados", `Mostrando ${lista.length} producto(s).`);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setResultados([]);
      Alert.alert("Error", "No se pudieron cargar productos.");
    } finally {
      setLoadingProductos(false);
    }
  };

  /**
   * Intenta hacer una petición a un endpoint específico para obtener el PDF.
   * Valida que la respuesta sea efectivamente un PDF.
   *
   * @async
   * @param {string} url - URL completa del endpoint
   * @param {Object} payload - Datos a enviar en el body de la petición
   * @returns {Promise<ArrayBuffer>} Buffer con los bytes del PDF
   * @throws {Error} Si la respuesta no es exitosa o no es un PDF
   */
  const tryEndpoint = async (url, payload) => {
    const response = await fetch(url, {
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

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("pdf")) {
      const text = await response.text();
      throw new Error(text || `El servidor no devolvió un PDF en ${url}.`);
    }

    return await response.arrayBuffer();
  };

  /**
   * Genera el reporte PDF de productos vencidos.
   * Intenta dos endpoints diferentes (legacy y nuevo) para máxima compatibilidad.
   * Una vez generado, permite compartir el PDF.
   *
   * @async
   * @function
   * @throws {Error} Si no se completan todos los filtros requeridos o si ambos endpoints fallan
   */
  const generarReporte = async () => {
    console.log("=== INICIANDO GENERACIÓN DE REPORTE PRODUCTOS VENCIDOS ===");

    // Validación estricta de campos requeridos
    if (
      !filtro.productoId ||
      !filtro.productoCategoriaId ||
      !filtro.fechaInicio ||
      !filtro.fechaFin
    ) {
      Alert.alert(
        "Error",
        "Completa producto, categoría y el rango de fechas."
      );
      return;
    }

    if (!validarRango()) return;

    if (!token || !empresaSeleccionada?.empresaId) {
      Alert.alert("Error", "No hay sesión activa o empresa seleccionada.");
      return;
    }

    setGeneratingReport(true);

    try {
      // Preparar payload con formato esperado por el backend
      const payload = {
        producto_id: Number(filtro.productoId),
        producto_categoria_id: Number(filtro.productoCategoriaId),
        fecha_inicio: toReportDTmm(filtro.fechaInicio),
        fecha_fin: toReportDTmm(filtro.fechaFin),
      };

      console.log("Payload enviado:", JSON.stringify(payload, null, 2));

      let dataBlob;

      try {
        // Intento 1: Endpoint legacy
        console.log("Intentando endpoint legacy...");
        dataBlob = await tryEndpoint(
          `${API_URL}${API_URL_REPORT_PRODUCTO_VENCIMIENTO}`,
          payload
        );
        console.log("Endpoint legacy funcionó");
      } catch (eLegacy) {
        console.warn("Legacy falló, probando endpoint nuevo:", eLegacy.message);

        // Intento 2: Endpoint nuevo
        try {
          dataBlob = await tryEndpoint(
            `${API_URL}${API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO}`,
            payload
          );
          console.log("Endpoint nuevo funcionó");
        } catch (eNuevo) {
          console.error("Ambos endpoints fallaron");
          throw new Error(
            `Legacy: ${eLegacy.message} | Nuevo: ${eNuevo.message}`
          );
        }
      }

      console.log("Archivo recibido:", dataBlob.byteLength, "bytes");

      if (dataBlob.byteLength === 0) {
        throw new Error("El archivo recibido está vacío");
      }

      // Convertir ArrayBuffer a base64
      const base64 = btoa(
        new Uint8Array(dataBlob).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Guardar archivo en caché local
      const filename = `reporte_productos_vencidos_${Date.now()}.pdf`;
      const uri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: "base64",
      });

      console.log("Archivo guardado en:", uri);

      // Compartir archivo si está disponible la funcionalidad
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir Reporte de Productos Vencidos",
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
      console.log("=== FIN GENERACIÓN DE REPORTE PRODUCTOS VENCIDOS ===");
    }
  };

  // Configuración para el componente de resultados
  const productosConfig = useSearchResultsConfig("productos");

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
        title="Reporte de Productos Vencidos"
        description="Consulta y genera reportes de vencimiento de productos"
        onBackPress={() => router.push("/reports")}
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
            onSearch={buscarProductos}
            onGenerateReport={generarReporte}
            loadingPedido={loadingProductos}
            generatingReport={generatingReport}
          />

          {/* === RESULTADOS === */}
          {resultados.length > 0 && (
            <GenericSearchResults
              data={resultados}
              config={useSearchResultsConfig("productos")}
            />
          )}

          {/* Loading indicator */}
          {(loadingProductos || generatingReport) && (
            <View style={styles.loadingReport}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={styles.loadingReportText}>
                {loadingProductos
                  ? "Cargando datos..."
                  : "Generando reporte..."}
              </Text>
            </View>
          )}
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
});
