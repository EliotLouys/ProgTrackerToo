import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

interface DailyStat {
  date: string;
  burned: number;
  consumed: number;
  activeKcal: number;
  naturalKcal: number;
}

interface Props {
  stats: {
    count: number;
    distance: number; 
    movingTime: number; 
    calories: number; // Valeur affichée (soit Total, soit Sport selon le toggle)
    activeBurned?: number;
    naturalBurned?: number;
    consumed: number;
    dailyStats?: DailyStat[];
    consumedProteins?: number;
    consumedCarbs?: number;
    consumedFats?: number;
    goals?: {
      proteins: number;
      carbs: number;
      fats: number;
    };
  };
  showOnlySport: boolean; // Nouveau prop pour piloter le graphique
}

export default function DashboardOverview({ stats, showOnlySport }: Props) {
  const distanceKm = (stats.distance / 1000).toFixed(1);
  const kcalBurned = Math.round(stats.calories);
  const kcalConsumed = Math.round(stats.consumed);
  const netKcal = kcalConsumed - kcalBurned;

  const protEaten = Math.round(stats.consumedProteins || 0);
  const carbsEaten = Math.round(stats.consumedCarbs || 0);
  const fatsEaten = Math.round(stats.consumedFats || 0);

  const goals = stats.goals;
  const protGoal = goals?.proteins || 0;
  const carbsGoal = goals?.carbs || 0;
  const fatsGoal = goals?.fats || 0;
  
  const hasFullData = stats.dailyStats && stats.dailyStats.length > 0;

  const formatTime = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}m`;
  };

  const renderProgressBar = (label: string, eaten: number, goal: number, color: string) => {
    const progress = goal > 0 ? Math.min(eaten / goal, 1) : 0;
    const barWidth = progress * 100;

    return (
      <View style={styles.macroRow}>
        <View style={styles.macroLabelContainer}>
          <Text style={styles.macroRowLabel}>{label}</Text>
          <Text style={styles.macroRowValue}>
            <Text style={{ fontWeight: '900', color: '#111827' }}>{eaten}g</Text>
            <Text style={{ color: '#9ca3af' }}> / {goal}g</Text>
          </Text>
        </View>
        <View style={styles.barContainer}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: color }]} />
          </View>
        </View>
      </View>
    );
  };

  // On adapte l'échelle max selon le mode pour que le graph reste lisible
  const maxKcal = Math.max(
    ... (stats.dailyStats?.flatMap(d => [
      d.consumed, 
      showOnlySport ? d.activeKcal : d.burned
    ]) || [2000]),
    500
  );

  return (
    <View style={styles.container}>
      
      {/* 1. GRAPHIQUE */}
      {hasFullData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Comparaison Quotidienne</Text>
          <View style={styles.chart}>
            {stats.dailyStats!.map((day, i) => (
              <View key={i} style={styles.chartColumn}>
                <View style={styles.barGroup}>
                  {/* Barre Consommée (Bleu) */}
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: Math.max((day.consumed / maxKcal) * 100, 2), 
                        backgroundColor: '#3b82f6' 
                      }
                    ]} 
                  />
                  {/* Barre Brûlée Empilée */}
                  <View style={styles.stackedBarContainer}>
                    {/* Segment Sport */}
                    <View 
                      style={[
                        styles.barSegment, 
                        { 
                          height: (day.activeKcal / maxKcal) * 100, 
                          backgroundColor: '#fc4c02',
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                          // Si on est en mode Sport seul, on arrondit aussi le bas
                          borderBottomLeftRadius: showOnlySport ? 4 : 0,
                          borderBottomRightRadius: showOnlySport ? 4 : 0,
                        }
                      ]} 
                    />
                    {/* Segment Repos (Caché si showOnlySport est vrai) */}
                    {!showOnlySport && (
                      <View 
                        style={[
                          styles.barSegment, 
                          { 
                            height: (day.naturalKcal / maxKcal) * 100, 
                            backgroundColor: '#ffedd5',
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                          }
                        ]} 
                      />
                    )}
                  </View>
                </View>
                <Text style={styles.dayLabel}>
                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Ingéré</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#fc4c02' }]} />
              <Text style={styles.legendText}>Sport</Text>
            </View>
            {!showOnlySport && (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ffedd5', borderWidth: 1, borderColor: '#fed7aa' }]} />
                <Text style={styles.legendText}>Repos</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 2. OBJECTIFS MACROS */}
      <Text style={styles.sectionTitle}>Objectifs Journaliers</Text>
      <View style={styles.macroCard}>
        {renderProgressBar("Protéines", protEaten, protGoal, "#10b981")}
        {renderProgressBar("Glucides", carbsEaten, carbsGoal, "#f59e0b")}
        {renderProgressBar("Lipides", fatsEaten, fatsGoal, "#6366f1")}
      </View>

      {/* 3. BILAN CHIFFRÉ */}
      <Text style={styles.sectionTitle}>Bilan {showOnlySport ? "Sportif" : "Énergétique"}</Text>
      <View style={styles.mainStats}>
        <View style={styles.kcalCard}>
          <Text style={styles.kcalValue}>{kcalConsumed}</Text>
          <Text style={styles.kcalLabel}>Ingérés</Text>
        </View>
        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <View style={styles.kcalCard}>
          <Text style={styles.kcalValue}>{kcalBurned}</Text>
          <Text style={styles.kcalLabel}>{showOnlySport ? "Brûlés (Sport)" : "Brûlés (Total)"}</Text>
        </View>
      </View>

      <View style={[styles.netCard, { backgroundColor: netKcal > 0 ? '#fee2e2' : '#dcfce7' }]}>
        <Text style={styles.netLabel}>Balance nette</Text>
        <Text style={[styles.netValue, { color: netKcal > 0 ? '#ef4444' : '#22c55e' }]}>
          {netKcal > 0 ? '+' : ''}{netKcal} kcal
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Activités Strava</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🚲 {distanceKm}</Text>
          <Text style={styles.statLabel}>Km Parcourus</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⏱️ {formatTime(stats.movingTime)}</Text>
          <Text style={styles.statLabel}>Temps d'activité</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 24,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mainStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  kcalCard: { alignItems: "center", flex: 1 },
  kcalValue: { fontSize: 28, fontWeight: "900", color: "#111827" },
  kcalLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600", marginTop: 4 },
  vsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  vsText: { fontSize: 12, fontWeight: "800", color: "#9ca3af" },
  netCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: { fontSize: 16, fontWeight: "600", color: "#374151" },
  netValue: { fontSize: 20, fontWeight: "800" },
  
  chartContainer: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  chartTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 24 },
  chart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 160,
    paddingBottom: 10,
  },
  chartColumn: { alignItems: "center", flex: 1 },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: "100%",
  },
  bar: {
    width: 12,
    borderRadius: 6,
    minHeight: 2,
  },
  stackedBarContainer: {
    width: 12,
    height: "100%",
    justifyContent: "flex-end",
  },
  barSegment: {
    width: "100%",
    minHeight: 1,
  },
  dayLabel: { fontSize: 10, color: "#9ca3af", marginTop: 12, fontWeight: "700", textTransform: 'uppercase' },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 15,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendColor: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: "#6b7280", fontWeight: "700" },

  statsGrid: { flexDirection: "row", gap: 12, marginTop: 4 },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600" },

  macroCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  macroRow: { marginBottom: 16 },
  macroLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  macroRowLabel: { fontSize: 14, fontWeight: '700', color: '#4b5563' },
  macroRowValue: { fontSize: 13 },
  barContainer: { height: 8, width: '100%' },
  barBg: { height: '100%', backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});