import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  stats: {
    count: number;
    distance: number; // en mètres depuis l'API Strava
    movingTime: number; // en secondes
    calories: number;
  };
}

export default function DashboardOverview({ stats }: Props) {
  // Conversions
  const distanceKm = (stats.distance / 1000).toFixed(1);
  const kcal = Math.round(stats.calories);
  const formatTime = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}m`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Bilan de la période</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🔥 {kcal}</Text>
          <Text style={styles.statLabel}>Kcal</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🚲 {distanceKm}</Text>
          <Text style={styles.statLabel}>Km Parcourus</Text>
        </View>
      </View>

      <View style={[styles.statsGrid, { marginTop: 12 }]}>
        <View style={styles.statBoxDark}>
          <Text style={styles.statValueDark}>⏱️ {formatTime(stats.movingTime)}</Text>
          <Text style={styles.statLabelDark}>Temps d'activité</Text>
        </View>
        <View style={styles.statBoxDark}>
          <Text style={styles.statValueDark}>📍 {stats.count}</Text>
          <Text style={styles.statLabelDark}>Trajets</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f3f4f6", marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 10,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  statsGrid: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  statBoxDark: {
    flex: 1,
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValueDark: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  statLabelDark: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
});