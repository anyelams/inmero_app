import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import UnderConstruction from "../../components/UnderConstruction";

export default function SecurityScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Módulo Seguridad" />
      <UnderConstruction />
    </SafeAreaView>
  );
}
