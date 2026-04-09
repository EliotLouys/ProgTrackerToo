import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { fetchMeals, MealLog, deleteMeal } from "../../services/nutrition";
import MealLogger from "../../components/MealLogger";

const MEAL_TYPES = [
  { label: "Petit-déjeuner", value: "BREAKFAST", icon: "☕" },
  { label: "Déjeuner", value: "LUNCH", icon: "🥗" },
  { label: "Dîner", value: "DINNER", icon: "🍛" },
  { label: "Encas", value: "SNACK", icon: "🍎" },
];

export default function MealsScreen() {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggerVisible, setIsLoggerVisible] = useState(false);
  const [activeType, setActiveType] = useState<string>("BREAKFAST");

  const loadMeals = async () => {
    setLoading(true);
    try {
      // On s'assure d'envoyer la date sans le décalage horaire parasite
      const data = await fetchMeals(selectedDate);
      setMeals(data);
    } catch (err) {
      console.error("Erreur chargement repas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, [selectedDate]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMeal(id);
      loadMeals();
    } catch (err) {
      console.error(err);
    }
  };

  const getMealsByType = (type: string) => meals.filter((m) => m.mealType === type);

  const changeDate = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        
        <View style={styles.dateBar}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>◀</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setSelectedDate(startOfDay(new Date()))}
          >
            <Text style={styles.dateText}>
              {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && meals.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fc4c02" />
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          {MEAL_TYPES.map((type) => {
            const typeMeals = getMealsByType(type.value);
            const totalKcal = typeMeals.reduce((sum, m) => sum + m.totalCalories, 0);

            return (
              <View key={type.value} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {type.icon} {type.label}
                  </Text>
                  <Text style={styles.sectionKcal}>{Math.round(totalKcal)} kcal</Text>
                </View>
                {typeMeals.length > 0 ? (
                  typeMeals.map((meal) => (
                    <View key={meal.id} style={styles.mealItem}>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealDetails}>
                          {meal.quantityGrams}g • {Math.round(meal.totalCalories)} kcal
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(meal.id)}>
                        <Text style={styles.deleteBtn}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Rien pour le moment</Text>
                )}
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    setActiveType(type.value);
                    setIsLoggerVisible(true);
                  }}
                >
                  <Text style={styles.addBtnText}>+ AJOUTER</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <MealLogger
        visible={isLoggerVisible}
        onClose={() => setIsLoggerVisible(false)}
        onLogSuccess={() => {
          setIsLoggerVisible(false);
          loadMeals();
        }}
        mealType={activeType}
        date={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 28, fontWeight: "900", color: "#111827", textAlign: 'center' },
  dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  dateSelector: { paddingHorizontal: 20 },
  dateText: { fontSize: 16, color: "#fc4c02", fontWeight: "700", textTransform: "capitalize" },
  arrowBtn: { padding: 10, backgroundColor: '#f9fafb', borderRadius: 10 },
  arrowText: { fontSize: 18, color: '#9ca3af' },
  scroll: { flex: 1, padding: 16 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1f2937" },
  sectionKcal: { fontSize: 15, fontWeight: "600", color: "#6b7280" },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f9fafb",
  },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 15, color: "#374151", fontWeight: "600" },
  mealDetails: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  deleteBtn: { fontSize: 18, marginLeft: 12, opacity: 0.6 },
  emptyText: {
    fontSize: 13,
    color: "#d1d5db",
    fontStyle: "italic",
    marginVertical: 8,
  },
  addBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: '#fff5f2',
    borderRadius: 12,
  },
  addBtnText: { color: "#fc4c02", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
});