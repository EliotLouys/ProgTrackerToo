// components/StravaActivityCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StravaActivity } from "../types/strava";

interface Props {
  activity: StravaActivity;
}

const formatDistance = (meters: number): string =>
  `${(meters / 1000).toFixed(2)} km`;

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m < 10 ? "0" : ""}${m}m` : `${m} min`;
};

export default function StravaActivityCard({ activity }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{activity.name}</Text>
        <Text style={styles.date}>
          {new Date(activity.start_date).toLocaleDateString("fr-FR", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {formatDistance(activity.distance)}
          </Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {formatTime(activity.moving_time)}
          </Text>
          <Text style={styles.statLabel}>Durée</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {activity.total_elevation_gain} m
          </Text>
          <Text style={styles.statLabel}>Dénivelé</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.healthData}>
          ❤️{" "}
          {activity.average_heartrate
            ? Math.round(activity.average_heartrate) + " bpm"
            : "-- bpm"}
        </Text>
        <Text style={styles.healthData}>
          {/* On utilise directement la valeur kilojoules comme estimation fiable en kcal */}
          🔥{" "}
          {activity.kilojoules
            ? `${Math.round(activity.kilojoules)} kcal`
            : "-- kcal"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  date: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textTransform: "capitalize",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 16,
    marginBottom: 16,
  },
  statBlock: { alignItems: "flex-start" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#fc4c02" },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textTransform: "uppercase",
  },
  footer: { flexDirection: "row", justifyContent: "space-around" },
  healthData: { fontSize: 15, fontWeight: "600", color: "#374151" },
});
