import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchListings, formatPrice, type ListingSummary } from "../api/client";

export function ListingsScreen({ onSelect }: { onSelect: (listing: ListingSummary) => void }) {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings({ limit: 20 })
      .then((res) => setListings(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Erreur : {error}</Text>
        <Text style={styles.hint}>Vérifiez que l'API DarBladi tourne sur localhost:3000</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>DarBladi</Text>
          <Text style={styles.subtitle}>{listings.length} biens disponibles</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => onSelect(item)}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
          <Text style={styles.location}>
            {item.neighborhood}, {item.city}
          </Text>
          {item.isVerified && <Text style={styles.badge}>Vérifié</Text>}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  list: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#0f766e" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  price: { fontSize: 18, fontWeight: "700", color: "#0f766e", marginTop: 8 },
  location: { fontSize: 14, color: "#64748b", marginTop: 4 },
  badge: { fontSize: 12, color: "#059669", marginTop: 8, fontWeight: "600" },
  error: { color: "#dc2626", fontSize: 16, textAlign: "center" },
  hint: { color: "#64748b", fontSize: 13, marginTop: 8, textAlign: "center" },
});
