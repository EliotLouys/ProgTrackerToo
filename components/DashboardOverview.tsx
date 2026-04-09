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
  };
  showOnlySport: boolean; // Nouveau prop pour piloter le graphique
}

export default function DashboardOverview({ stats, showOnlySport }: Props) {
  const distanceKm = (stats.distance / 1000).toFixed(1);
  const kcalBurned = Math.round(stats.calories);
  const kcalConsumed = Math.round(stats.consumed);
  const netKcal = kcalConsumed - kcalBurned;
  
  const hasFullData = stats.dailyStats && stats.dailyStats.length > 0;

  const formatTime = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}m`;
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

      {/* 2. BILAN CHIFFRÉ */}
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
});