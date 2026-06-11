import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

export default function LoadingScreen({
  onFinish,
}) {
  const { typography, radii } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={["#10B981", "#0E9F6E", "#0C7A55"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.logoWrap, { borderRadius: radii.xl }]}>
        <Image
          source={require("../../assets/icon.png")}
          style={[styles.logo, { borderRadius: radii.lg }]}
        />
      </View>

      <Text style={[typography.t("title", "bold"), styles.title]}>
        Smart Delivery
      </Text>

      <Text style={[typography.t("body", "regular"), styles.subtitle]}>
        Signing you in...
      </Text>

      <ActivityIndicator
        size="large"
        color="#FFFFFF"
        style={{ marginTop: 30 }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logoWrap: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 18,
  },

  logo: {
    width: 84,
    height: 84,
  },

  title: {
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  subtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
  },
});
