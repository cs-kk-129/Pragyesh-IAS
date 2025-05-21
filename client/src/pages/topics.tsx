import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, FileText, Search, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Subject, Topic, Subtopic } from "@shared/schema";

type TopicWithStatus = Topic & {
  progress?: number;
  subtopics?: Subtopic[];
};

export default function Topics() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  
  // Fetch all subjects
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch topics for selected subject
  const { data: topics, isLoading: isLoadingTopics } = useQuery<TopicWithStatus[]>({
    queryKey: ["/api/topics", selectedSubject],
    enabled: !!selectedSubject,
  });

  // Fetch all topics when no subject is selected
  const { data: allTopics, isLoading: isLoadingAllTopics } = useQuery<TopicWithStatus[]>({
    queryKey: ["/api/topics"],
    enabled: !selectedSubject,
  });

  const currentTopics = selectedSubject ? topics : allTopics;
  const isLoading = isLoadingSubjects || isLoadingTopics || isLoadingAllTopics;

  // Filter topics based on search query
  const filteredTopics = currentTopics
    ? currentTopics.filter(
        (topic) =>
          topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Start a comprehensive quiz on the selected subject
  const handleStartComprehensiveQuiz = async (subjectId: number) => {
    try {
      const res = await apiRequest("POST", "/api/quizzes/generate/comprehensive", { subjectId });
      const data = await res.json();
      navigate(`/quiz/${data.quiz.id}`);
    } catch (error) {
      console.error("Failed to generate comprehensive quiz:", error);
    }
  };

  // Start a unit quiz on the selected topic/subtopic
  const handleStartUnitQuiz = async (topicId: number, subtopicId?: number) => {
    try {
      const payload = subtopicId ? { subtopicId } : { topicId };
      const res = await apiRequest("POST", "/api/quizzes/generate", payload);
      const data = await res.json();
      navigate(`/quiz/${data.quiz.id}`);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Not Started";
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "completed" 
      ? "success" 
      : status === "in_progress" 
        ? "warning" 
        : "outline";
    
    return (
      <Badge variant={variant as any} className="ml-2">
        {getStatusIcon(status)}
        <span className="ml-1">{getStatusText(status)}</span>
      </Badge>
    );
  };

  const renderSubjectCard = (subject: Subject) => (
    <Card 
      key={subject.id} 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedSubject(subject.id)}
    >
      <CardHeader className="pb-3">
        <CardTitle>{subject.name}</CardTitle>
        <CardDescription>UPSC Preparation</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{subject.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Progress</span>
            <span className="font-medium">30%</span>
          </div>
          <Progress value={30} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 pt-3">
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSubject(subject.id);
            }}
          >
            <FileText className="h-4 w-4 mr-2" /> View Topics
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleStartComprehensiveQuiz(subject.id);
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" /> Comprehensive Quiz
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderTopicDetail = (topic: TopicWithStatus) => (
    <Card key={topic.id} className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{topic.name}</CardTitle>
            <CardDescription>
              {topic.status && getStatusBadge(topic.status)}
            </CardDescription>
          </div>
          <Button 
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleStartUnitQuiz(topic.id)}
          >
            <BookOpen className="h-4 w-4 mr-2" /> Take Comprehensive Quiz
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Progress</span>
            <span className="font-medium">{topic.progress || 0}%</span>
          </div>
          <Progress value={topic.progress || 0} className="h-2" />
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-4">Subtopics</h3>
          <div className="space-y-3">
            {topic.subtopics && topic.subtopics.length > 0 ? (
              topic.subtopics.map((subtopic) => (
                <div 
                  key={subtopic.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center">
                    {getStatusIcon(subtopic.status || 'not_started')}
                    <span className="ml-2 font-medium">{subtopic.name}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleStartUnitQuiz(topic.id, subtopic.id)}
                  >
                    <span>Take Quiz</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No subtopics available</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 pt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedSubject(null)}
        >
          Back to All Subjects
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedSubject ? 'Topics' : 'Subjects'}
            </h1>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={selectedSubject ? "Search topics..." : "Search subjects..."}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedSubject ? (
            <div>
              {filteredTopics && filteredTopics.length > 0 ? (
                filteredTopics.map(renderTopicDetail)
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `No topics found matching "${searchQuery}"` 
                      : "No topics available for this subject"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subjects && subjects.length > 0 ? (
                subjects
                  .filter(subject => 
                    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    subject.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(renderSubjectCard)
              ) : (
                <div className="text-center py-12 col-span-3">
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `No subjects found matching "${searchQuery}"` 
                      : "No subjects available"}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
