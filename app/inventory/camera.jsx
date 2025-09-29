import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

const { API_CAMARA_URL, API_CODE_PATH } = Constants.expoConfig.extra;

/**
 * Pantalla de escáner de códigos QR y códigos de barras con detección en tiempo real
 *
 * Funcionalidades principales:
 * - Escaneo en tiempo real con detecciones visuales
 * - Captura de fotos para análisis detallado
 * - Manejo de permisos de cámara con UI informativa
 * - Conversión de coordenadas para overlay de detecciones
 * - Integración con API externa para procesamiento de imágenes
 */
export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [autoFocusPoint, setAutoFocusPoint] = useState({ x: 0.5, y: 0.5 });
  const [liveDetections, setLiveDetections] = useState([]);
  const [photoDetections, setPhotoDetections] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState({ width: 640, height: 480 });
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const cameraRef = useRef(null);
  const liveIntervalRef = useRef(null);

  const BBOX_SCALE_FACTOR = 1.4;
  const BBOX_PADDING = 10;
  const DEBUG_OFFSET = { x: 0, y: 0 };

  const flipCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
    setTorchEnabled(false);
    setAutoFocusPoint({ x: 0.5, y: 0.5 });
    setLiveDetections([]);
    setPhotoDetections([]);
  };

  const handleFocus = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    if (cameraLayout.width && cameraLayout.height) {
      setAutoFocusPoint({
        x: locationX / cameraLayout.width,
        y: locationY / cameraLayout.height,
      });
      setPhotoDetections([]);
    }
  };

  /**
   * Procesa frame de la cámara para detección en tiempo real
   * Toma una foto de baja calidad, la redimensiona y envía a la API
   * Se ejecuta cada segundo mientras la cámara está activa
   */
  const processLiveFrame = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    setPhotoDetections([]);
    try {
      const snap = await cameraRef.current.takePictureAsync({
        quality: 0,
        base64: false,
        skipProcessing: true,
        shutterSound: false,
      });
      const resized = await ImageManipulator.manipulateAsync(
        snap.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      setImageLayout({ width: resized.width, height: resized.height });
      if (resized.base64) {
        const res = await fetch(`${API_CAMARA_URL}${API_CODE_PATH}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: resized.base64 }),
        });
        if (res.ok) {
          const j = await res.json();
          setLiveDetections(j.result || []);
        } else {
          setLiveDetections([]);
        }
      }
    } catch (err) {
      console.log("Error live detect:", err);
      setLiveDetections([]);
    }
  };

  useEffect(() => {
    if (isCameraReady) {
      processLiveFrame();
      liveIntervalRef.current = setInterval(processLiveFrame, 1000);
    }
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isCameraReady]);

  const takePhotoAndScan = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto) return;
    setIsTakingPhoto(true);
    setPhotoDetections([]);
    try {
      const snap = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
        shutterSound: false,
      });
      const resized = await ImageManipulator.manipulateAsync(
        snap.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      setImageLayout({ width: resized.width, height: resized.height });
      if (resized.base64) {
        const res = await fetch(`${API_CAMARA_URL}${API_CODE_PATH}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: resized.base64 }),
        });
        if (res.ok) {
          const j = await res.json();
          setPhotoDetections(j.result || []);
        } else {
          setPhotoDetections([]);
        }
      }
    } catch (err) {
      console.log("Error take photo:", err);
      setPhotoDetections([]);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  /**
   * Convierte coordenadas de bounding box de la imagen a coordenadas de pantalla
   * Aplica escalado, padding y ajustes de aspect ratio
   *
   * @param {Object} bbox - Bounding box original de la API
   * @param {number} bbox.x1 - Coordenada X inicial
   * @param {number} bbox.y1 - Coordenada Y inicial
   * @param {number} bbox.x2 - Coordenada X final
   * @param {number} bbox.y2 - Coordenada Y final
   * @returns {Object} Coordenadas convertidas para overlay en pantalla
   */
  const convertBoundingBox = (bbox) => {
    const padded = {
      x1: bbox.x1 - BBOX_PADDING,
      y1: bbox.y1 - BBOX_PADDING,
      x2: bbox.x2 + BBOX_PADDING,
      y2: bbox.y2 + BBOX_PADDING,
    };
    const cx = (padded.x1 + padded.x2) / 2;
    const cy = (padded.y1 + padded.y2) / 2;
    const w = Math.abs(padded.x2 - padded.x1);
    const h = Math.abs(padded.y2 - padded.y1);
    const scale = BBOX_SCALE_FACTOR;
    const scaled = {
      x1: cx - (w * scale) / 2,
      y1: cy - (h * scale) / 2,
      x2: cx + (w * scale) / 2,
      y2: cy + (h * scale) / 2,
    };
    const camAR = cameraLayout.width / cameraLayout.height;
    const imgAR = imageLayout.width / imageLayout.height;
    let scaleX,
      scaleY,
      offX = 0,
      offY = 0;
    if (camAR > imgAR) {
      scaleY = cameraLayout.height / imageLayout.height;
      scaleX = scaleY;
      offX = (cameraLayout.width - imageLayout.width * scaleX) / 2;
    } else {
      scaleX = cameraLayout.width / imageLayout.width;
      scaleY = scaleX;
      offY = (cameraLayout.height - imageLayout.height * scaleY) / 2;
    }
    return {
      x1: scaled.x1 * scaleX + offX + DEBUG_OFFSET.x,
      y1: scaled.y1 * scaleY + offY + DEBUG_OFFSET.y,
      x2: scaled.x2 * scaleX + offX + DEBUG_OFFSET.x,
      y2: scaled.y2 * scaleY + offY + DEBUG_OFFSET.y,
    };
  };

  const renderBoundingBoxes = (detections) =>
    detections.map((det, i) => {
      const b = convertBoundingBox(det.bounding_box);
      return (
        <View
          key={i}
          style={[
            styles.boundingBox,
            {
              left: Math.min(b.x1, b.x2),
              top: Math.min(b.y1, b.y2),
              width: Math.abs(b.x2 - b.x1),
              height: Math.abs(b.y2 - b.y1),
            },
          ]}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>
              {det.type}: {det.data}
            </Text>
          </View>
        </View>
      );
    });

  const onCameraLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted)
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Header title="Escáner de Códigos" onBackPress={() => router.back()} />
        <View style={styles.permissionContent}>
          <View style={styles.cameraIconContainer}>
            <View style={styles.cameraIconCircle}>
              <Ionicons
                name="camera-outline"
                size={48}
                color={colors.secondary + "80"}
              />
            </View>
          </View>

          <Text style={styles.permissionTitle}>Acceso a la cámara</Text>
          <Text style={styles.message}>
            Para escanear códigos QR y códigos de barras, necesitamos acceso a
            tu cámara.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons
                name="qr-code-outline"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>Escaneo de códigos QR</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="barcode-outline"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>Códigos de barras</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="flash-outline"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>Flash automático</Text>
            </View>
          </View>

          <CustomButton
            text="Permitir acceso a cámara"
            onPress={requestPermission}
            variant="primary"
            icon="camera"
            iconPosition="left"
            style={styles.permissionButtonCustom}
          />

          <Text style={styles.privacyText}>
            Tu privacidad es importante. Solo usamos la cámara para escanear
            códigos.
          </Text>
        </View>
      </SafeAreaView>
    );

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleFocus}>
        <CameraView
          ref={cameraRef}
          facing={facing}
          enableTorch={torchEnabled}
          autoFocus={autoFocusPoint !== null}
          autoFocusPointOfInterest={autoFocusPoint}
          active
          style={styles.camera}
          animateShutter={false}
          onLayout={onCameraLayout}
          onCameraReady={() => setIsCameraReady(true)}
        >
          {/* Botón de regresar en la esquina superior izquierda */}
          <TouchableOpacity
            onPress={() => router.push("/")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Botón de flash en la esquina superior derecha */}
          <TouchableOpacity
            onPress={() => setTorchEnabled((t) => !t)}
            style={[
              styles.flashButton,
              torchEnabled && { backgroundColor: colors.warning || "#ffe500" },
            ]}
            disabled={!isCameraReady || facing === "front"}
          >
            <Ionicons
              name={torchEnabled ? "flashlight" : "flashlight-outline"}
              size={20}
              color={torchEnabled ? colors.text : colors.white}
            />
          </TouchableOpacity>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {!isCameraReady
                ? "Iniciando cámara..."
                : liveDetections.length > 0
                ? `Detectado en vivo: ${[
                    ...new Set(liveDetections.map((d) => d.type)),
                  ].join(", ")}`
                : "Apunta al código"}
            </Text>
          </View>

          <View style={styles.overlay}>
            {renderBoundingBoxes(liveDetections)}
          </View>
          <View style={styles.overlay}>
            {renderBoundingBoxes(photoDetections)}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={flipCamera}
              style={styles.iconButton}
              disabled={!isCameraReady}
            >
              <Ionicons name="camera-reverse-outline" size={30} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhotoAndScan}
              style={[
                styles.shutterButton,
                isTakingPhoto && styles.shutterDisabled,
              ]}
              disabled={!isCameraReady || isTakingPhoto}
            >
              {isTakingPhoto ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </CameraView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background || "#fff",
  },
  permissionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  cameraIconContainer: {
    marginBottom: 32,
  },
  cameraIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.secondary + "80",
    borderStyle: "dashed",
  },
  permissionTitle: {
    ...typography.bold.big,
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    ...typography.regular.large,
    textAlign: "center",
    color: colors.textSec,
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    marginBottom: 40,
    alignSelf: "stretch",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    ...typography.medium.medium,
    marginLeft: 12,
    color: colors.text,
  },
  permissionButtonCustom: {
    marginBottom: 24,
    width: "100%",
  },
  privacyText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flashButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: `${colors.success}20`,
    borderRadius: 4,
  },
  labelContainer: {
    position: "absolute",
    top: -24,
    left: 0,
    backgroundColor: `${colors.success}E6`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    ...typography.semibold.small,
    color: colors.white,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  iconButton: {
    width: 70,
    height: 70,
    backgroundColor: colors.white,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  statusContainer: {
    position: "absolute",
    top: 110,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 3,
  },
  statusText: {
    ...typography.semibold.regular,
    color: colors.white,
  },
  placeholder: {
    width: 70,
  },
});
