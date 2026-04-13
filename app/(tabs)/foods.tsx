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
import { listCustomFoods, deleteCustomFood, CustomFood, listRecipes, deleteRecipe, Recipe } from "../../services/nutrition";
import RecipeCreator from "../../components/RecipeCreator";
import FoodCreator from "../../components/FoodCreator";

export default function FoodsScreen() {
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"foods" | "recipes">("foods");
  const [isCreatorVisible, setIsCreatorVisible] = useState(false);
  const [isFoodCreatorVisible, setIsFoodCreatorVisible] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "foods") {
        const data = await listCustomFoods();
        setFoods(data);
      } else {
        const data = await listRecipes();
        setRecipes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDeleteFood = (id: string, name: string) => {
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
              loadData();
            } catch (err) {
              console.error(err);
            }
          }
        }
      ]
    );
  };

  const handleDeleteRecipe = (id: string, name: string) => {
    Alert.alert(
      "Supprimer la recette",
      `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipe(id);
              loadData();
            } catch (err) {
              console.error(err);
            }
          }
        }
      ]
    );
  };

  if (loading && !isCreatorVisible && !isFoodCreatorVisible) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fc4c02" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Cuisine</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => activeTab === "recipes" ? setIsCreatorVisible(true) : setIsFoodCreatorVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Créer</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "foods" && styles.tabActive]} 
          onPress={() => setActiveTab("foods")}
        >
          <Text style={[styles.tabText, activeTab === "foods" && styles.tabTextActive]}>Aliments</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "recipes" && styles.tabActive]} 
          onPress={() => setActiveTab("recipes")}
        >
          <Text style={[styles.tabText, activeTab === "recipes" && styles.tabTextActive]}>Recettes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "foods" ? (
        <View style={{ flex: 1 }}>
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
                  onPress={() => handleDeleteFood(item.id, item.name)}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Vous n'avez pas encore d'aliments personnalisés.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setIsFoodCreatorVisible(true)}>
                  <Text style={styles.emptyAddBtnText}>Créer mon premier aliment</Text>
                </TouchableOpacity>
              </View>
            }
            refreshing={loading}
            onRefresh={loadData}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.foodCard}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodKcal}>{Math.round(item.kcalPer100g)} kcal / 100g (moyenne)</Text>
                  <Text style={styles.ingredientsCount}>{item.ingredients.length} ingrédients</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteRecipe(item.id, item.name)}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Vous n'avez pas encore de recettes.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setIsCreatorVisible(true)}>
                  <Text style={styles.emptyAddBtnText}>Créer ma première recette</Text>
                </TouchableOpacity>
              </View>
            }
            refreshing={loading}
            onRefresh={loadData}
          />
        </View>
      )}

      <RecipeCreator 
        visible={isCreatorVisible} 
        onClose={() => setIsCreatorVisible(false)} 
        onSuccess={() => {
          setIsCreatorVisible(false);
          loadData();
        }}
      />

      <FoodCreator
        visible={isFoodCreatorVisible}
        onClose={() => setIsFoodCreatorVisible(false)}
        onSuccess={() => {
          setIsFoodCreatorVisible(false);
          loadData();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "900", color: "#111827" },
  addBtn: { backgroundColor: "#fc4c02", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
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
  emptyAddBtn: { backgroundColor: "#fc4c02", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 15 },
  emptyAddBtnText: { color: "#fff", fontWeight: "700" },
  tabRow: { flexDirection: "row", backgroundColor: "#e5e7eb", borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fc4c02" },
  ingredientsCount: { fontSize: 12, color: "#fc4c02", fontWeight: "700", marginTop: 4 },
});
