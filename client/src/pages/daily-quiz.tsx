import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Calendar,
  FileText,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  BookOpen,
  MessageSquare,
} from "lucide-react";

// Start date: May 28, 2025
const START_DATE = new Date(2025, 4, 28); // Month is 0-indexed, so 4 = May

// Generate tabs for 365 days (1 year)
const generateDayTabs = (numberOfDays: number = 365) => {
  const tabs = [];
  for (let i = 0; i < numberOfDays; i++) {
    const currentDate = addDays(START_DATE, i);
    const dayNumber = i + 1;
    const formattedDate = format(currentDate, "MMM d");
    
    tabs.push({
      value: `day-${dayNumber}`,
      label: `Day ${dayNumber} | ${formattedDate}`,
      dayNumber,
      date: currentDate,
      formattedDate,
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
};

export default function DailyQuiz() {
  const dayTabs = generateDayTabs();
  const [selectedDay, setSelectedDay] = useState("day-1");
  const [feedback, setFeedback] = useState("");
  const [uploadedAnswer, setUploadedAnswer] = useState<File | null>(null);

  // Mock data for demonstration - in real app, this would come from API
  const getDailyQuizData = (dayNumber: number): DailyQuizData => {
    return {
      dayNumber,
      date: addDays(START_DATE, dayNumber - 1),
      description: `Daily practice quiz covering key UPSC topics for comprehensive preparation. Focus on accuracy and time management.`,
      relevantSections: ["Indian Polity", "Modern History", "Geography"],
      questionPaperUrl: null, // Would be set by admin
      studentAnswerUrl: null,
      feedback: "",
      evaluatedAnswerUrl: null,
      evaluationReport: null,
      status: 'not_started'
    };
  };

  const currentDayNumber = parseInt(selectedDay.split('-')[1]);
  const currentQuizData = getDailyQuizData(currentDayNumber);

  const handleAnswerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedAnswer(file);
      // In real app, upload file to server
      console.log("Uploading answer:", file.name);
    }
  };

  const handleFeedbackSubmit = () => {
    // In real app, submit feedback to server
    console.log("Submitting feedback:", feedback);
    setFeedback("");
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "evaluated":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "submitted":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "attempted":
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
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
                Structured daily practice for UPSC preparation. Complete daily quizzes to track your progress and improve your knowledge.
              </p>
            </div>

            {/* Daily Quiz Tabs */}
            <div className="space-y-6">
              <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
                {/* Horizontal Scrollable Tab Bar */}
                <div className="relative">
                  <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full overflow-x-auto">
                    <div className="flex space-x-1 min-w-max px-2">
                      {dayTabs.slice(0, 30).map((tab) => ( // Show first 30 days for performance
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm min-w-max"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>
                </div>

                {/* Tab Content */}
                {dayTabs.slice(0, 30).map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-6">
                    <div className="space-y-6">
                      {/* Day Header */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(currentQuizData.status)}
                              <div>
                                <CardTitle className="text-2xl">
                                  Day {tab.dayNumber}
                                </CardTitle>
                                <CardDescription className="text-lg">
                                  {format(tab.date, "EEEE, MMMM d, yyyy")}
                                </CardDescription>
                              </div>
                            </div>
                            {getStatusBadge(currentQuizData.status)}
                          </div>
                        </CardHeader>
                      </Card>

                      {/* Description and Relevant Sections */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span>Description</span>
                          </CardTitle>
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