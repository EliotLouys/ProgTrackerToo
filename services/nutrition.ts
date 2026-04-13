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
  id: number | string;
  name: string;
  kcalPer100g: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
  source?: "CIQUAL" | "USER_FOOD" | "OPEN_FOOD_FACTS" | "RECIPE";
  ingredients?: RecipeIngredient[];
}

export interface Recipe {
  id: string;
  name: string;
  kcalPer100g: number;
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
  name: string;
  kcalPer100g: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
  quantityGrams: number;
}

export interface CustomFood {
  id: string;
  name: string;
  barcode?: string;
  kcalPer100g: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
}

export interface MealLog {
  id: string;
  name: string;
  source: "OPEN_FOOD_FACTS" | "CIQUAL" | "CUSTOM" | "USER_FOOD" | "RECIPE";
  externalId?: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  quantityGrams: number;
  totalCalories: number;
  consumedAt: string;
}

export const searchFood = async (query: string, recipes = false): Promise<CiqualItem[]> => {
  return request<CiqualItem[]>(`/food/search?q=${encodeURIComponent(query)}&recipes=${recipes}`);
};

export const listRecipes = async (): Promise<Recipe[]> => {
  return request<Recipe[]>("/recipes");
};

export const createRecipe = async (recipe: { name: string; ingredients: RecipeIngredient[] }): Promise<Recipe> => {
  return request<Recipe>("/recipes", "POST", recipe);
};

export const deleteRecipe = async (id: string): Promise<void> => {
  return request<void>(`/recipes/${id}`, "DELETE");
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

export const listCustomFoods = async (): Promise<CustomFood[]> => {
  return request<CustomFood[]>("/food/custom");
};

export const createCustomFood = async (food: Omit<CustomFood, "id">): Promise<CustomFood> => {
  return request<CustomFood>("/food/custom", "POST", food);
};

export const deleteCustomFood = async (id: string): Promise<void> => {
  return request<void>(`/food/custom/${id}`, "DELETE");
};

export const backfillStrava = async (): Promise<any> => {
  return request<any>("/strava/backfill", "POST");
};

export const deleteMeal = async (id: string): Promise<void> => {
  return request<void>(`/meals/${id}`, "DELETE");
};

export const fetchDashboardStats = async (startDate: Date, endDate: Date, sport?: string, excludeFuture?: boolean): Promise<any> => {
  const sportQuery = sport ? `&sport=${sport}` : "";
  const excludeFutureQuery = excludeFuture ? `&excludeFuture=true` : "";
  
  return request<any>(`/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${sportQuery}${excludeFutureQuery}`);
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
