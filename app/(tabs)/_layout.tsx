import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native"; // <-- Import manquant corrigé
import { StravaProvider } from "../../context/StravaContext";

export default function TabLayout() {
  return (
    <StravaProvider>
      <Tabs screenOptions={{ tabBarActiveTintColor: "#fc4c02" }}>
        <Tabs.Screen name="index" options={{ headerShown: false, href: null }} />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>Dashboard</Text>,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Trajets",
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚲</Text>,
          }}
        />
        <Tabs.Screen
          name="meals"
          options={{
            title: "Repas",
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🍱</Text>,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
          }}
        />
      </Tabs>
    </StravaProvider>
  );
}
