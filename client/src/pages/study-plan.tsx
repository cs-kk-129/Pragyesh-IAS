import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, startOfWeek } from "date-fns";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Clock, 
  Plus,
  ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 6));

  // Fetch all topics
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["/api/topics"],
  });

  // Fetch active study plan
  const { data: activePlan, isLoading: activePlanLoading } = useQuery({
    queryKey: ["/api/study-plans/active"],
    retry: false,
  });

  // Fetch all study plans
  const { data: allPlans, isLoading: allPlansLoading } = useQuery({
    queryKey: ["/api/study-plans"],
  });

  // Generate a new study plan
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study-plans/generate", {
        topicIds: selectedTopics,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans/active"] });
      toast({
        title: "Study plan created!",
        description: "Your personalized study plan has been generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate study plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle topic selection toggle
  const handleTopicToggle = (topicId: number) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  // Get topic name by ID
  const getTopicName = (topicId: number) => {
    return topics?.find((topic) => topic.id === topicId)?.name || `Topic #${topicId}`;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM d, yyyy");
  };

  // Handle plan generation
  const handleGeneratePlan = () => {
    if (selectedTopics.length === 0) {
      toast({
        title: "No topics selected",
        description: "Please select at least one topic for your study plan.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Dates required",
        description: "Please select both start and end dates for your study plan.",
        variant: "destructive",
      });
      return;
    }

    generatePlanMutation.mutate();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Study Plans</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Plan
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Create Study Plan</SheetTitle>
                  <SheetDescription>
                    Generate a personalized study plan based on your preferences
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Select Topics</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {topicsLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        topics?.map((topic) => (
                          <div key={topic.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`topic-${topic.id}`}
                              checked={selectedTopics.includes(topic.id)}
                              onCheckedChange={() => handleTopicToggle(topic.id)}
                            />
                            <label
                              htmlFor={`topic-${topic.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {topic.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Start Date</h3>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">End Date</h3>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => 
                          !startDate || date < startDate || 
                          date > addDays(startDate, 30) // Limit to 30 days
                        }
                        initialFocus
                      />
                    </div>
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button 
                    onClick={handleGeneratePlan}
                    disabled={selectedTopics.length === 0 || !startDate || !endDate || generatePlanMutation.isPending}
                  >
                    {generatePlanMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Plan"
                    )}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <Tabs defaultValue="active">
            <TabsList className="mb-6">
              <TabsTrigger value="active">Active Plan</TabsTrigger>
              <TabsTrigger value="all">All Plans</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {activePlanLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !activePlan ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Active Study Plan</CardTitle>
                    <CardDescription>
                      Create a new study plan to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-primary/10 p-6 mb-4">
                      <CalendarIcon className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-center text-muted-foreground mb-6 max-w-md">
                      Generate a personalized study plan based on the topics you want to focus on
                      and the time period that works for you.
                    </p>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button>Create New Plan</Button>
                      </SheetTrigger>
                      {/* Sheet content is same as above, but omitted for brevity */}
                    </Sheet>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{activePlan.title}</CardTitle>
                      <CardDescription>
                        {formatDate(activePlan.startDate)} to {formatDate(activePlan.endDate)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
                        <div className="space-y-6">
                          {activePlan.plan.map((day, dayIndex) => (
                            <div key={dayIndex} className="border-b pb-4 last:border-0">
                              <h3 className="font-medium text-lg mb-3">{day.day}</h3>
                              <div className="space-y-3">
                                {day.topics.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No tasks scheduled for this day
                                  </p>
                                ) : (
                                  day.topics.map((item, itemIndex) => (
                                    <div 
                                      key={itemIndex}
                                      className="flex p-3 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                      <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="font-medium">{getTopicName(item.topicId)}</p>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <Clock className="mr-1 h-4 w-4" />
                                          <span>{item.duration} hours</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {item.notes}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {allPlansLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !allPlans || allPlans.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Study Plans</CardTitle>
                    <CardDescription>
                      You haven't created any study plans yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-primary/10 p-6 mb-4">
                      <ClipboardList className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-center text-muted-foreground mb-6 max-w-md">
                      Create your first study plan to organize your UPSC preparation
                    </p>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button>Create First Plan</Button>
                      </SheetTrigger>
                      {/* Sheet content is same as above, but omitted for brevity */}
                    </Sheet>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allPlans.map((plan) => (
                    <Card key={plan.id}>
                      <CardHeader>
                        <CardTitle className="text-xl">{plan.title}</CardTitle>
                        <CardDescription>
                          {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">
                              {plan.plan.length} day{plan.plan.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">
                              {Array.from(
                                new Set(
                                  plan.plan.flatMap((day) => day.topics.map((t) => t.topicId))
                                )
                              ).length}{" "}
                              topic{Array.from(
                                new Set(
                                  plan.plan.flatMap((day) => day.topics.map((t) => t.topicId))
                                )
                              ).length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">
                              {plan.plan.reduce(
                                (total, day) => 
                                  total + day.topics.reduce(
                                    (dayTotal, topic) => dayTotal + topic.duration, 0
                                  ), 0
                              )}{" "}
                              total hours
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            const event = new CustomEvent("view-plan", {
                              detail: { plan },
                            });
                            window.dispatchEvent(event);
                            document.querySelector('[data-value="active"]')?.dispatchEvent(
                              new MouseEvent('click', { bubbles: true })
                            );
                          }}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
