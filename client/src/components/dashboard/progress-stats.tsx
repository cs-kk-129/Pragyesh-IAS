import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, CheckCircle, BookMarked } from "lucide-react";

export default function ProgressStats() {
  // Fetch user progress
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
  });

  // Fetch topics data
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["/api/topics"],
  });

  // Fetch quiz attempts
  const { data: quizAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["/api/quiz-attempts/user"],
  });

  const isLoading = progressLoading || topicsLoading || attemptsLoading;

  // Calculate statistics
  const getTotalTopicsStudied = () => {
    if (!progressData) return 0;
    return progressData.length;
  };

  const getTotalQuizzesTaken = () => {
    if (!quizAttempts) return 0;
    return quizAttempts.length;
  };

  const getAverageScore = () => {
    if (!quizAttempts || quizAttempts.length === 0) return 0;
    const totalScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalQuestions) * 100, 0);
    return Math.round(totalScore / quizAttempts.length);
  };

  const getCompletionPercentage = () => {
    if (!topics || !progressData) return 0;
    return Math.round((getTotalTopicsStudied() / topics.length) * 100);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Progress Overview</CardTitle>
        <CardDescription>Your UPSC preparation at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-2 bg-primary/5 rounded-md">
              <BookOpen className="h-8 w-8 text-primary mb-1" />
              <span className="text-2xl font-bold">{getTotalTopicsStudied()}</span>
              <span className="text-xs text-muted-foreground text-center">
                Topics Studied
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-primary/5 rounded-md">
              <BookMarked className="h-8 w-8 text-primary mb-1" />
              <span className="text-2xl font-bold">{getTotalQuizzesTaken()}</span>
              <span className="text-xs text-muted-foreground text-center">
                Quizzes Taken
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-primary/5 rounded-md">
              <div className="relative h-8 w-8 mb-1 flex items-center justify-center">
                <svg className="h-8 w-8" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e6e6e6" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${getAverageScore() * 0.94} 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span className="absolute text-xs font-medium">{getAverageScore()}%</span>
              </div>
              <span className="text-2xl font-bold">{getAverageScore()}%</span>
              <span className="text-xs text-muted-foreground text-center">
                Avg. Score
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-primary/5 rounded-md">
              <CheckCircle className="h-8 w-8 text-primary mb-1" />
              <span className="text-2xl font-bold">{getCompletionPercentage()}%</span>
              <span className="text-xs text-muted-foreground text-center">
                Completion
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
