import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Flame } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";

export default function StreakCard() {
  // Fetch user streak data
  const { data: streak, isLoading } = useQuery({
    queryKey: ["/api/streak"],
  });

  // Generate last 7 days for display
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const day = format(date, "E");
    const dayNum = format(date, "d");
    // Check if the study date matches this day
    const isStudied = streak && isSameDay(new Date(streak.lastStudyDate), date);
    return { day, dayNum, date, isStudied };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Study Streak</CardTitle>
        <CardDescription>Keep your daily study habit going</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold flex items-center">
                  {streak?.currentStreak || 0}
                  <span className="text-sm ml-1 text-muted-foreground font-normal">days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {streak?.currentStreak ? "Current" : "Start your"} streak
                </p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xl font-bold flex items-center justify-end">
                  {streak?.maxStreak || 0}
                  <span className="text-sm ml-1 text-muted-foreground font-normal">days</span>
                </div>
                <p className="text-xs text-muted-foreground">Best streak</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mt-4">
              {last7Days.map((day, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs mb-1 ${
                      day.isStudied 
                        ? "bg-primary text-primary-foreground" 
                        : isSameDay(day.date, new Date()) 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted"
                    }`}
                  >
                    {day.dayNum}
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {streak?.currentStreak
                ? `You've studied for ${streak.currentStreak} consecutive days. Keep it up!`
                : "Start a streak by taking a quiz or using the AI chat today!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
