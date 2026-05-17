import React from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Connecte Strava pour voir tes trajets.</Text>
          <TouchableOpacity style={styles.cta} onPress={connect}>
            <Text style={styles.ctaText}>Se connecter</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.errorHint}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>Historique Strava</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 16 },
  listContainer: { paddingBottom: 20 },
  emptyContainer: { padding: 40, alignItems: "center", flex: 1, justifyContent: 'center' },
  emptyText: { color: "#6b7280", fontSize: 15, fontStyle: "italic", textAlign: 'center' },
  cta: {
    marginTop: 20,
    backgroundColor: "#fc4c02",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorHint: {
    color: "#ef4444",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
