import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

export default function SplashScreen({
  onFinish,
}) {
  const { typography, radii } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

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

      <Text style={[typography.t("display", "bold"), styles.title]}>
        Smart Delivery
      </Text>

      <Text style={[typography.t("bodyLg", "medium"), styles.subtitle]}>
        Fast • Secure • Reliable
      </Text>

      <Text style={[typography.t("footnote", "regular"), styles.loading]}>
        Loading...
      </Text>
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
    width: 132,
    height: 132,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 28,
  },

  logo: {
    width: 100,
    height: 100,
  },

  title: {
    color: "#ece3e3",
    letterSpacing: 0.3,
  },

  subtitle: {
    color: "rgba(255,255,255,0.88)",
    marginTop: 8,
  },

  loading: {
    color: "rgba(255,255,255,0.72)",
    marginTop: 48,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
