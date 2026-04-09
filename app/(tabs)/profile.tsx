import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { fetchProfile, updateProfile, UserProfile, backfillStrava } from "../../services/nutrition";
import { useStrava } from "../../context/StravaContext";

const ACTIVITY_LEVELS = [
  { label: "Sédentaire (Bureau, peu de sport)", value: "SEDENTARY" },
  { label: "Légèrement actif (Sport 1-3j/sem)", value: "LIGHTLY_ACTIVE" },
  { label: "Modérément actif (Sport 3-5j/sem)", value: "MODERATELY_ACTIVE" },
  { label: "Très actif (Sport 6-7j/sem)", value: "VERY_ACTIVE" },
  { label: "Extrêmement actif (Physique + Sport)", value: "EXTRA_ACTIVE" },
];

export default function ProfileScreen() {
  const { disconnect, refresh } = useStrava();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    weightKg: null,
    heightCm: null,
    age: null,
    gender: "MALE",
    activityLevel: "SEDENTARY",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      Alert.alert("Succès", "Profil mis à jour ! Vos calories naturelles sont maintenant recalculées.");
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sauvegarder le profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackfill = async () => {
    setSyncing(true);
    try {
      await backfillStrava();
      await refresh();
      Alert.alert("Synchronisation", "Vos activités Strava ont été récupérées avec succès !");
    } catch (err) {
      Alert.alert("Erreur", "La synchronisation a échoué.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fc4c02" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mon Profil Physique</Text>
      <Text style={styles.subtitle}>
        Ces informations permettent de calculer vos calories brûlées naturellement hors sport.
      </Text>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Poids (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={profile.weightKg?.toString() || ""}
            onChangeText={(t) => setProfile({ ...profile, weightKg: parseFloat(t) || null })}
            placeholder="ex: 75"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Taille (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={profile.heightCm?.toString() || ""}
            onChangeText={(t) => setProfile({ ...profile, heightCm: parseFloat(t) || null })}
            placeholder="ex: 180"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Âge</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={profile.age?.toString() || ""}
            onChangeText={(t) => setProfile({ ...profile, age: parseInt(t) || null })}
            placeholder="ex: 30"
          />
        </View>

        <Text style={styles.label}>Genre</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.choiceBtn, profile.gender === "MALE" && styles.choiceBtnActive]}
            onPress={() => setProfile({ ...profile, gender: "MALE" })}
          >
            <Text style={[styles.choiceText, profile.gender === "MALE" && styles.choiceTextActive]}>Homme</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.choiceBtn, profile.gender === "FEMALE" && styles.choiceBtnActive]}
            onPress={() => setProfile({ ...profile, gender: "FEMALE" })}
          >
            <Text style={[styles.choiceText, profile.gender === "FEMALE" && styles.choiceTextActive]}>Femme</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Style de vie (hors sport Strava)</Text>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[styles.levelBtn, profile.activityLevel === level.value && styles.levelBtnActive]}
            onPress={() => setProfile({ ...profile, activityLevel: level.value as any })}
          >
            <Text style={[styles.levelText, profile.activityLevel === level.value && styles.levelTextActive]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>ENREGISTRER LE PROFIL</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.syncCard}>
        <Text style={styles.syncTitle}>Données Strava</Text>
        <Text style={styles.syncSubtitle}>Si vos trajets récents n'apparaissent pas, forcez une synchronisation.</Text>
        <TouchableOpacity 
          style={[styles.syncBtn, syncing && styles.syncBtnDisabled]} 
          onPress={handleBackfill} 
          disabled={syncing}
        >
          {syncing ? <ActivityIndicator color="#fc4c02" /> : <Text style={styles.syncBtnText}>🔄 SYNCHRONISER L'HISTORIQUE</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={disconnect}>
        <Text style={styles.logoutText}>Se déconnecter de Strava</Text>
      </TouchableOpacity>
      
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, fontSize: 16 },
  row: { flexDirection: "row", gap: 10, marginBottom: 16 },
  choiceBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" },
  choiceBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  choiceText: { fontWeight: "600", color: "#6b7280" },
  choiceTextActive: { color: "#fff" },
  levelBtn: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 8 },
  levelBtnActive: { backgroundColor: "#fef2f2", borderColor: "#fc4c02" },
  levelText: { fontSize: 13, color: "#4b5563", fontWeight: "500" },
  levelTextActive: { color: "#fc4c02", fontWeight: "700" },
  saveBtn: { backgroundColor: "#fc4c02", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  syncCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginTop: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  syncTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  syncSubtitle: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  syncBtn: { borderWidth: 2, borderColor: "#fc4c02", padding: 14, borderRadius: 12, alignItems: "center" },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { color: "#fc4c02", fontWeight: "800", fontSize: 14 },
  logoutBtn: { marginTop: 40, padding: 16, alignItems: "center", marginBottom: 60 },
  logoutText: { color: "#ef4444", fontWeight: "600" },
});