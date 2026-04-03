// types/strava.ts
export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  type: string; // <-- Ajout pour le filtrage
  average_heartrate?: number;
  kilojoules?: number;
}
