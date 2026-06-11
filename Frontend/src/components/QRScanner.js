import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

/*
QR delivery confirmation — the rider scans the QR shown on the customer's
tracking screen (which encodes the order's OTP) to confirm handover.
Manual OTP entry remains available as a fallback.
*/
export default function QRScanner({ visible, onScanned, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedOnce, setScannedOnce] = useState(false);

  const handleBarcode = ({ data }) => {
    if (scannedOnce) return;
    setScannedOnce(true);
    onScanned?.(String(data || "").trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setScannedOnce(false)}
    >
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.center}>
            <Text style={styles.msg}>Preparing camera…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={56} color="#FFF" />
            <Text style={styles.msg}>Camera access is needed to scan the delivery QR code.</Text>
            <TouchableOpacity style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scannedOnce ? undefined : handleBarcode}
          />
        )}

        {permission?.granted ? (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>Point at the customer's delivery QR</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  msg: { color: "#FFF", fontSize: 16, textAlign: "center", marginTop: 14, marginBottom: 20 },
  btn: { backgroundColor: "#FF6B00", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: "#FF6B00",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  hint: {
    color: "#FFF",
    marginTop: 18,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
