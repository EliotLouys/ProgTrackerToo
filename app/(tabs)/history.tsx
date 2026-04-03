import React from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { useStrava } from "../../context/StravaContext";
import StravaActivityCard from "../../components/StravaActivityCard";
import SportFilterTabs from "../../components/SportFilterTabs";

export default function HistoryScreen() {
  const {
    filteredActivities,
    loading,
    refresh,
    sportFilter,
    setSportFilter,
    isAuthenticated,
    connect,
    error,
  } = useStrava();

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Connecte Strava pour voir tes trajets.</Text>
        <TouchableOpacity style={styles.cta} onPress={connect}>
          <Text style={styles.ctaText}>Se connecter</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.errorHint}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <SportFilterTabs
              activeFilter={sportFilter}
              onFilterChange={setSportFilter}
            />
          </View>
        }
        renderItem={({ item }) => <StravaActivityCard activity={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#fc4c02"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucune activité trouvée pour ce sport.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16 },
  listContainer: { paddingBottom: 20 },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 15, fontStyle: "italic" },
  cta: {
    marginTop: 12,
    backgroundColor: "#fc4c02",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  ctaText: { color: "#fff", fontWeight: "700" },
  errorHint: {
    color: "#ef4444",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
