import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { Alert, Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  clearApiToken,
  fetchBackendStravaAuthUrl,
  fetchStravaActivities,
  getStoredApiToken,
  saveApiToken,
} from "../services/strava";
import { StravaActivity } from "../types/strava";

WebBrowser.maybeCompleteAuthSession();

export type SportFilterType = "all" | "Ride" | "Run" | "Walk";

interface StravaContextType {
  activities: StravaActivity[];
  filteredActivities: StravaActivity[];
  sportFilter: SportFilterType;
  setSportFilter: (filter: SportFilterType) => void;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const StravaContext = createContext<StravaContextType | undefined>(undefined);

const resolveRedirectUri = () => {
  if (process.env.EXPO_PUBLIC_STRAVA_REDIRECT_URI) {
    return process.env.EXPO_PUBLIC_STRAVA_REDIRECT_URI;
  }

  if (Platform.OS === "web") {
    return AuthSession.makeRedirectUri({
      path: "oauth",
      preferLocalhost: true,
    });
  }

  // Dev build / native: never use the Expo AuthSession proxy.
  return AuthSession.makeRedirectUri({
    scheme: "velotafdashboard",
    path: "oauth",
  });
};

export function StravaProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [sportFilter, setSportFilter] = useState<SportFilterType>("Ride"); // Vélo par défaut
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const loadActivities = async (authToken = token) => {
    if (!authToken) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchStravaActivities(authToken);
      setActivities(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les données Strava.",
      );
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      const appRedirectUri = resolveRedirectUri();
      const authUrl = await fetchBackendStravaAuthUrl(appRedirectUri);
      console.log("authUrl", authUrl);
      console.log("appRedirectUri", appRedirectUri);
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        appRedirectUri,
      );
      if (result.type !== "success") {
        throw new Error("Connexion Strava annulée.");
      }

      const callbackUrl = new URL(result.url);
      const stravaError = callbackUrl.searchParams.get("error");
      if (stravaError) {
        throw new Error(`Erreur Strava: ${stravaError}`);
      }

      const apiToken = callbackUrl.searchParams.get("token");
      if (!apiToken || typeof apiToken !== "string") {
        throw new Error(
          `Token API introuvable dans le callback. Redirect utilisé: ${appRedirectUri}`,
        );
      }

      await saveApiToken(apiToken);
      setToken(apiToken);
      await loadActivities(apiToken);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de connecter le compte Strava.";
      setError(message);
      Alert.alert("Connexion Strava", message);
    }
  };

  const disconnect = async () => {
    await clearApiToken();
    setToken(null);
    setActivities([]);
    setError(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await getStoredApiToken();
      setToken(stored);
      await loadActivities(stored);
    };
    bootstrap();
  }, []);

  // Recalcul automatique dès que l'API répond ou que l'utilisateur change de sport
  const filteredActivities = useMemo(() => {
    if (sportFilter === "all") return activities;
    if (sportFilter === "Ride") {
      return activities.filter(
        (act) =>
          act.type === "Ride" ||
          act.type === "EBikeRide" ||
          act.type === "VirtualRide",
      );
    }
    return activities.filter((act) => act.type === sportFilter);
  }, [activities, sportFilter]);

  return (
    <StravaContext.Provider
      value={{
        activities,
        filteredActivities,
        sportFilter,
        setSportFilter,
        loading,
        error,
        isAuthenticated: Boolean(token),
        connect,
        disconnect,
        refresh: loadActivities,
      }}
    >
      {children}
    </StravaContext.Provider>
  );
}

export function useStrava() {
  const context = useContext(StravaContext);
  if (context === undefined)
    throw new Error("useStrava doit être utilisé dans un StravaProvider");
  return context;
}
