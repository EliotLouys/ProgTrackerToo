import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { StravaActivity } from "../types/strava";

const API_TOKEN_KEY = "@api_token";

type ApiErrorPayload = { error?: string };

const getDevMachineHost = () => {
  const candidates = [
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri,
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost,
    (
      Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | null
    )?.extra?.expoClient?.hostUri,
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return candidate.split(":")[0];
    }
  }

  return null;
};


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ;

const parseApiError = async (response: Response) => {
  try {
    const payload: ApiErrorPayload = await response.json();
    return payload.error ?? `Erreur API (${response.status})`;
  } catch {
    return `Erreur API (${response.status})`;
  }
};

const request = async <T>(path: string, token?: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error(
      `Network request failed. API unreachable at ${API_BASE_URL}. ` +
        `Set EXPO_PUBLIC_API_BASE_URL in .env (not .env.example) with your machine LAN IP.`,
    );
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<T>;
};

export const getStoredApiToken = async () => AsyncStorage.getItem(API_TOKEN_KEY);

export const saveApiToken = async (token: string) => {
  await AsyncStorage.setItem(API_TOKEN_KEY, token);
};

export const clearApiToken = async () => {
  await AsyncStorage.removeItem(API_TOKEN_KEY);
};

export const fetchBackendStravaAuthUrl = async (
  appRedirectUri: string,
): Promise<string> => {
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/auth/strava/url?app_redirect_uri=${encodeURIComponent(appRedirectUri)}`,
    );
  } catch {
    throw new Error(
      `Network request failed. API unreachable at ${API_BASE_URL}. ` +
        `Set EXPO_PUBLIC_API_BASE_URL in .env (not .env.example) with your machine LAN IP.`,
    );
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as { authUrl: string };
  return payload.authUrl;
};

export const fetchStravaActivities = async (
  token: string,
): Promise<StravaActivity[]> => {
  return request<StravaActivity[]>("/activities", token);
};
