import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useStrava } from "../../context/StravaContext";
import { useActivityStats } from "../../hooks/useActivityStats";
import DashboardOverview from "../../components/DashboardOverview";
import SportFilterTabs from "../../components/SportFilterTabs";

// Configuration de la locale en français pour le calendrier
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';


export default function DashboardScreen() {
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

  const { viewMode, setViewMode, selectedDate, setSelectedDate, stats } = useActivityStats(filteredActivities);
  const [showCalendar, setShowCalendar] = useState(false);


// Génération du label du bouton principal
  const dateLabel = viewMode === 'day' 
    ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
    : `Semaine du ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })}`;

  // Calcul visuel pour react-native-calendars (surligner le jour ou la semaine)
  const markedDates = useMemo(() => {
    const marks: any = {};
    const themeColor = '#fc4c02';

    if (viewMode === 'day') {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      marks[dateString] = { selected: true, selectedColor: themeColor };
    } else {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i);
        const dateString = format(d, 'yyyy-MM-dd');
        marks[dateString] = {
          selected: true,
          color: themeColor,
          textColor: 'white',
          startingDay: i === 0,
          endingDay: i === 6,
        };
      }
    }
    return marks;
  }, [selectedDate, viewMode]);

  const onDayPress = (day: any) => {
    // On découpe la string "YYYY-MM-DD" pour forcer une date locale à minuit pile
    const [year, month, dayNum] = day.dateString.split('-');
    
    // Attention: les mois en JS commencent à 0 (0 = Janvier, 11 = Décembre)
    const localDate = new Date(Number(year), Number(month) - 1, Number(dayNum));
    
    setSelectedDate(localDate);
  };

  if (loading && filteredActivities.length === 0 && isAuthenticated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fc4c02" />
      </View>
    );
  }

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
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Vue d'ensemble</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={disconnect}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
  
        <SportFilterTabs activeFilter={sportFilter} onFilterChange={setSportFilter} />
  
        {/* BOUTON D'OUVERTURE DU CALENDRIER */}
        <TouchableOpacity style={styles.dateSelectorBtn} onPress={() => setShowCalendar(true)}>
          <Text style={styles.dateSelectorText}>📅 {dateLabel}</Text>
        </TouchableOpacity>
  
        <DashboardOverview stats={stats} />
  
        {/* MODALE DU CALENDRIER CUSTOM */}
        <Modal visible={showCalendar} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* SWITCH JOUR/SEMAINE INTÉGRÉ AU PICKER */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('day')}
                >
                  <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>Jour</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('week')}
                >
                  <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Semaine entière</Text>
                </TouchableOpacity>
              </View>
  
              <Calendar
                current={format(selectedDate, 'yyyy-MM-dd')}
                onDayPress={onDayPress}
                markedDates={markedDates}
                markingType={viewMode === 'week' ? 'period' : 'custom'}
                firstDay={1} // Lundi
                theme={{
                  todayTextColor: '#fc4c02',
                  arrowColor: '#fc4c02',
                }}
              />
  
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCalendar(false)}>
                <Text style={styles.closeModalText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
  
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  logoutBtn: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  logoutText: { color: "#4b5563", fontWeight: "600" },
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
  // Nouveaux styles
  controlsContainer: { marginVertical: 16, gap: 12 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleText: { color: '#6b7280', fontWeight: '600' },
  toggleTextActive: { color: '#111827' },
  dateSelector: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  dateSelectorText: { fontSize: 16, color: '#374151', fontWeight: '500', textTransform: 'capitalize' },
  
  footerInfo: { textAlign: "center", color: "#9ca3af", marginTop: 10, fontStyle: "italic", paddingBottom: 30 },
  
  dateSelectorBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', marginVertical: 16 },
  
  // Styles de la modale
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  

  
  closeModalBtn: { marginTop: 16, backgroundColor: '#fc4c02', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeModalText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});