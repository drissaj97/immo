import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { login, type AuthUser } from "../api/auth";

export function LoginScreen({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("acheteur@darbladi.demo");
  const [password, setPassword] = useState("Acheteur123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const { user } = await login(email, password);
      onSuccess(user);
    } catch {
      setError("Connexion impossible — vérifiez email/mot de passe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DarBladi</Text>
      <Text style={styles.subtitle}>Connexion mobile</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>Compte démo : acheteur@darbladi.demo / Acheteur123!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" },
  title: { fontSize: 32, fontWeight: "700", color: "#0f766e", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#64748b", textAlign: "center", marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 8, textAlign: "center" },
  hint: { marginTop: 24, fontSize: 12, color: "#94a3b8", textAlign: "center" },
});
