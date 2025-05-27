import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays } from "date-fns";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  FileText,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  BookOpen,
  MessageSquare,
  Settings,
  TrendingUp,
  Brain,
  Target,
  BarChart3,
  Lightbulb,
  Edit,
  Save,
  X,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Start date: May 28, 2025
const START_DATE = new Date(2025, 4, 28); // Month is 0-indexed, so 4 = May

// Generate customizable quiz tabs
const generateQuizTabs = (numberOfDays: number = 50) => {
  const tabs = [];
  for (let i = 0; i < numberOfDays; i++) {
    const currentDate = addDays(START_DATE, i);
    const dayNumber = i + 1;
    
    // Admin can customize these labels - this would come from database
    const customLabel = `Day ${dayNumber}`; // Default format, admin can change
    
    tabs.push({
      value: `quiz-${dayNumber}`,
      label: customLabel,
      dayNumber,
      date: currentDate,
      isCustomized: false, // Flag to show if admin has customized this tab
    });
  }
  return tabs;
};

type DailyQuizData = {
  dayNumber: number;
  date: Date;
  description?: string;
  relevantSections?: string[];
  questionPaperUrl?: string | null;
  studentAnswerUrl?: string | null;
  feedback?: string;
  evaluatedAnswerUrl?: string | null;
  evaluationReport?: string | null;
  status: 'not_started' | 'attempted' | 'submitted' | 'evaluated';
  score?: number;
  timeSpent?: number;
  weakTopics?: string[];
  difficultyLevel?: 'easy' | 'medium' | 'hard';
};

type QuizPerformance = {
  quizNumber: number;
  score: number;
  timeSpent: number;
  date: string;
  status: string;
};

type WeakTopic = {
  topic: string;
  subject: string;
  accuracyRate: number;
  questionsAttempted: number;
  aiSuggestion: string;
};

export default function DailyQuiz() {
  const quizTabs = generateQuizTabs();
  const [selectedQuiz, setSelectedQuiz] = useState("quiz-1");
  const [feedback, setFeedback] = useState("");
  const [uploadedAnswer, setUploadedAnswer] = useState<File | null>(null);
  const [editingTab, setEditingTab] = useState<number | null>(null);
  const [newTabName, setNewTabName] = useState("");

  // Mock performance data for heatmap
  const mockPerformanceData: QuizPerformance[] = [
    { quizNumber: 1, score: 85, timeSpent: 45, date: "2025-05-28", status: "evaluated" },
    { quizNumber: 2, score: 72, timeSpent: 52, date: "2025-05-29", status: "evaluated" },
    { quizNumber: 3, score: 91, timeSpent: 38, date: "2025-05-30", status: "evaluated" },
    { quizNumber: 4, score: 78, timeSpent: 55, date: "2025-05-31", status: "evaluated" },
    { quizNumber: 5, score: 88, timeSpent: 42, date: "2025-06-01", status: "evaluated" },
  ];

  // Mock weak topics data
  const mockWeakTopics: WeakTopic[] = [
    {
      topic: "Indian Constitution",
      subject: "Polity",
      accuracyRate: 65,
      questionsAttempted: 23,
      aiSuggestion: "Focus on fundamental rights and directive principles. Practice more case studies."
    },
    {
      topic: "Modern History",
      subject: "History",
      accuracyRate: 58,
      questionsAttempted: 19,
      aiSuggestion: "Review freedom struggle timeline. Create visual mind maps for better retention."
    },
    {
      topic: "Geography - Climate",
      subject: "Geography",
      accuracyRate: 72,
      questionsAttempted: 15,
      aiSuggestion: "Study monsoon patterns and climate classification. Use diagrams for better understanding."
    }
  ];

  // Get quiz data
  const getDailyQuizData = (dayNumber: number): DailyQuizData => {
    const performanceData = mockPerformanceData.find(p => p.quizNumber === dayNumber);
    return {
      dayNumber,
      date: addDays(START_DATE, dayNumber - 1),
      description: `Daily practice quiz covering key UPSC topics for comprehensive preparation. Focus on accuracy and time management.`,
      relevantSections: ["Indian Polity", "Modern History", "Geography"],
      questionPaperUrl: null,
      studentAnswerUrl: null,
      feedback: "",
      evaluatedAnswerUrl: null,
      evaluationReport: null,
      status: performanceData ? 'evaluated' : 'not_started',
      score: performanceData?.score,
      timeSpent: performanceData?.timeSpent,
      weakTopics: ["Indian Constitution", "Modern History"],
      difficultyLevel: dayNumber <= 10 ? 'easy' : dayNumber <= 30 ? 'medium' : 'hard'
    };
  };

  const currentQuizNumber = parseInt(selectedQuiz.split('-')[1]);
  const currentQuizData = getDailyQuizData(currentQuizNumber);

  const handleAnswerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedAnswer(file);
      console.log("Uploading answer:", file.name);
    }
  };

  const handleFeedbackSubmit = () => {
    console.log("Submitting feedback:", feedback);
    setFeedback("");
  };

  const handleTabEdit = (dayNumber: number, currentLabel: string) => {
    setEditingTab(dayNumber);
    setNewTabName(currentLabel);
  };

  const handleTabSave = () => {
    // In real app, save to database
    console.log(`Saving tab ${editingTab} with name: ${newTabName}`);
    setEditingTab(null);
    setNewTabName("");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      not_started: { color: "bg-gray-100 text-gray-800", text: "Not Started" },
      attempted: { color: "bg-blue-100 text-blue-800", text: "Attempted" },
      submitted: { color: "bg-yellow-100 text-yellow-800", text: "Submitted" },
      evaluated: { color: "bg-green-100 text-green-800", text: "Evaluated" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.not_started;
    
    return (
      <Badge className={variant.color}>
        {variant.text}
      </Badge>
    );
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return "bg-green-100 text-green-800";
      case 'medium': return "bg-yellow-100 text-yellow-800";
      case 'hard': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
              <h1 className="text-3xl font-bold tracking-tight">Daily Quiz</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                AI-powered daily practice with performance analytics and personalized study recommendations.
              </p>
            </div>

            {/* Performance Analytics Dashboard */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Interactive Performance Heatmap */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Performance Heatmap</span>
                  </CardTitle>
                  <CardDescription>
                    Visual representation of your quiz performance over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 50 }, (_, i) => {
                      const performance = mockPerformanceData.find(p => p.quizNumber === i + 1);
                      const score = performance?.score || 0;
                      return (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded cursor-pointer transition-all hover:scale-110 flex items-center justify-center text-xs font-medium text-white ${
                            performance ? getPerformanceColor(score) : "bg-gray-200"
                          }`}
                          title={performance ? `Day ${i + 1}: ${score}%` : `Day ${i + 1}: Not attempted`}
                        >
                          {performance ? score : ""}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Low Performance</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                    </div>
                    <span>High Performance</span>
                  </div>
                </CardContent>
              </Card>

              {/* AI Weak Topic Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>AI Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {mockWeakTopics.slice(0, 2).map((topic, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{topic.topic}</h4>
                          <Badge variant="outline" className="text-xs">
                            {topic.accuracyRate}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {topic.aiSuggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    View All Suggestions
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Study Difficulty Progression */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Personalized Study Difficulty Progression</span>
                </CardTitle>
                <CardDescription>
                  AI-adapted difficulty based on your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Current Level</span>
                      <span className="font-medium">Intermediate</span>
                    </div>
                    <Progress value={65} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Beginner</span>
                      <span>Advanced</span>
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(currentQuizData.difficultyLevel || 'medium')}>
                    {(currentQuizData.difficultyLevel || 'medium').charAt(0).toUpperCase() + (currentQuizData.difficultyLevel || 'medium').slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Daily Quiz Tabs */}
            <div className="space-y-6">
              <Tabs value={selectedQuiz} onValueChange={setSelectedQuiz} className="w-full">
                {/* Horizontal Scrollable Tab Bar */}
                <div className="relative">
                  <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full overflow-x-auto">
                    <div className="flex space-x-1 min-w-max px-2">
                      {quizTabs.slice(0, 30).map((tab) => (
                        <div key={tab.value} className="flex items-center space-x-1">
                          <TabsTrigger
                            value={tab.value}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm min-w-max"
                          >
                            {editingTab === tab.dayNumber ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={newTabName}
                                  onChange={(e) => setNewTabName(e.target.value)}
                                  className="h-6 w-20 text-xs"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={handleTabSave}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => setEditingTab(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span>{tab.label}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTabEdit(tab.dayNumber, tab.label);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TabsTrigger>
                        </div>
                      ))}
                    </div>
                  </TabsList>
                </div>

                {/* Tab Content */}
                {quizTabs.slice(0, 30).map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-6">
                    <div className="space-y-6">
                      {/* Description and Relevant Sections */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                              <FileText className="h-5 w-5" />
                              <span>Quiz Information</span>
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(currentQuizData.status)}
                              <Badge className={getDifficultyColor(currentQuizData.difficultyLevel || 'medium')}>
                                {(currentQuizData.difficultyLevel || 'medium').charAt(0).toUpperCase() + (currentQuizData.difficultyLevel || 'medium').slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-muted-foreground">
                            {currentQuizData.description}
                          </p>
                          
                          <div>
                            <h4 className="font-medium mb-2">Relevant Sections:</h4>
                            <div className="flex flex-wrap gap-2">
                              {currentQuizData.relevantSections?.map((section, index) => (
                                <Badge key={index} variant="outline">
                                  {section}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Performance Stats */}
                          {currentQuizData.score && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {currentQuizData.score}%
                                </div>
                                <div className="text-sm text-muted-foreground">Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {currentQuizData.timeSpent}m
                                </div>
                                <div className="text-sm text-muted-foreground">Time Spent</div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Question Paper and Answer Upload */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Question Paper */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Eye className="h-5 w-5" />
                              <span>Question Paper</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {currentQuizData.questionPaperUrl ? (
                              <Button className="w-full" size="lg">
                                <FileText className="mr-2 h-4 w-4" />
                                View Question Paper
                              </Button>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                <p>Question paper will be uploaded by admin</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Upload Answers */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Upload className="h-5 w-5" />
                              <span>Upload Answer(s)</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleAnswerUpload}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                Upload handwritten images or PDFs (Max 10MB)
                              </p>
                            </div>
                            
                            {uploadedAnswer && (
                              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{uploadedAnswer.name}</span>
                                <Badge variant="outline">Uploaded</Badge>
                              </div>
                            )}
                            
                            <Button className="w-full" disabled={!uploadedAnswer}>
                              <Upload className="mr-2 h-4 w-4" />
                              Submit Answers
                            </Button>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Feedback */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <MessageSquare className="h-5 w-5" />
                            <span>Daily Feedback</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Textarea
                            placeholder="Share your experience, difficulties faced, or any observations about today's quiz..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                          />
                          <Button onClick={handleFeedbackSubmit} disabled={!feedback.trim()}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Submit Feedback
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Evaluated Answers */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5" />
                            <span>Evaluated Answers</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {currentQuizData.evaluatedAnswerUrl ? (
                            <div className="space-y-4">
                              <Button className="w-full" variant="outline">
                                <Eye className="mr-2 h-4 w-4" />
                                View Evaluated Answer Sheet
                              </Button>
                              
                              {currentQuizData.evaluationReport && (
                                <div className="p-4 bg-muted rounded-lg">
                                  <h4 className="font-medium mb-2">Evaluation Report</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {currentQuizData.evaluationReport}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <CheckCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
                              <p>Evaluated answers will appear here after admin review</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}