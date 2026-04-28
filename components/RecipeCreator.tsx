import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { searchFood, createRecipe, RecipeIngredient } from "../services/nutrition";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecipeCreator({ visible, onClose, onSuccess }: Props) {
  const [recipeName, setRecipeName] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [ingredientQty, setIngredientQty] = useState("100");

  const performSearch = async () => {
    if (query.trim().length < 3 || loading) return;
    setLoading(true);
    try {
      const items = await searchFood(query, false);
      setSearchResults(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (!selectedIngredient) return;
    const newIng: RecipeIngredient = {
      name: selectedIngredient.name,
      kcalPer100g: selectedIngredient.kcalPer100g,
      proteins: selectedIngredient.proteins,
      carbs: selectedIngredient.carbs,
      fats: selectedIngredient.fats,
      quantityGrams: parseFloat(ingredientQty) || 0,
    };
    setIngredients([...ingredients, newIng]);
    setSelectedIngredient(null);
    setQuery("");
    setSearchResults([]);
    setIngredientQty("100");
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!recipeName || ingredients.length === 0) return;
    try {
      await createRecipe({ name: recipeName, ingredients });
      resetForm();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setRecipeName("");
    setIngredients([]);
    setQuery("");
    setSearchResults([]);
    setSelectedIngredient(null);
  };

  const totalKcal = ingredients.reduce((acc, ing) => acc + (ing.kcalPer100g * ing.quantityGrams) / 100, 0);
  const totalWeight = ingredients.reduce((acc, ing) => acc + ing.quantityGrams, 0);
  const avgKcal = totalWeight > 0 ? (totalKcal / totalWeight) * 100 : 0;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nouvelle Recette</Text>
          <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.main} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.label}>Nom de la recette</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Poulet Curry Courgette"
              value={recipeName}
              onChangeText={setRecipeName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Ingrédients ({ingredients.length})</Text>
            {ingredients.map((ing, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingDetails}>{ing.quantityGrams}g - {Math.round((ing.kcalPer100g * ing.quantityGrams) / 100)} kcal</Text>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <Text style={styles.deleteText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}

            {!selectedIngredient ? (
              <View style={styles.searchBox}>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Chercher un ingrédient..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={performSearch}
                    returnKeyType="search"
                  />
                  <TouchableOpacity style={styles.searchBtn} onPress={performSearch}>
                    <Text style={styles.searchBtnIcon}>🔍</Text>
                  </TouchableOpacity>
                </View>
                {loading && <ActivityIndicator color="#fc4c02" style={{ marginTop: 10 }} />}
                {searchResults.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.resultItem} onPress={() => setSelectedIngredient(item)}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      {item.source && (
                        <View style={[
                          styles.sourceBadge, 
                          { backgroundColor: item.source === 'USER_FOOD' ? '#dcfce7' : '#f3f4f6' }
                        ]}>
                          <Text style={[
                            styles.sourceBadgeText, 
                            { color: item.source === 'USER_FOOD' ? '#166534' : '#6b7280' }
                          ]}>
                            {item.source === 'USER_FOOD' ? 'MES ALIMENTS' : item.source === 'CIQUAL' ? 'CIQUAL' : 'OFF'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.resultKcal}>{Math.round(item.kcalPer100g)} kcal/100g</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.addBox}>
                <Text style={styles.selectedIngName}>{selectedIngredient.name}</Text>
                <View style={styles.qtyRow}>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    value={ingredientQty}
                    onChangeText={setIngredientQty}
                  />
                  <Text style={styles.unit}>grammes</Text>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedIngredient(null)}>
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
                    <Text style={styles.addBtnText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {ingredients.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Résumé de la recette</Text>
              <Text style={styles.summaryText}>Poids total : {Math.round(totalWeight)}g</Text>
              <Text style={styles.summaryText}>Calories totales : {Math.round(totalKcal)} kcal</Text>
              <Text style={styles.summaryAvg}>Moyenne : {Math.round(avgKcal)} kcal / 100g</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, (!recipeName || ingredients.length === 0) && styles.disabledBtn]} 
            onPress={handleSaveRecipe}
            disabled={!recipeName || ingredients.length === 0}
          >
            <Text style={styles.saveBtnText}>ENREGISTRER LA RECETTE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  closeBtn: { fontSize: 24, color: "#9ca3af" },
  main: { flex: 1, padding: 20 },
  section: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: "700", color: "#4b5563", marginBottom: 10, textTransform: 'uppercase' },
  input: { backgroundColor: "#f3f4f6", padding: 15, borderRadius: 12, fontSize: 16 },
  ingredientRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  ingName: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  ingDetails: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  deleteText: { color: "#ef4444", fontWeight: "600", fontSize: 13 },
  searchBox: { marginTop: 15 },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: "#f3f4f6", padding: 15, borderRadius: 12, fontSize: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' },
  searchBtn: { backgroundColor: "#111827", width: 56, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  searchBtnIcon: { fontSize: 20 },
  resultItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  resultName: { fontSize: 14, fontWeight: "500", flex: 1 },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sourceBadgeText: { fontSize: 10, fontWeight: "800" },
  resultKcal: { fontSize: 12, color: "#9ca3af" },
  addBox: { backgroundColor: "#f9fafb", padding: 15, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: "#e5e7eb" },
  selectedIngName: { fontSize: 15, fontWeight: "700", marginBottom: 15, color: "#fc4c02" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  qtyInput: { backgroundColor: "#fff", borderWeight: 1, borderColor: "#d1d5db", padding: 10, borderRadius: 8, width: 80, textAlign: "center", fontSize: 16, fontWeight: "700" },
  unit: { color: "#6b7280", fontWeight: "600" },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, padding: 12, alignItems: "center" },
  cancelBtnText: { color: "#6b7280", fontWeight: "600" },
  addBtn: { flex: 2, backgroundColor: "#111827", padding: 12, borderRadius: 8, alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "700" },
  summaryCard: { backgroundColor: "#fff7ed", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#ffedd5", marginBottom: 40 },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: "#9a3412", marginBottom: 10 },
  summaryText: { fontSize: 14, color: "#9a3412", marginBottom: 4 },
  summaryAvg: { fontSize: 18, fontWeight: "900", color: "#ea580c", marginTop: 8 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  saveBtn: { backgroundColor: "#fc4c02", padding: 18, borderRadius: 15, alignItems: "center" },
  disabledBtn: { backgroundColor: "#fdba74" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 }
});
