import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ProgressStats from "@/components/dashboard/progress-stats";
import StreakCard from "@/components/dashboard/streak-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { StudyPlan } from "@shared/schema";
import { Loader2, Calendar, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: topics } = useQuery({
    queryKey: ["/api/topics"],
  });

  const { data: activePlan, isLoading: isActivePlanLoading } = useQuery<StudyPlan>({
    queryKey: ["/api/study-plans/active"],
    retry: false,
  });

  const { data: quizAttempts } = useQuery({
    queryKey: ["/api/quiz-attempts/recent"],
  });

  if (!user) return null;

  const getTodaysStudyPlan = () => {
    if (!activePlan) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todayPlan = activePlan.plan.find(day => day.day.includes(today));
    
    if (!todayPlan) {
      // Find the next day in the plan
      const now = new Date();
      const futureDays = activePlan.plan.filter(day => {
        const dayDate = day.day.match(/\d{4}-\d{2}-\d{2}/)?.[0];
        return dayDate && new Date(dayDate) > now;
      });
      
      if (futureDays.length > 0) {
        futureDays.sort((a, b) => {
          const dateA = a.day.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
          const dateB = b.day.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
        return futureDays[0];
      }
      return null;
    }
    
    return todayPlan;
  };

  const todaysPlan = getTodaysStudyPlan();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Welcome back, {user.name}
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <ProgressStats />
            <StreakCard />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Quick Actions
                </CardTitle>
                <CardDescription>Start your study session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate("/quiz")}
                  >
                    <BookOpen className="mr-2 h-4 w-4" /> Take Daily Quiz
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate("/chat")}
                  >
                    <Clock className="mr-2 h-4 w-4" /> Ask a Doubt
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate("/study-plan")}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> View Study Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Study Plan</CardTitle>
                  <CardDescription>
                    Focus on these topics for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isActivePlanLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !activePlan ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        You don't have an active study plan yet
                      </p>
                      <Button onClick={() => navigate("/study-plan")}>
                        Create Study Plan
                      </Button>
                    </div>
                  ) : !todaysPlan ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No tasks scheduled for today
                      </p>
                      <Button onClick={() => navigate("/study-plan")}>
                        View Full Plan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-medium">{todaysPlan.day}</h3>
                      <div className="space-y-3">
                        {todaysPlan.topics.map((item, index) => {
                          const topic = topics?.find(t => t.id === item.topicId);
                          return (
                            <div
                              key={index}
                              className="flex p-3 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <BookOpen className="h-5 w-5 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium">{topic?.name || `Topic #${item.topicId}`}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="mr-1 h-4 w-4" />
                                  <span>{item.duration} hours</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {item.notes}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate("/study-plan")}
                        >
                          View Full Plan
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <RecentActivity attempts={quizAttempts || []} />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
