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
} from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { searchCiqual, fetchOFFProduct, logMeal } from "../services/nutrition";

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
        const items = await searchCiqual(text);
        setResults(items.map(i => ({ ...i, source: "CIQUAL", externalId: i.id })));
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
    if (!selectedItem) return;
    try {
      await logMeal({
        name: selectedItem.name,
        kcalPer100g: selectedItem.kcalPer100g,
        quantityGrams: parseFloat(quantity) || 0,
        source: selectedItem.source,
        externalId: selectedItem.externalId,
        mealType,
        consumedAt: date,
      });
      setQuery("");
      setResults([]);
      setSelectedItem(null);
      setQuantity("100");
      onLogSuccess();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du repas:", err);
    }
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
            <TouchableOpacity onPress={() => { setScanning(false); onClose(); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {!selectedItem ? (
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
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultKcal}>{Math.round(item.kcalPer100g)} kcal / 100g</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    query.length >= 3 && !scanning ? <Text style={styles.emptyText}>Aucun résultat</Text> : null
                  }
                />
              )}
            </>
          ) : (
            <View style={styles.logForm}>
              <Text style={styles.selectedName}>{selectedItem.name}</Text>
              <Text style={styles.selectedKcal}>{Math.round(selectedItem.kcalPer100g)} kcal pour 100g</Text>
              
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
                Total: {Math.round((selectedItem.kcalPer100g * (parseFloat(quantity) || 0)) / 100)} kcal
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.backBtn}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.backBtnText}>RETOUR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmBtn}
                  onPress={handleLog}
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
  searchContainer: { flexDirection: "row", gap: 10, marginBottom: 16 },
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
  resultName: { fontSize: 16, fontWeight: "500", color: "#374151" },
  resultKcal: { fontSize: 14, color: "#9ca3af" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#9ca3af", fontStyle: "italic" },
  
  logForm: { paddingVertical: 20 },
  selectedName: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 8 },
  selectedKcal: { fontSize: 16, color: "#6b7280", marginBottom: 24 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#4b5563", marginBottom: 8 },
  quantityInput: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  totalKcal: { fontSize: 20, fontWeight: "800", color: "#fc4c02", textAlign: "center", marginBottom: 32 },
  actions: { flexDirection: "row", gap: 12 },
  backBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#d1d5db", alignItems: "center" },
  backBtnText: { fontWeight: "700", color: "#4b5563" },
  confirmBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: "#fc4c02", alignItems: "center" },
  confirmBtnText: { fontWeight: "700", color: "#fff" },
});