import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { createCustomFood, updateCustomFood, CustomFood } from "../services/nutrition";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFood?: CustomFood | null;
}

export default function FoodCreator({ visible, onClose, onSuccess, initialFood }: Props) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  useEffect(() => {
    if (initialFood) {
      setName(initialFood.name);
      setKcal(initialFood.kcalPer100g.toString());
      setProteins(initialFood.proteins?.toString() || "");
      setCarbs(initialFood.carbs?.toString() || "");
      setFats(initialFood.fats?.toString() || "");
    } else {
      resetForm();
    }
  }, [initialFood, visible]);

  const handleSave = async () => {
    if (!name || !kcal) return;
    try {
      const foodData = {
        name,
        kcalPer100g: parseFloat(kcal) || 0,
        proteins: parseFloat(proteins) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
      };

      if (initialFood) {
        await updateCustomFood(initialFood.id, foodData);
      } else {
        await createCustomFood(foodData);
      }
      
      resetForm();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setName("");
    setKcal("");
    setProteins("");
    setCarbs("");
    setFats("");
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{initialFood ? "Modifier l'Aliment" : "Nouvel Aliment"}</Text>
          <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.main} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de l'aliment</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Riz Basmati"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Calories pour 100g</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={kcal}
              onChangeText={setKcal}
            />
          </View>

          <Text style={styles.sectionTitle}>Macronutriments (Optionnel)</Text>
          <View style={styles.macroGrid}>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Protéines (g)</Text>
              <TextInput
                style={styles.macroInput}
                keyboardType="numeric"
                value={proteins}
                onChangeText={setProteins}
              />
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Glucides (g)</Text>
              <TextInput
                style={styles.macroInput}
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
              />
            </View>
            <View style={styles.macroBox}>
              <Text style={styles.macroLabel}>Lipides (g)</Text>
              <TextInput
                style={styles.macroInput}
                keyboardType="numeric"
                value={fats}
                onChangeText={setFats}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, (!name || !kcal) && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={!name || !kcal}
          >
            <Text style={styles.saveBtnText}>{initialFood ? "METTRE À JOUR" : "ENREGISTRER L'ALIMENT"}</Text>
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
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#4b5563", marginBottom: 8 },
  input: { backgroundColor: "#f3f4f6", padding: 15, borderRadius: 12, fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginTop: 10, marginBottom: 15 },
  macroGrid: { flexDirection: "row", gap: 10 },
  macroBox: { flex: 1 },
  macroLabel: { fontSize: 12, color: "#6b7280", marginBottom: 5, textAlign: 'center' },
  macroInput: { backgroundColor: "#f3f4f6", padding: 12, borderRadius: 10, textAlign: 'center', fontSize: 16 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  saveBtn: { backgroundColor: "#fc4c02", padding: 18, borderRadius: 15, alignItems: "center" },
  disabledBtn: { backgroundColor: "#fdba74" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 }
});
