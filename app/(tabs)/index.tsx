/* eslint-disable react/no-unescaped-entities */
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useStrava } from "../../context/StravaContext";
import { useActivityStats } from "../../hooks/useActivityStats";
import DashboardOverview from "../../components/DashboardOverview";
import SportFilterTabs from "../../components/SportFilterTabs";

export default function DashboardScreen() {
  // On récupère filteredActivities et les contrôles du sport
  const {
    filteredActivities,
    loading,
    error,
    sportFilter,
    setSportFilter,
    isAuthenticated,
    connect,
    disconnect,
  } = useStrava();
  // Le hook de stats avale uniquement la donnée déjà filtrée
  const { timeWindow, setTimeWindow, stats } =
    useActivityStats(filteredActivities);

  if (loading && filteredActivities.length === 0 && isAuthenticated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fc4c02" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.headerTitle}>Connecte ton compte Strava</Text>
        <TouchableOpacity style={styles.cta} onPress={connect}>
          <Text style={styles.ctaText}>Se connecter</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.errorHint}>{error}</Text> : null}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Vue d'ensemble</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={disconnect}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* Composant partagé : Filtre Sport */}
      <SportFilterTabs
        activeFilter={sportFilter}
        onFilterChange={setSportFilter}
      />

      <DashboardOverview
        stats={stats}
        timeWindow={timeWindow}
        setTimeWindow={setTimeWindow}
      />

      <Text style={styles.footerInfo}>
        Basé sur {stats.count} trajets enregistrés.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "#ef4444", fontWeight: "bold" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#111827",
  },
  footerInfo: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 10,
    fontStyle: "italic",
    paddingBottom: 30,
  },
  cta: {
    marginTop: 12,
    backgroundColor: "#fc4c02",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  ctaText: { color: "#fff", fontWeight: "700" },
  logoutBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  logoutText: { color: "#4b5563", fontWeight: "600" },
  errorHint: {
    color: "#ef4444",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
