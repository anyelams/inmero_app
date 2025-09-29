import Constants from "expo-constants";
import { useCallback, useState } from "react";

const {
  API_URL_PAIS,
  API_URL_DEPARTAMENTO,
  API_URL_MUNICIPIO,
  API_URL_SEDE,
  API_URL_BLOQUE,
  API_URL_ESPACIO,
  API_URL_ALMACEN,
} = Constants.expoConfig.extra || {};

/**
 * Hook personalizado para gestionar filtros de ubicación jerárquicos
 *
 * Maneja la selección en cascada de ubicaciones geográficas y estructurales:
 * País → Departamento → Municipio → Sede → Bloque → Espacio → Almacén
 *
 * Características:
 * - Carga dinámica de datos según selección previa
 * - Autoselección cuando solo hay una opción disponible
 * - Limpieza automática de selecciones dependientes
 * - Gestión de estado centralizada para todos los niveles
 *
 * @param {string} token - Token de autenticación para llamadas a la API
 * @param {string} API_URL - URL base de la API
 *
 * @returns {Object} Estado y funciones del hook
 * @returns {Object} selected - IDs seleccionados en cada nivel
 * @returns {Object} locationData - Datos cargados para cada nivel
 * @returns {Object} handlers - Funciones para manejar cambios en cada nivel
 * @returns {Function} loadInitialData - Carga datos iniciales (países)
 * @returns {Function} reset - Reinicia todos los estados
 */
const useLocationFilters = (token, API_URL) => {
  const [selected, setSelected] = useState({
    paisId: null,
    departamentoId: null,
    municipioId: null,
    sedeId: null,
    bloqueId: null,
    espacioId: null,
    almacenId: null,
  });

  const [locationData, setLocationData] = useState({
    paises: [],
    departamentos: [],
    municipios: [],
    sedes: [],
    bloques: [],
    espacios: [],
    almacenes: [],
  });

  /**
   * Normaliza la respuesta de la API a un array
   * Maneja tanto arrays directos como objetos paginados con propiedad 'content'
   * @param {Array|Object} x - Respuesta de la API
   * @returns {Array} Array normalizado
   */
  const asArray = (x) => (Array.isArray(x) ? x : x?.content ?? []);

  /**
   * Realiza petición a la API y actualiza el estado correspondiente
   * @param {string} endpoint - Endpoint de la API (ej: '/api/v1/items/pais/0')
   * @param {string} stateKey - Clave del estado a actualizar (ej: 'paises')
   * @param {Function} [filterFn] - Función opcional para filtrar resultados
   * @returns {Promise<Array>} Array de datos procesados
   */
  const fetchData = useCallback(
    async (endpoint, stateKey, filterFn = null) => {
      try {
        console.log(`Fetching ${stateKey} desde:`, `${API_URL}${endpoint}`);

        const res = await fetch(`${API_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const arrayData = asArray(data);
        const processedData = filterFn ? arrayData.filter(filterFn) : arrayData;

        setLocationData((prev) => ({
          ...prev,
          [stateKey]: processedData,
        }));

        return processedData;
      } catch (error) {
        console.error(`Error cargando ${stateKey}:`, error);
        return [];
      }
    },
    [token, API_URL]
  );

  /**
   * Autoselecciona un item si es el único disponible
   * Ejecuta callback opcional para cargar siguiente nivel de la cascada
   *
   * @param {Array} items - Items disponibles para selección
   * @param {string} selectedKey - Clave del estado a actualizar
   * @param {Function} [callback] - Función a ejecutar tras autoselección
   */
  const autoSelectIfSingle = useCallback((items, selectedKey, callback) => {
    setTimeout(() => {
      if (items.length === 1) {
        console.log(`Autoseleccionando ${selectedKey}:`, items[0].id);
        setSelected((current) => ({ ...current, [selectedKey]: items[0].id }));
        if (callback) callback(items[0].id);
      }
    }, 100);
  }, []);

  /**
   * Limpia selecciones de niveles dependientes al cambiar un nivel superior
   * @param {string} fromLevel - Nivel desde el cual limpiar (ej: 'paisId')
   */
  const clearDependentSelections = useCallback((fromLevel) => {
    const levels = [
      "paisId",
      "departamentoId",
      "municipioId",
      "sedeId",
      "bloqueId",
      "espacioId",
      "almacenId",
    ];
    const fromIndex = levels.indexOf(fromLevel);
    const toClear = levels.slice(fromIndex + 1);

    setSelected((prev) => {
      const newSelected = { ...prev };
      toClear.forEach((level) => {
        newSelected[level] = null;
      });
      return newSelected;
    });
  }, []);

  /**
   * Limpia datos cargados de niveles dependientes
   * @param {string} fromLevel - Nivel desde el cual limpiar datos
   */
  const clearDependentData = useCallback((fromLevel) => {
    const dataKeys = [
      "departamentos",
      "municipios",
      "sedes",
      "bloques",
      "espacios",
      "almacenes",
    ];
    const clearMap = {
      paisId: ["municipios", "sedes", "bloques", "espacios", "almacenes"],
      departamentoId: ["sedes", "bloques", "espacios", "almacenes"],
      municipioId: ["bloques", "espacios", "almacenes"],
      sedeId: ["espacios", "almacenes"],
      bloqueId: ["almacenes"],
    };

    const toClear = clearMap[fromLevel] || [];
    setLocationData((prev) => {
      const newData = { ...prev };
      toClear.forEach((key) => {
        newData[key] = [];
      });
      return newData;
    });
  }, []);

  /**
   * Maneja cambio de país
   * Carga departamentos y ejecuta cascada de autoselecciones si aplica
   * @param {number} paisId - ID del país seleccionado
   */
  const handlePaisChange = useCallback(
    async (paisId) => {
      clearDependentSelections("paisId");
      clearDependentData("paisId");
      setSelected((prev) => ({ ...prev, paisId }));

      if (paisId) {
        const departamentos = await fetchData(
          `${API_URL_DEPARTAMENTO}/${paisId}`,
          "departamentos"
        );
        autoSelectIfSingle(departamentos, "departamentoId", async (deptoId) => {
          const municipios = await fetchData(
            `${API_URL_MUNICIPIO}/${deptoId}`,
            "municipios"
          );
          autoSelectIfSingle(municipios, "municipioId", async (municId) => {
            const sedes = await fetchData(
              API_URL_SEDE,
              "sedes",
              (s) => s.municipioId === parseInt(municId)
            );
            autoSelectIfSingle(sedes, "sedeId");
          });
        });
      }
    },
    [
      fetchData,
      clearDependentSelections,
      clearDependentData,
      autoSelectIfSingle,
    ]
  );

  const handleDepartamentoChange = useCallback(
    async (departamentoId) => {
      clearDependentSelections("departamentoId");
      clearDependentData("departamentoId");
      setSelected((prev) => ({ ...prev, departamentoId }));

      if (departamentoId) {
        const municipios = await fetchData(
          `${API_URL_MUNICIPIO}/${departamentoId}`,
          "municipios"
        );
        autoSelectIfSingle(municipios, "municipioId", async (municId) => {
          const sedes = await fetchData(
            API_URL_SEDE,
            "sedes",
            (s) => s.municipioId === parseInt(municId)
          );
          autoSelectIfSingle(sedes, "sedeId");
        });
      }
    },
    [
      fetchData,
      clearDependentSelections,
      clearDependentData,
      autoSelectIfSingle,
    ]
  );

  const handleMunicipioChange = useCallback(
    async (municipioId) => {
      clearDependentSelections("municipioId");
      clearDependentData("municipioId");
      setSelected((prev) => ({ ...prev, municipioId }));

      if (municipioId) {
        const sedes = await fetchData(
          "/api/v1/sede",
          "sedes",
          (s) => s.municipioId === parseInt(municipioId)
        );
        autoSelectIfSingle(sedes, "sedeId", async (sedeId) => {
          const bloques = await fetchData(
            "/api/v1/bloque",
            "bloques",
            (b) => b.sedeId === parseInt(sedeId)
          );
          autoSelectIfSingle(bloques, "bloqueId");
        });
      }
    },
    [
      fetchData,
      clearDependentSelections,
      clearDependentData,
      autoSelectIfSingle,
    ]
  );

  const handleSedeChange = useCallback(
    async (sedeId) => {
      clearDependentSelections("sedeId");
      clearDependentData("sedeId");
      setSelected((prev) => ({ ...prev, sedeId }));

      if (sedeId) {
        const bloques = await fetchData(
          API_URL_BLOQUE,
          "bloques",
          (b) => b.sedeId === parseInt(sedeId)
        );
        autoSelectIfSingle(bloques, "bloqueId", async (bloqueId) => {
          const espacios = await fetchData(
            API_URL_ESPACIO,
            "espacios",
            (e) => e.bloqueId === parseInt(bloqueId)
          );
          autoSelectIfSingle(espacios, "espacioId");
        });
      }
    },
    [
      fetchData,
      clearDependentSelections,
      clearDependentData,
      autoSelectIfSingle,
    ]
  );

  const handleBloqueChange = useCallback(
    async (bloqueId) => {
      clearDependentSelections("bloqueId");
      clearDependentData("bloqueId");
      setSelected((prev) => ({ ...prev, bloqueId }));

      if (bloqueId) {
        const espacios = await fetchData(
          API_URL_ESPACIO,
          "espacios",
          (e) => e.bloqueId === parseInt(bloqueId)
        );
        autoSelectIfSingle(espacios, "espacioId", async (espacioId) => {
          const almacenes = await fetchData(
            API_URL_ALMACEN,
            "almacenes",
            (a) => a.espacioId === parseInt(espacioId)
          );
          autoSelectIfSingle(almacenes, "almacenId");
        });
      }
    },
    [
      fetchData,
      clearDependentSelections,
      clearDependentData,
      autoSelectIfSingle,
    ]
  );

  const handleEspacioChange = useCallback(
    async (espacioId) => {
      clearDependentSelections("espacioId");
      clearDependentData("espacioId");
      setSelected((prev) => ({ ...prev, espacioId }));

      if (espacioId) {
        const almacenes = await fetchData(
          API_URL_ALMACEN,
          "almacenes",
          (a) => a.espacioId === parseInt(espacioId)
        );
        autoSelectIfSingle(almacenes, "almacenId");
      }
    },
    [
      fetchData,
      clearDependentSelections,
      clearDependentData,
      autoSelectIfSingle,
    ]
  );

  const handleAlmacenChange = useCallback((almacenId) => {
    setSelected((prev) => ({ ...prev, almacenId }));
  }, []);

  /**
   * Carga países iniciales al montar el componente
   */
  const loadInitialData = useCallback(async () => {
    await fetchData(API_URL_PAIS, "paises");
  }, [fetchData]);

  /**
   * Reinicia todos los estados a sus valores iniciales
   */
  const reset = useCallback(() => {
    setSelected({
      paisId: null,
      departamentoId: null,
      municipioId: null,
      sedeId: null,
      bloqueId: null,
      espacioId: null,
      almacenId: null,
    });
    setLocationData({
      paises: [],
      departamentos: [],
      municipios: [],
      sedes: [],
      bloques: [],
      espacios: [],
      almacenes: [],
    });
  }, []);

  return {
    selected,
    locationData,
    handlers: {
      handlePaisChange,
      handleDepartamentoChange,
      handleMunicipioChange,
      handleSedeChange,
      handleBloqueChange,
      handleEspacioChange,
      handleAlmacenChange,
    },
    loadInitialData,
    reset,
  };
};

export default useLocationFilters;
