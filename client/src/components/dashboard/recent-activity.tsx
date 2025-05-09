import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface RecentActivityProps {
  attempts: any[];
}

export default function RecentActivity({ attempts }: RecentActivityProps) {
  const { data: topics } = useQuery({
    queryKey: ["/api/topics"],
  });

  const { data: quizzes } = useQuery({
    queryKey: ["/api/quizzes/topic"],
    enabled: false, // We'll fetch specific quizzes as needed
  });

  // Get topic name by topicId
  const getTopicName = (quizId: number) => {
    if (!quizzes) return "Loading...";
    const quiz = quizzes.find((q: any) => q.id === quizId);
    if (!quiz) return "Unknown Quiz";

    if (!topics) return "Loading...";
    const topic = topics.find((t: any) => t.id === quiz.topicId);
    return topic ? topic.name : "Unknown Topic";
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        <CardDescription>Your latest quiz attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No recent activity. Take a quiz to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                <div 
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    attempt.score / attempt.totalQuestions >= 0.7
                      ? "bg-green-100"
                      : attempt.score / attempt.totalQuestions >= 0.4
                      ? "bg-yellow-100"
                      : "bg-red-100"
                  }`}
                >
                  {attempt.score / attempt.totalQuestions >= 0.7 ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : attempt.score / attempt.totalQuestions >= 0.4 ? (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{`Quiz on ${getTopicName(attempt.quizId)}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(attempt.completedAt)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Score: {attempt.score}/{attempt.totalQuestions} (
                    {Math.round((attempt.score / attempt.totalQuestions) * 100)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
