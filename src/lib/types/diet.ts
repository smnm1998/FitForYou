export interface MealPlan {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack?: string;
    totalCalories: number;
}

export interface WeeklyDiet {
    id: number | string;
    day: string;
    date: string;
    mealPlan: MealPlan;
    isToday: boolean;
}

export interface SavedDietItem {
    id: string;
    firstDietId: number;
    title: string;
    createdAt: string;
    weeklyDiet: WeeklyDiet[];
    isCompleteWeek: boolean;
    avgCalories: number;
    totalDays: number;
    isFavorite: boolean;
    isThisWeek: boolean;
    advice?: {
        tips: string[];
        warnings: string[];
        summary: string;
    };
}
