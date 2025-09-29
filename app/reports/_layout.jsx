// app/reportes/_layout.jsx
import { Stack } from "expo-router";

export default function ReportesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Reportes",
        }}
      />
      <Stack.Screen
        name="reporteFactura"
        options={{
          title: "Reporte de Factura",
        }}
      />
      <Stack.Screen
        name="reporteKardex"
        options={{
          title: "Reporte de Kardex",
        }}
      />
      <Stack.Screen
        name="reporteOrdencompra"
        options={{
          title: "Reporte de Orden de Compra",
        }}
      />
      <Stack.Screen
        name="reportePedido"
        options={{
          title: "Reporte de Pedido",
        }}
      />
      <Stack.Screen
        name="reporteProductosVencidos"
        options={{
          title: "Reporte de Productos Vencidos",
        }}
      />
    </Stack>
  );
}
