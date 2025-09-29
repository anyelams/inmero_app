import { Buffer } from "buffer";
import EventEmitter from "events";
import Constants from "expo-constants";
import mqtt from "mqtt";
import process from "process";
import { useEffect, useRef, useState } from "react";

// Polyfills necesarios para React Native
global.Buffer = global.Buffer || Buffer;
global.process = global.process || process;
global.EventEmitter = global.EventEmitter || EventEmitter;

const {
  MQTT_BROKER_URL,
  MQTT_CLIENT_ID,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_RECONNECT_PERIOD,
  MQTT_CONNECT_TIMEOUT,
  MQTT_CLEAN,
  MQTT_TOPIC,
} = Constants.expoConfig.extra || {};

console.log("MQTT CONFIG", {
  MQTT_BROKER_URL,
  MQTT_CLIENT_ID,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_RECONNECT_PERIOD,
  MQTT_CONNECT_TIMEOUT,
  MQTT_CLEAN,
  MQTT_TOPIC,
});

/**
 * Hook personalizado para gestionar conexiones MQTT y comunicación IoT
 *
 * Funcionalidades:
 * - Conexión automática al broker MQTT al montar el componente
 * - Suscripción a múltiples topics (temperatura, humedad, dispositivos, sensores)
 * - Publicación de comandos a dispositivos IoT
 * - Manejo automático de reconexión
 * - Procesamiento de mensajes en tiempo real
 *
 * @returns {Object} Estado y funciones de MQTT
 * @returns {boolean} connected - Estado de conexión con el broker
 * @returns {boolean} isConnecting - Indica si está intentando conectar
 * @returns {number|null} temperature - Última temperatura recibida
 * @returns {number|null} humidity - Última humedad recibida
 * @returns {Object|null} lastMessage - Último mensaje recibido {topic, message}
 * @returns {Function} toggleDevice - Función para controlar dispositivos
 * @returns {Function} connect - Función para reconectar manualmente
 */
export const useMQTT = () => {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [lastMessage, setLastMessage] = useState(null);

  const clientRef = useRef(null);

  /**
   * Topics MQTT a los que se suscribe automáticamente
   * Incluye sensores de temperatura, humedad, nivel de agua y control de dispositivos
   */
  const topics = [
    MQTT_TOPIC, // Tópico principal (temperatura/humedad)
    "tanque/nivel",
    "sensor/agua/ultrasonico",
    "sensor/bombillo",
    "sensor/ventilador",
  ];

  /**
   * Inicializa y mantiene la conexión MQTT
   * Se ejecuta una sola vez al montar el componente
   */
  useEffect(() => {
    if (clientRef.current) return;

    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId:
        MQTT_CLIENT_ID || `client_${Math.random().toString(16).slice(2, 10)}`,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      reconnectPeriod: Number(MQTT_RECONNECT_PERIOD || 5000),
      connectTimeout: Number(MQTT_CONNECT_TIMEOUT || 4000),
      clean: MQTT_CLEAN === "true",
    });

    clientRef.current = client;

    client.removeAllListeners();

    // Handler: Conexión exitosa
    client.on("connect", () => {
      console.log("Conectado al broker MQTT");
      setConnected(true);
      setIsConnecting(false);

      // Suscribirse a todos los topics configurados
      topics.forEach((topic) => {
        if (topic) {
          // Verificar que el tópico no sea undefined
          client.subscribe(topic, { qos: 0 }, (err) => {
            if (err) {
              console.error(`Error al suscribirse a ${topic}:`, err);
            } else {
              console.log(`Suscrito a: ${topic}`);
            }
          });
        }
      });
    });

    // Handler: Intento de reconexión
    client.on("reconnect", () => {
      console.log("Reintentando conexión...");
      setIsConnecting(true);
    });

    // Handler: Desconexión
    client.on("close", () => {
      console.log("Desconectado");
      setConnected(false);
      setIsConnecting(false);
    });

    // Handler: Mensajes recibidos
    client.on("message", (topic, message) => {
      const payload = message.toString();
      console.log(`Mensaje recibido [${topic}]: ${payload}`);
      setLastMessage({ topic, message: payload });

      // Procesar mensajes del topic principal (temperatura/humedad)
      if (topic === MQTT_TOPIC) {
        try {
          const data = JSON.parse(payload);
          if (typeof data.temperatura === "number") {
            setTemperature(data.temperatura);
          }
          if (typeof data.humedad === "number") {
            setHumidity(data.humedad);
          }
        } catch (error) {
          console.error("Error al parsear JSON:", error);
        }
      }
      // Los demás topics se manejan en componentes usando lastMessage
    });

    // Handler: Errores
    client.on("error", (err) => {
      console.error("Error MQTT:", err);
    });

    // Cleanup al desmontar el componente
    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, []);

  /**
   * Intenta reconectar manualmente al broker MQTT
   * Solo funciona si el cliente existe pero no está conectado
   */
  const connect = () => {
    if (clientRef.current && !connected) {
      clientRef.current.reconnect();
    }
  };

  /**
   * Publica un comando para controlar un dispositivo IoT
   *
   * @param {string} topic - Topic MQTT del dispositivo (ej: "sensor/bombillo")
   * @param {string} estado - Estado deseado del dispositivo ("on" | "off")
   */
  const toggleDevice = (topic, estado) => {
    if (!clientRef.current || !connected) {
      console.warn("🔌 Cliente no conectado. No se puede publicar.");
      return;
    }

    const payload = JSON.stringify({ estado: estado.toUpperCase() });
    console.log(`Publicando a ${topic}: ${payload}`);

    clientRef.current.publish(topic, payload, { qos: 0 }, (err) => {
      if (err) {
        console.error("Error al publicar:", err);
      } else {
        console.log(`Mensaje publicado exitosamente a ${topic}`);
      }
    });
  };

  return {
    connected,
    isConnecting,
    temperature,
    humidity,
    lastMessage,
    toggleDevice,
    connect,
  };
};
