import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { searchFood, fetchOFFProduct, logMeal, createCustomFood } from "../services/nutrition";
import RecipeCreator from "./RecipeCreator";

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
  const [isRecipeSearch, setIsRecipeSearch] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [customProteins, setCustomProteins] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [isRecipeCreatorVisible, setIsRecipeCreatorVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const scanAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const handleEmptyStatePress = () => {
    if (isRecipeSearch) {
      setIsRecipeCreatorVisible(true);
    } else {
      setCustomName(query);
      setIsCustomMode(true);
    }
  };

  useEffect(() => {
    if (scanning) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      if (loopRef.current) loopRef.current.stop();
      scanAnim.setValue(0);
    }
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, [scanning]);

  const performSearch = async () => {
    if (query.trim().length < 3) return;
    setLoading(true);
    try {
      if (!isRecipeSearch && /^\d{8,13}$/.test(query)) {
        const product = await fetchOFFProduct(query);
        setResults(product ? [{ ...product, source: "USER_FOOD", externalId: query }] : []);
      } else {
        const items = await searchFood(query, isRecipeSearch);
        setResults(items.map(i => ({ ...i, externalId: (i as any).id || (i as any).externalId })));
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
        const item = { ...product, source: "USER_FOOD", externalId: data }; // Saved in shadow db now
        setResults([item]);
        setSelectedItem(item);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          name: customName, kcalPer100g: parseFloat(customKcal) || 0,
          quantityGrams: parseFloat(quantity) || 0, source, externalId, mealType, consumedAt: date,
        });
      } else {
        if (!selectedItem) return;
        await logMeal({
          name: selectedItem.name, kcalPer100g: selectedItem.kcalPer100g,
          quantityGrams: parseFloat(quantity) || 0, source: selectedItem.source,
          externalId: String(selectedItem.externalId || ""), mealType, consumedAt: date,
        });
      }
      resetForm();
      onLogSuccess();
    } catch (err) {
      console.error("Erreur log meal:", err);
    }
  };

  const resetForm = () => {
    setQuery(""); setResults([]); setSelectedItem(null); setQuantity("100");
    setIsRecipeSearch(false);
    setIsCustomMode(false); setCustomName(""); setCustomKcal("");
    setCustomProteins(""); setCustomCarbs(""); setCustomFats("");
    setSaveForFuture(true); setScanning(false);
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.fullContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter un aliment</Text>
          <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.mainScroll} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!selectedItem && !isCustomMode ? (
            <>
              <View style={styles.tabRow}>
                <TouchableOpacity 
                  style={[styles.tab, !isRecipeSearch && styles.tabActive]} 
                  onPress={() => { setIsRecipeSearch(false); setResults([]); setQuery(""); }}
                >
                  <Text style={[styles.tabText, !isRecipeSearch && styles.tabTextActive]}>Aliments</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, isRecipeSearch && styles.tabActive]} 
                  onPress={() => { setIsRecipeSearch(true); setResults([]); setQuery(""); }}
                >
                  <Text style={[styles.tabText, isRecipeSearch && styles.tabTextActive]}>Recettes</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={isRecipeSearch ? "Rechercher une recette..." : "Rechercher (ex: Pomme, Riz...)"}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={performSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={performSearch}>
                  <Text style={styles.searchBtnIcon}>🔍</Text>
                </TouchableOpacity>
                {!isRecipeSearch && (
                  <TouchableOpacity style={styles.scanBtn} onPress={async () => {
                    if (!permission?.granted) await requestPermission();
                    setScanning(true);
                  }}>
                    <Text style={styles.scanBtnIcon}>📷</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!scanning && !isRecipeSearch && (
                <TouchableOpacity style={styles.customToggleBtn} onPress={() => setIsCustomMode(true)}>
                  <Text style={styles.customToggleText}>+ Ajouter un aliment personnalisé</Text>
                </TouchableOpacity>
              )}

              {scanning && (
                <View style={styles.cameraWrapper}>
                  <CameraView
                    style={styles.camera}
                    onBarcodeScanned={onBarcodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
                  >
                    <View style={styles.finderContainer}>
                      <View style={styles.finder}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        <Animated.View style={[styles.laser, { transform: [{ translateY }] }]} />
                      </View>
                    </View>
                  </CameraView>
                  <TouchableOpacity style={styles.cancelScanBtn} onPress={() => setScanning(false)}>
                    <Text style={styles.cancelScanText}>ANNULER</Text>
                  </TouchableOpacity>
                </View>
              )}

              {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#fc4c02" />
              ) : !scanning && (
                results.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.resultItem} onPress={() => setSelectedItem(item)}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      {item.source && (
                        <View style={[
                          styles.sourceBadge, 
                          { backgroundColor: item.source === 'USER_FOOD' ? '#dcfce7' : item.source === 'RECIPE' ? '#e0f2fe' : '#f3f4f6' }
                        ]}>
                          <Text style={[
                            styles.sourceBadgeText, 
                            { color: item.source === 'USER_FOOD' ? '#166534' : item.source === 'RECIPE' ? '#0369a1' : '#6b7280' }
                          ]}>
                            {item.source === 'USER_FOOD' ? 'MES ALIMENTS' : item.source === 'RECIPE' ? 'RECETTE' : item.source === 'CIQUAL' ? 'CIQUAL' : 'OFF'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.resultKcal}>{Math.round(item.kcalPer100g)} kcal / 100g</Text>
                  </TouchableOpacity>
                ))
              )}
              
              {query.length >= 3 && results.length === 0 && !loading && !scanning && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucun résultat pour "{query}"</Text>
                  <TouchableOpacity style={styles.emptyCustomBtn} onPress={handleEmptyStatePress}>
                    <Text style={styles.emptyCustomBtnText}>
                      {isRecipeSearch ? `Créer la recette "${query}"` : `Ajouter "${query}" manuellement`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.formContainer}>
              {isCustomMode ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom de l'aliment</Text>
                    <TextInput style={styles.textInput} value={customName} onChangeText={setCustomName} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Calories pour 100g</Text>
                    <TextInput style={styles.textInput} keyboardType="numeric" value={customKcal} onChangeText={setCustomKcal} />
                  </View>
                  <View style={styles.macroGrid}>
                    <View style={styles.macroBox}><Text style={styles.macroLabel}>Prot. (g)</Text><TextInput style={styles.macroInput} keyboardType="numeric" value={customProteins} onChangeText={setCustomProteins} /></View>
                    <View style={styles.macroBox}><Text style={styles.macroLabel}>Gluc. (g)</Text><TextInput style={styles.macroInput} keyboardType="numeric" value={customCarbs} onChangeText={setCustomCarbs} /></View>
                    <View style={styles.macroBox}><Text style={styles.macroLabel}>Lip. (g)</Text><TextInput style={styles.macroInput} keyboardType="numeric" value={customFats} onChangeText={setCustomFats} /></View>
                  </View>
                  <TouchableOpacity style={styles.checkboxRow} onPress={() => setSaveForFuture(!saveForFuture)}>
                    <View style={[styles.checkbox, saveForFuture && styles.checkboxActive]}>{saveForFuture && <Text style={styles.checkIcon}>✓</Text>}</View>
                    <Text style={styles.checkboxLabel}>Enregistrer dans "Mes Aliments"</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.selectedHeader}>
                  <Text style={styles.selectedName}>{selectedItem.name}</Text>
                  <Text style={styles.selectedKcal}>{Math.round(selectedItem.kcalPer100g)} kcal / 100g</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantité (en grammes)</Text>
                <TextInput style={styles.qtyInput} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              </View>

              <Text style={styles.totalKcal}>
                Total: {Math.round(((isCustomMode ? parseFloat(customKcal) : selectedItem.kcalPer100g) * (parseFloat(quantity) || 0)) / 100)} kcal
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => isCustomMode ? setIsCustomMode(false) : setSelectedItem(null)}>
                  <Text style={styles.backBtnText}>RETOUR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.validBtn} onPress={handleLog} disabled={isCustomMode && (!customName || !customKcal)}>
                  <Text style={styles.validBtnText}>VALIDER</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <RecipeCreator 
          visible={isRecipeCreatorVisible}
          onClose={() => setIsRecipeCreatorVisible(false)}
          onSuccess={() => {
            setIsRecipeCreatorVisible(false);
            performSearch(); // Refresh results to find the new recipe
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  closeBtn: { fontSize: 24, color: "#9ca3af", padding: 5 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 20 },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: "#f3f4f6", padding: 16, borderRadius: 12, fontSize: 16 },
  scanBtn: { backgroundColor: "#fc4c02", width: 56, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  scanBtnIcon: { fontSize: 24 },
  searchBtn: { backgroundColor: "#111827", width: 56, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  searchBtnIcon: { fontSize: 20 },
  customToggleBtn: { paddingVertical: 15, alignItems: "center" },
  customToggleText: { color: "#fc4c02", fontWeight: "700", fontSize: 14 },
  cameraWrapper: { height: 350, borderRadius: 24, overflow: "hidden", backgroundColor: "#000", marginBottom: 20 },
  camera: { flex: 1 },
  finderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  finder: { width: 260, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 25, height: 25, borderColor: '#fc4c02', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  laser: { position: 'absolute', top: 0, left: 10, right: 10, height: 2, backgroundColor: '#fc4c02' },
  cancelScanBtn: { position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.8)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  cancelScanText: { color: "#fff", fontWeight: "800" },
  resultItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultName: { fontSize: 16, fontWeight: "600", color: "#374151", flex: 1 },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sourceBadgeText: { fontSize: 10, fontWeight: "800" },
  resultKcal: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  emptyContainer: { alignItems: "center", marginTop: 30 },
  emptyText: { color: "#9ca3af", marginBottom: 15 },
  emptyCustomBtn: { backgroundColor: "#f3f4f6", padding: 12, borderRadius: 10 },
  emptyCustomBtnText: { color: "#4b5563", fontWeight: "700" },
  formContainer: { paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", color: "#4b5563", marginBottom: 8 },
  textInput: { backgroundColor: "#f3f4f6", padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15 },
  macroGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  macroBox: { flex: 1 },
  macroLabel: { fontSize: 12, color: "#6b7280", marginBottom: 5, textAlign: 'center' },
  macroInput: { backgroundColor: "#f3f4f6", padding: 12, borderRadius: 10, textAlign: 'center' },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 25 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#fc4c02", justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: "#fc4c02" },
  checkIcon: { color: "#fff", fontWeight: "bold" },
  checkboxLabel: { fontWeight: "600", color: "#374151" },
  selectedHeader: { marginBottom: 20 },
  selectedName: { fontSize: 22, fontWeight: "800", color: "#111827" },
  selectedKcal: { color: "#6b7280", marginTop: 5 },
  qtyInput: { backgroundColor: "#f3f4f6", padding: 20, borderRadius: 15, fontSize: 28, fontWeight: "800", textAlign: "center" },
  totalKcal: { fontSize: 24, fontWeight: "900", color: "#fc4c02", textAlign: "center", marginVertical: 25 },
  btnRow: { flexDirection: "row", gap: 12 },
  backBtn: { flex: 1, padding: 18, borderRadius: 15, borderWidth: 1, borderColor: "#d1d5db", alignItems: "center" },
  backBtnText: { fontWeight: "700", color: "#4b5563" },
  validBtn: { flex: 2, padding: 18, borderRadius: 15, backgroundColor: "#fc4c02", alignItems: "center" },
  validBtnText: { color: "#fff", fontWeight: "700" },
  inputGroup: { marginBottom: 20 },
  tabRow: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fc4c02" },
});
