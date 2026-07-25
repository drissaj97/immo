import { useState } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { formatPrice, toggleFavorite, type ListingSummary } from "../api/client";

export function ListingDetailScreen({
  listing,
  onBack,
}: {
  listing: ListingSummary;
  onBack: () => void;
}) {
  const [favorite, setFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  async function handleFavorite() {
    setFavLoading(true);
    try {
      const active = await toggleFavorite(listing.id);
      setFavorite(active);
    } catch {
      // ignore
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>

      <Pressable style={styles.favButton} onPress={handleFavorite} disabled={favLoading}>
        <Text style={styles.favText}>{favorite ? "★ Favori" : "☆ Ajouter aux favoris"}</Text>
      </Pressable>

      <View style={styles.meta}>
        <Text style={styles.metaText}>📍 {listing.neighborhood}, {listing.city}</Text>
        <Text style={styles.metaText}>🏠 {listing.listingType}</Text>
        <Text style={styles.metaText}>📋 {listing.transactionType}</Text>
        {listing.livingArea && <Text style={styles.metaText}>📐 {listing.livingArea} m²</Text>}
        {listing.bedrooms && <Text style={styles.metaText}>🛏 {listing.bedrooms} ch.</Text>}
      </View>

      {listing.isVerified && (
        <View style={styles.verified}>
          <Text style={styles.verifiedText}>✓ Annonce vérifiée DarBladi</Text>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Données de démonstration — voir le détail complet sur darbladi.ma
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20 },
  back: { marginBottom: 16 },
  backText: { color: "#0f766e", fontSize: 16, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  price: { fontSize: 26, fontWeight: "700", color: "#0f766e", marginTop: 12 },
  meta: { marginTop: 20, gap: 8 },
  metaText: { fontSize: 15, color: "#475569" },
  verified: {
    marginTop: 20,
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 8,
  },
  verifiedText: { color: "#059669", fontWeight: "600" },
  disclaimer: { marginTop: 24, fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  favButton: {
    marginTop: 16,
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  favText: { color: "#92400e", fontWeight: "600" },
});
