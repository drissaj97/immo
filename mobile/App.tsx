import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import type { ListingSummary } from "./src/api/client";
import { ListingDetailScreen } from "./src/screens/ListingDetailScreen";
import { ListingsScreen } from "./src/screens/ListingsScreen";

export default function App() {
  const [selected, setSelected] = useState<ListingSummary | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {selected ? (
        <ListingDetailScreen listing={selected} onBack={() => setSelected(null)} />
      ) : (
        <ListingsScreen onSelect={setSelected} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
});
