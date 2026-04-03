// hooks/useActivityStats.ts
import { useState, useMemo } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export function useActivityStats(activities: any[]) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const stats = useMemo(() => {
    if (!activities || activities.length === 0) {
      return { count: 0, distance: 0, movingTime: 0, calories: 0 };
    }

    const start = viewMode === 'day' 
      ? startOfDay(selectedDate) 
      : startOfWeek(selectedDate, { weekStartsOn: 1 });
    
    const end = viewMode === 'day' 
      ? endOfDay(selectedDate) 
      : endOfWeek(selectedDate, { weekStartsOn: 1 });

    const filteredActivities = activities.filter(act => {
      
      if (!act.start_date) return false;
      const actDate = new Date(act.start_date);
      return isWithinInterval(actDate, { start, end });
    });
    return {
      count: filteredActivities.length,
      distance: filteredActivities.reduce((acc, curr) => acc + (curr.distance || 0), 0),
      movingTime: filteredActivities.reduce((acc, curr) => acc + (curr.moving_time || 0), 0),
      // C'est cette ligne qui fait le job. Vérifie que c'est bien "curr.calories" (ou "curr.calorie" au singulier selon ta DB)
      calories: filteredActivities.reduce((acc, curr) => acc + (curr.calories || 0), 0), 
    };
  }, [activities, selectedDate, viewMode]);

  return { viewMode, setViewMode, selectedDate, setSelectedDate, stats };
}