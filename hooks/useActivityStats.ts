import { useState, useMemo } from "react";
import { StravaActivity } from "../types/strava";

export type TimeWindow = 7 | 30 | 90 | 0;

export function useActivityStats(activities: StravaActivity[]) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);

  const stats = useMemo(() => {
    const now = new Date();

    const timeFiltered = activities.filter((act) => {
      if (timeWindow !== 0) {
        const actDate = new Date(act.start_date);
        const diffDays =
          Math.abs(now.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > timeWindow) return false;
      }
      return true;
    });

    const count = timeFiltered.length;

    if (count === 0) {
      return {
        count: 0,
        totalKcal: 0,
        totalDistance: 0,
        weeklyKcal: 0,
        weeklyDistance: "0.0",
        filteredActivities: [],
      };
    }

    const totalDistance =
      timeFiltered.reduce((acc, curr) => acc + curr.distance, 0) / 1000;
    const totalKcal = timeFiltered.reduce(
      (acc, curr) => acc + (curr.kilojoules || 0),
      0,
    );

    let weeksDivider = timeWindow / 7;
    if (timeWindow === 0) {
      const oldestDate = new Date(
        Math.min(...timeFiltered.map((a) => new Date(a.start_date).getTime())),
      );
      const daysSinceOldest = Math.max(
        1,
        (now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      weeksDivider = daysSinceOldest / 7;
    }

    return {
      count,
      totalKcal: Math.round(totalKcal),
      totalDistance: totalDistance.toFixed(1),
      weeklyKcal: Math.round(totalKcal / weeksDivider),
      weeklyDistance: (totalDistance / weeksDivider).toFixed(1),
      filteredActivities: timeFiltered,
    };
  }, [activities, timeWindow]);

  return { timeWindow, setTimeWindow, stats };
}
