import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TimeWindow } from "../hooks/useActivityStats";

interface Props {
  stats: any;
  timeWindow: TimeWindow;
  setTimeWindow: (val: TimeWindow) => void;
}

export default function DashboardOverview({
  stats,
  timeWindow,
  setTimeWindow,
}: Props) {
  const windows: { label: string; value: TimeWindow }[] = [
    { label: "7J", value: 7 },
    { label: "30J", value: 30 },
    { label: "90J", value: 90 },
    { label: "Tout", value: 0 },
  ];

  return (
    <View style={styles.container}>
      {/* Filtres de temps */}
      <View style={styles.filterRow}>
        {windows.map((win) => (
          <TouchableOpacity
            key={win.label}
            onPress={() => setTimeWindow(win.value)}
            style={[styles.btn, timeWindow === win.value && styles.btnActive]}
          >
            <Text
              style={[
                styles.btnText,
                timeWindow === win.value && styles.btnTextActive,
              ]}
            >
              {win.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats globales */}
      <Text style={styles.sectionTitle}>Bilan Cumulé</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🔥 {stats.totalKcal}</Text>
          <Text style={styles.statLabel}>Kcal Totales</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🚲 {stats.totalDistance}</Text>
          <Text style={styles.statLabel}>Km Parcourus</Text>
        </View>
      </View>

      {/* Stats hebdomadaires moyennes */}
      <Text style={styles.sectionTitle}>Rythme Hebdomadaire</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBoxDark}>
          <Text style={styles.statValueDark}>🔥 {stats.weeklyKcal}</Text>
          <Text style={styles.statLabelDark}>Kcal / Semaine</Text>
        </View>
        <View style={styles.statBoxDark}>
          <Text style={styles.statValueDark}>📈 {stats.weeklyDistance}</Text>
          <Text style={styles.statLabelDark}>Km / Semaine</Text>
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
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    padding: 4,
    marginBottom: 10,
  },
  btn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  btnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnText: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  btnTextActive: { color: "#fc4c02" },
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
