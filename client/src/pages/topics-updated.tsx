import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  BookOpen,
  FileText,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type Subject = {
  id: number;
  name: string;
  description: string;
  category: string;
};

type Section = {
  id: number;
  subject_id: number;
  name: string;
  description?: string;
  subject_name?: string;
};

type Topic = {
  id: number;
  section_id: number;
  name: string;
  description?: string;
  status: string;
  section_name?: string;
  subject_id?: number;
  subject_name?: string;
};

export default function Topics() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Fetch all subjects
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch sections for selected subject
  const { data: sections, isLoading: isLoadingSections } = useQuery<Section[]>({
    queryKey: ["/api/sections/subject", selectedSubject],
    enabled: !!selectedSubject,
  });

  // Fetch all topics to organize by sections
  const { data: allTopics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  const handleStartQuiz = async (params: { subjectId?: number; sectionId?: number; topicId?: number; difficulty?: string }) => {
    try {
      const response = await apiRequest("POST", "/api/quizzes/generate", params);
      navigate("/quiz");
    } catch (error) {
      console.error("Failed to start quiz:", error);
    }
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      not_started: "bg-gray-100 text-gray-800",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.not_started}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const renderSubjectCard = (subject: Subject) => (
    <Card 
      key={subject.id} 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedSubject(subject.id)}
    >
      <CardHeader className="pb-3 relative">
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-muted/30 px-2 py-1 text-xs">
            {subject.category}
          </Badge>
        </div>
        <CardTitle className="pr-16">{subject.name}</CardTitle>
        <CardDescription>UPSC Preparation</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{subject.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Progress</span>
            <span className="font-medium">0%</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 pt-3 flex flex-col gap-2">
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
            <FileText className="h-4 w-4 mr-2" /> View Sections
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleStartQuiz({ subjectId: subject.id, difficulty: 'medium' });
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" /> Subject Quiz
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderSectionCard = (section: Section) => {
    const sectionTopics = allTopics?.filter(topic => topic.section_id === section.id) || [];
    const isExpanded = expandedSections.has(section.id);

    return (
      <Card key={section.id} className="overflow-hidden">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection(section.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <div>
                <CardTitle className="text-lg">{section.name}</CardTitle>
                <CardDescription>{sectionTopics.length} topics</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartQuiz({ sectionId: section.id, difficulty: 'medium' });
                }}
              >
                <BookOpen className="h-4 w-4 mr-2" /> Section Quiz
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
              {sectionTopics.map((topic) => (
                <div 
                  key={topic.id} 
                  className="flex flex-col p-3 border rounded-lg hover:bg-muted/50 shadow-sm transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStatusIcon(topic.status || 'not_started')}
                      <span className="ml-2 font-medium text-sm">{topic.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs px-2">
                      Topic
                    </Badge>
                  </div>
                  
                  {topic.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {topic.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between mt-auto gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      className="flex-1"
                      onClick={() => handleStartQuiz({ topicId: topic.id, difficulty: 'medium' })}
                    >
                      <span className="text-xs">Take Quiz</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleStartQuiz({ topicId: topic.id, difficulty: 'easy' })}
                        className="px-2"
                      >
                        <span className="text-xs">Easy</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleStartQuiz({ topicId: topic.id, difficulty: 'hard' })}
                        className="px-2"
                      >
                        <span className="text-xs">Hard</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  // Filter subjects based on search
  const filteredSubjects = subjects?.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <MobileNav />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">UPSC Topics</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore comprehensive UPSC curriculum organized by subjects and sections
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {(isLoadingSubjects || isLoadingTopics) && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Subjects View */}
            {!selectedSubject && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map(renderSubjectCard)}
              </div>
            )}

            {/* Sections View */}
            {selectedSubject && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedSubject(null)}
                  >
                    ← Back to Subjects
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {subjects?.find(s => s.id === selectedSubject)?.name}
                    </h2>
                    <p className="text-muted-foreground">
                      {sections?.length || 0} sections available
                    </p>
                  </div>
                </div>

                {isLoadingSections ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections?.map(renderSectionCard)}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}