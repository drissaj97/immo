import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text } from "react-native";
import type { AuthUser } from "./src/api/auth";
import { getMe, logout } from "./src/api/auth";
import type { ListingSummary } from "./src/api/client";
import { ListingDetailScreen } from "./src/screens/ListingDetailScreen";
import { ListingsScreen } from "./src/screens/ListingsScreen";
import { LoginScreen } from "./src/screens/LoginScreen";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<ListingSummary | null>(null);

  useEffect(() => {
    getMe().then(setUser).finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <LoginScreen onSuccess={setUser} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Pressable
        style={styles.userBar}
        onPress={async () => {
          await logout();
          setUser(null);
          setSelected(null);
        }}
      >
        <Text style={styles.userText}>{user.fullName} · Déconnexion</Text>
      </Pressable>
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
  userBar: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#ecfdf5" },
  userText: { fontSize: 13, color: "#0f766e", fontWeight: "600" },
});
