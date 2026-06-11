import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeScreen({ children, style, edges = ["top", "left", "right"] }) {
  return (
    <SafeAreaView style={[{ flex: 1 }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
