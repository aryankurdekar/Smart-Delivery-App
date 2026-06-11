import React, { useCallback } from "react";
import { registerRootComponent } from "expo";
import { View, Text as RNText, TextInput as RNTextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

import App from "./App";
import { ThemeProvider } from "./src/context/ThemeContext";

// --- Global default font (Poppins) applied to all <Text>/<TextInput> ---
// Injects fontFamily as the FIRST style so any per-call style still wins.
const DEFAULT_FONT = "Poppins_400Regular";
function patchDefaultFont(Component) {
  if (!Component || Component.__fontPatched) return;
  const original = Component.render;
  if (typeof original !== "function") return;
  Component.render = function patchedRender(...args) {
    const element = original.apply(this, args);
    if (!element) return element;
    return React.cloneElement(element, {
      style: [{ fontFamily: DEFAULT_FONT }, element.props.style],
    });
  };
  Component.__fontPatched = true;
}
patchDefaultFont(RNText);
patchDefaultFont(RNTextInput);

// Keep the native splash up until fonts are ready (no flash of system font).
SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}

registerRootComponent(Root);
