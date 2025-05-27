import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, differenceInDays, startOfDay } from "date-fns";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarIcon, 
  BookOpen, 
  Clock, 
  Plus,
  ClipboardList,
  Target,
  CheckCircle,
  Calendar,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Subject = {
  id: number;
  name: string;
  description: string;
};

type Section = {
  id: number;
  subject_id: number;
  name: string;
  description?: string;
};

type Topic = {
  id: number;
  section_id: number;
  name: string;
  description?: string;
  subject_name?: string;
  section_name?: string;
};

type StudyPlanDay = {
  date: Date;
  dayNumber: number;
  topics: Topic[];
  completed: boolean;
};

export default function EnhancedStudyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlanDay[]>([]);
  const [planTitle, setPlanTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  // Fetch data
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: sections = [] } = useQuery<Section[]>({
    queryKey: ["/api/sections"],
  });

  const { data: allTopics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  // Enhanced topics with parent information
  const enhancedTopics = allTopics.map(topic => {
    const section = sections.find(s => s.id === topic.section_id);
    const subject = subjects.find(s => s.id === section?.subject_id);
    return {
      ...topic,
      subject_name: subject?.name,
      section_name: section?.name,
    };
  });

  const getSubjectSections = (subjectId: number) => {
    return sections.filter(section => section.subject_id === subjectId);
  };

  const getSectionTopics = (sectionId: number) => {
    return enhancedTopics.filter(topic => topic.section_id === sectionId);
  };

  const handleTopicSelect = (topicId: number, checked: boolean) => {
    if (checked) {
      setSelectedTopics(prev => [...prev, topicId]);
    } else {
      setSelectedTopics(prev => prev.filter(id => id !== topicId));
    }
  };

  const generateStudyPlan = async () => {
    if (!startDate || !endDate || selectedTopics.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select topics and set both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = differenceInDays(end, start) + 1;

    if (totalDays <= 0) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Distribute topics across available days
    const selectedTopicData = enhancedTopics.filter(topic => selectedTopics.includes(topic.id));
    const topicsPerDay = Math.ceil(selectedTopicData.length / totalDays);
    
    const plan: StudyPlanDay[] = [];
    let topicIndex = 0;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(start, i);
      const dayTopics = selectedTopicData.slice(topicIndex, topicIndex + topicsPerDay);
      
      plan.push({
        date: currentDate,
        dayNumber: i + 1,
        topics: dayTopics,
        completed: false,
      });
      
      topicIndex += topicsPerDay;
    }

    setGeneratedPlan(plan);
    setShowPlan(true);
    setIsGenerating(false);
    
    toast({
      title: "Study Plan Generated!",
      description: `Created a ${totalDays}-day plan with ${selectedTopicData.length} topics.`,
    });
  };

  const savePlan = async () => {
    if (!planTitle.trim()) {
      toast({
        title: "Plan Title Required",
        description: "Please enter a title for your study plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/study-plans", {
        title: planTitle,
        description: `Study plan covering ${selectedTopics.length} topics over ${generatedPlan.length} days`,
        startDate,
        endDate,
        topics: selectedTopics,
        schedule: generatedPlan,
      });

      toast({
        title: "Study Plan Saved!",
        description: "Your personalized study plan has been created successfully.",
      });

      // Reset form
      setSelectedTopics([]);
      setStartDate("");
      setEndDate("");
      setPlanTitle("");
      setShowPlan(false);
      setGeneratedPlan([]);
      
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save study plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (showPlan && generatedPlan.length > 0) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <MobileNav />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Your Study Plan</h1>
                  <p className="text-muted-foreground">
                    {generatedPlan.length} days • {selectedTopics.length} topics
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Input
                    placeholder="Enter plan title..."
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={savePlan} disabled={!planTitle.trim()}>
                    Save Plan
                  </Button>
                  <Button variant="outline" onClick={() => setShowPlan(false)}>
                    Edit Selection
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {generatedPlan.map((day, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                            {day.dayNumber}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              Day {day.dayNumber}
                            </CardTitle>
                            <CardDescription>
                              {format(day.date, "EEEE, MMMM d, yyyy")}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {day.topics.length} topics
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {day.topics.map((topic) => (
                          <div key={topic.id} className="p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm">{topic.name}</h4>
                              <Checkbox />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {topic.subject_name} • {topic.section_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <MobileNav />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Create Study Plan</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Build a personalized study schedule based on your selected topics and timeline.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Topic Selection */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>Select Topics</span>
                    </CardTitle>
                    <CardDescription>
                      Choose the topics you want to include in your study plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subjectsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {subjects.map((subject) => {
                            const subjectSections = getSubjectSections(subject.id);
                            
                            return (
                              <div key={subject.id} className="space-y-2">
                                <h3 className="font-semibold text-lg flex items-center space-x-2">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                  <span>{subject.name}</span>
                                </h3>
                                
                                {subjectSections.map((section) => {
                                  const sectionTopics = getSectionTopics(section.id);
                                  
                                  return (
                                    <div key={section.id} className="ml-6 space-y-2">
                                      <h4 className="font-medium text-base text-muted-foreground">
                                        {section.name}
                                      </h4>
                                      
                                      <div className="ml-4 space-y-1">
                                        {sectionTopics.map((topic) => (
                                          <div key={topic.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`topic-${topic.id}`}
                                              checked={selectedTopics.includes(topic.id)}
                                              onCheckedChange={(checked) => 
                                                handleTopicSelect(topic.id, checked as boolean)
                                              }
                                            />
                                            <Label 
                                              htmlFor={`topic-${topic.id}`} 
                                              className="text-sm cursor-pointer"
                                            >
                                              {topic.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Plan Configuration */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Timeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1"
                        min={startDate}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Plan Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Selected Topics:</span>
                        <span className="font-medium">{selectedTopics.length}</span>
                      </div>
                      
                      {startDate && endDate && (
                        <div className="flex justify-between text-sm">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {differenceInDays(new Date(endDate), new Date(startDate)) + 1} days
                          </span>
                        </div>
                      )}
                      
                      {startDate && endDate && selectedTopics.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Topics per day:</span>
                          <span className="font-medium">
                            ~{Math.ceil(selectedTopics.length / (differenceInDays(new Date(endDate), new Date(startDate)) + 1))}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={generateStudyPlan}
                      disabled={!startDate || !endDate || selectedTopics.length === 0 || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Generate Study Plan
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}