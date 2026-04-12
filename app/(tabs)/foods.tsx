import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { listCustomFoods, deleteCustomFood, CustomFood } from "../../services/nutrition";

export default function FoodsScreen() {
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFoods = async () => {
    setLoading(true);
    try {
      const data = await listCustomFoods();
      setFoods(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Supprimer l'aliment",
      `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomFood(id);
              loadFoods();
            } catch (err) {
              console.error(err);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fc4c02" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Aliments</Text>
      <Text style={styles.subtitle}>Retrouvez ici les aliments que vous avez créés manuellement.</Text>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.foodCard}>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodKcal}>{Math.round(item.kcalPer100g)} kcal / 100g</Text>
              {(item.proteins || item.carbs || item.fats) ? (
                <View style={styles.macroRow}>
                  <Text style={styles.macroText}>P: {item.proteins || 0}g</Text>
                  <Text style={styles.macroText}>G: {item.carbs || 0}g</Text>
                  <Text style={styles.macroText}>L: {item.fats || 0}g</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Vous n'avez pas encore d'aliments personnalisés.</Text>
            <Text style={styles.emptySubtext}>Ajoutez-en un via le bouton "+" dans le journal des repas.</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadFoods}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "900", color: "#111827", marginBottom: 8, marginTop: 40 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  foodKcal: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  macroRow: { flexDirection: "row", gap: 12 },
  macroText: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: { fontSize: 18 },
  emptyContainer: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: "center", fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 8 },
  emptySubtext: { textAlign: "center", fontSize: 14, color: "#9ca3af" },
});
