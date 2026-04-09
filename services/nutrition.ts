import { getStoredApiToken } from "./strava";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const request = async <T>(path: string, method = "GET", body?: any): Promise<T> => {
  const token = await getStoredApiToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Erreur API (${response.status})`);
  }

  if (method === "DELETE") return {} as T;
  return response.json();
};

export interface CiqualItem {
  id: number;
  name: string;
  kcalPer100g: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
}

export interface MealLog {
  id: string;
  name: string;
  source: "OPEN_FOOD_FACTS" | "CIQUAL" | "CUSTOM";
  externalId?: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  quantityGrams: number;
  totalCalories: number;
  consumedAt: string;
}

export const searchCiqual = async (query: string): Promise<CiqualItem[]> => {
  return request<CiqualItem[]>(`/food/search?q=${encodeURIComponent(query)}`);
};

export const fetchOFFProduct = async (barcode: string): Promise<any> => {
  return request<any>(`/food/barcode/${barcode}`);
};

export const logMeal = async (meal: {
  name: string;
  kcalPer100g: number;
  quantityGrams: number;
  source: string;
  externalId?: string | number;
  mealType: string;
  consumedAt?: Date;
}): Promise<MealLog> => {
  return request<MealLog>("/meals/log", "POST", meal);
};

export const fetchMeals = async (date?: Date): Promise<MealLog[]> => {
  if (!date) return request<MealLog[]>("/meals");
  
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return request<MealLog[]>(`/meals?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
};

export const backfillStrava = async (): Promise<any> => {
  return request<any>("/strava/backfill", "POST");
};

export const deleteMeal = async (id: string): Promise<void> => {
  return request<void>(`/meals/${id}`, "DELETE");
};

export const fetchDashboardStats = async (startDate: Date, endDate: Date, sport?: string): Promise<any> => {
  const sportQuery = sport ? `&sport=${sport}` : "";
  
  return request<any>(`/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${sportQuery}`);
};

export interface UserProfile {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: "MALE" | "FEMALE";
  activityLevel: "SEDENTARY" | "LIGHTLY_ACTIVE" | "MODERATELY_ACTIVE" | "VERY_ACTIVE" | "EXTRA_ACTIVE";
}

export const fetchProfile = async (): Promise<UserProfile> => {
  return request<UserProfile>("/profile");
};

export const updateProfile = async (profile: Partial<UserProfile>): Promise<any> => {
  return request<any>("/profile", "PUT", profile);
};
