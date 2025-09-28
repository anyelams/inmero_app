// components/LogoInmero.jsx
import React from "react";
import { Image, StyleSheet, View } from "react-native";

/**
 * Logo de la empresa Inmero con dimensiones configurables
 * @param {number} [width=150] - Ancho del logo en pixels
 * @param {number} [height=140] - Alto del logo en pixels
 */
export default function LogoInmero({ width = 150, height = 140 }) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={[styles.image, { width, height }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 4,
  },
  image: {
    // El tamaño se recibe por props
  },
});
