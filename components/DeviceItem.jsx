import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

const DeviceItem = ({ device, isOn, onToggle, connected }) => {
  const getDeviceIcon = (type, isOn) => {
    if (type === "bombillo") {
      return isOn ? "lightbulb-on" : "lightbulb-outline";
    } else if (type === "ventilador") {
      return isOn ? "fan" : "fan-off";
    }
    return "help-circle-outline"; // fallback
  };

  const getDeviceColor = (isOn) => {
    return isOn ? colors.secondary : colors.textSec + "95";
  };

  const getIconBackgroundColor = (isOn) => {
    return isOn ? `${colors.secondary}20` : colors.lightGray;
  };

  return (
    <View style={styles.deviceItem}>
      <View style={styles.deviceHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getIconBackgroundColor(isOn) },
          ]}
        >
          <MaterialCommunityIcons
            name={getDeviceIcon(device.type, isOn)}
            size={26}
            color={getDeviceColor(isOn)}
          />
        </View>
        <Switch
          value={isOn}
          onValueChange={() => onToggle(device.type)}
          disabled={!connected}
          trackColor={{
            false: colors.border,
            true: colors.secondary,
          }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceStatus}>1 Dispositivo</Text>
        <Text
          style={[
            styles.deviceState,
            { color: isOn ? colors.success : colors.textSec },
          ]}
        >
          {isOn ? "On" : "Off"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  deviceItem: {
    flex: 1,
    backgroundColor: colors.border + "20",
    borderRadius: 12,
    padding: 16,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceInfo: {
    alignItems: "flex-start",
  },
  deviceName: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 4,
  },
  deviceStatus: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginBottom: 16,
  },
  deviceState: {
    ...typography.semibold.regular,
  },
});

export default DeviceItem;
