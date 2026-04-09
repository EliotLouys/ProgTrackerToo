import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SportFilterType } from "../context/StravaContext";

interface Props {
  activeFilter: SportFilterType;
  onFilterChange: (filter: SportFilterType) => void;
}

export default function SportFilterTabs({
  activeFilter,
  onFilterChange,
}: Props) {
  const filters: { label: string; value: SportFilterType }[] = [
    { label: "Vélo", value: "Ride" },
    { label: "Course", value: "Run" },
    { label: "Divers", value: "Workout" },
    { label: "Tout", value: "all" },
  ];

  return (
    <View style={styles.container}>
      {filters.map((f) => (
        <TouchableOpacity
          key={f.value}
          onPress={() => onFilterChange(f.value)}
          style={[styles.btn, activeFilter === f.value && styles.btnActive]}
        >
          <Text
            style={[
              styles.btnText,
              activeFilter === f.value && styles.btnTextActive,
            ]}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
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
  btnText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  btnTextActive: { color: "#fc4c02" },
});
