import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { searchFood, fetchOFFProduct, logMeal, createCustomFood } from "../services/nutrition";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogSuccess: () => void;
  mealType: string;
  date: Date;
}

export default function MealLogger({ visible, onClose, onLogSuccess, mealType, date }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState("100");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [customProteins, setCustomProteins] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      if (/^\d{8,13}$/.test(text)) {
        const product = await fetchOFFProduct(text);
        setResults(product ? [{ ...product, source: "OPEN_FOOD_FACTS", externalId: text }] : []);
      } else {
        const items = await searchFood(text);
        setResults(items.map(i => ({ ...i, externalId: i.id })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onBarcodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    setQuery(data);
    setLoading(true);
    try {
      const product = await fetchOFFProduct(data);
      if (product) {
        const item = { ...product, source: "OPEN_FOOD_FACTS", externalId: data };
        setResults([item]);
        setSelectedItem(item);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setScanning(true);
  };

  const handleLog = async () => {
    try {
      if (isCustomMode) {
        let source = "CUSTOM";
        let externalId = undefined;

        if (saveForFuture) {
          const newFood = await createCustomFood({
            name: customName,
            kcalPer100g: parseFloat(customKcal) || 0,
            proteins: parseFloat(customProteins) || 0,
            carbs: parseFloat(customCarbs) || 0,
            fats: parseFloat(customFats) || 0,
          });
          source = "USER_FOOD";
          externalId = newFood.id;
        }

        await logMeal({
          name: customName,
          kcalPer100g: parseFloat(customKcal) || 0,
          quantityGrams: parseFloat(quantity) || 0,
          source,
          externalId,
          mealType,
          consumedAt: date,
        });
      } else {
        if (!selectedItem) return;
        await logMeal({
          name: selectedItem.name,
          kcalPer100g: selectedItem.kcalPer100g,
          quantityGrams: parseFloat(quantity) || 0,
          source: selectedItem.source,
          externalId: selectedItem.externalId,
          mealType,
          consumedAt: date,
        });
      }
      resetForm();
      onLogSuccess();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du repas:", err);
    }
  };

  const resetForm = () => {
    setQuery("");
    setResults([]);
    setSelectedItem(null);
    setQuantity("100");
    setIsCustomMode(false);
    setCustomName("");
    setCustomKcal("");
    setCustomProteins("");
    setCustomCarbs("");
    setCustomFats("");
    setSaveForFuture(true);
    setScanning(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter un aliment</Text>
            <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {!selectedItem && !isCustomMode ? (
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher (ex: Pomme, Riz...)"
                  value={query}
                  onChangeText={handleSearch}
                  autoFocus={!scanning}
                />
                <TouchableOpacity style={styles.scanBtn} onPress={startScanning}>
                  <Text style={styles.scanBtnIcon}>📷</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.customToggleBtn}
                onPress={() => setIsCustomMode(true)}
              >
                <Text style={styles.customToggleText}>+ Ajouter un aliment personnalisé</Text>
              </TouchableOpacity>

              {scanning && (
                <View style={styles.cameraWrapper}>
                  <CameraView
                    style={styles.camera}
                    onBarcodeScanned={onBarcodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.cancelScanBtn} 
                    onPress={() => setScanning(false)}
                  >
                    <Text style={styles.cancelScanText}>ANNULER</Text>
                  </TouchableOpacity>
                </View>
              )}

              {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#fc4c02" />
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.resultItem}
                      onPress={() => setSelectedItem(item)}
                    >
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
                      <Text style={styles.resultKcal}>{Math.round(item.kcalPer100g)} kcal / 100g</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    query.length >= 3 && !scanning ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucun résultat pour "{query}"</Text>
                        <TouchableOpacity 
                          style={styles.emptyCustomBtn}
                          onPress={() => {
                            setCustomName(query);
                            setIsCustomMode(true);
                          }}
                        >
                          <Text style={styles.emptyCustomBtnText}>Créer l'aliment "{query}"</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null
                  }
                />
              )}
            </>
          ) : (
            <View style={styles.logForm}>
              {isCustomMode ? (
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom de l'aliment</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="ex: Mon Gâteau Maison"
                      value={customName}
                      onChangeText={setCustomName}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Calories pour 100g</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="ex: 250"
                      value={customKcal}
                      onChangeText={setCustomKcal}
                    />
                  </View>
                  
                  <View style={styles.macroGrid}>
                    <View style={styles.macroInputGroup}>
                      <Text style={styles.macroLabel}>Prot. (g)</Text>
                      <TextInput
                        style={styles.macroInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={customProteins}
                        onChangeText={setCustomProteins}
                      />
                    </View>
                    <View style={styles.macroInputGroup}>
                      <Text style={styles.macroLabel}>Gluc. (g)</Text>
                      <TextInput
                        style={styles.macroInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={customCarbs}
                        onChangeText={setCustomCarbs}
                      />
                    </View>
                    <View style={styles.macroInputGroup}>
                      <Text style={styles.macroLabel}>Lip. (g)</Text>
                      <TextInput
                        style={styles.macroInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={customFats}
                        onChangeText={setCustomFats}
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => setSaveForFuture(!saveForFuture)}
                  >
                    <View style={[styles.checkbox, saveForFuture && styles.checkboxSelected]}>
                      {saveForFuture && <Text style={styles.checkboxIcon}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Enregistrer dans "Mes Aliments"</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <>
                  <Text style={styles.selectedName}>{selectedItem.name}</Text>
                  <Text style={styles.selectedKcal}>{Math.round(selectedItem.kcalPer100g)} kcal pour 100g</Text>
                </>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantité (en grammes)</Text>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              <Text style={styles.totalKcal}>
                Total: {Math.round(((isCustomMode ? parseFloat(customKcal) : selectedItem.kcalPer100g) * (parseFloat(quantity) || 0)) / 100)} kcal
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.backBtn}
                  onPress={() => {
                    if (isCustomMode) setIsCustomMode(false);
                    else setSelectedItem(null);
                  }}
                >
                  <Text style={styles.backBtnText}>RETOUR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmBtn}
                  onPress={handleLog}
                  disabled={isCustomMode && (!customName || !customKcal)}
                >
                  <Text style={styles.confirmBtnText}>VALIDER</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  content: { 
    backgroundColor: "#fff", 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    height: "80%",
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  closeBtn: { fontSize: 24, color: "#9ca3af" },
  searchContainer: { flexDirection: "row", gap: 10, marginBottom: 8 },
  searchInput: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    flex: 1,
  },
  scanBtn: {
    backgroundColor: "#fc4c02",
    width: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanBtnIcon: { fontSize: 24 },
  customToggleBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  customToggleText: {
    color: "#fc4c02",
    fontWeight: "700",
    fontSize: 14,
  },
  cameraWrapper: {
    height: 250,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  cancelScanBtn: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelScanText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  resultName: { fontSize: 16, fontWeight: "500", color: "#374151", flex: 1 },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sourceBadgeText: { fontSize: 10, fontWeight: "800" },
  resultKcal: { fontSize: 14, color: "#9ca3af" },
  emptyContainer: { alignItems: "center", marginTop: 24 },
  emptyText: { textAlign: "center", color: "#9ca3af", fontStyle: "italic", marginBottom: 16 },
  emptyCustomBtn: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyCustomBtnText: {
    color: "#4b5563",
    fontWeight: "700",
  },
  
  logForm: { paddingVertical: 10 },
  selectedName: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 8 },
  selectedKcal: { fontSize: 16, color: "#6b7280", marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#4b5563", marginBottom: 8 },
  textInput: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  macroGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  macroInputGroup: { flex: 1 },
  macroLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 4 },
  macroInput: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    textAlign: "center",
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#fc4c02", alignItems: "center", justifyContent: "center" },
  checkboxSelected: { backgroundColor: "#fc4c02" },
  checkboxIcon: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  checkboxLabel: { fontSize: 14, color: "#374151", fontWeight: "600" },

  quantityInput: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  totalKcal: { fontSize: 20, fontWeight: "800", color: "#fc4c02", textAlign: "center", marginBottom: 20, marginTop: 10 },
  actions: { flexDirection: "row", gap: 12, marginTop: 10 },
  backBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#d1d5db", alignItems: "center" },
  backBtnText: { fontWeight: "700", color: "#4b5563" },
  confirmBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: "#fc4c02", alignItems: "center" },
  confirmBtnText: { fontWeight: "700", color: "#fff" },
});