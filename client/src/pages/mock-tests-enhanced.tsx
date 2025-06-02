import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Play,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  CheckCircle,
  Circle,
  Bookmark,
  Send,
  X,
  XCircle,
  AlertCircle,
  Target,
  Brain,
  BookMarked,
  Timer,
  TrendingUp,
  BarChart3,
  Trophy,
  AlertTriangle,
} from "lucide-react";

type MockTest = {
  id: number;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subjects: string[];
  questions: Question[];
  createdAt: string;
};

type Question = {
  id: number;
  question: {
    english: string;
    hindi: string;
  };
  options: {
    english: string[];
    hindi: string[];
  };
  correctAnswer: string;
  subject: string;
  topic: string;
  difficulty: string;
  explanation?: {
    english: string;
    hindi: string;
  };
};

type TestEvaluation = {
  summary: {
    totalQuestions: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    attempted: number;
    overallScore: number;
    accuracy: number;
    timeSpent: number;
  };
  advancedScores: {
    criticalThinkingScore: number;
    knowledgeRetentionScore: number;
    conceptClarityScore: number;
    timeManagementScore: number;
  };
  subjectAnalysis: Record<string, {
    correct: number;
    total: number;
    attempted: number;
  }>;
  questionAnalysis: Array<{
    questionIndex: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isAttempted: boolean;
    timeSpent: number;
    timeCategory: string;
    subject: string;
    topic: string;
    difficulty: string;
  }>;
  timeAnalysis: {
    superfast: number;
    onTime: number;
    slow: number;
    onTimeIncorrect: number;
  };
  recommendations: string[];
};

export default function MockTestsEnhanced() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [questionTimings, setQuestionTimings] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationData, setEvaluationData] = useState<TestEvaluation | null>(null);

  // Fetch mock tests
  const { data: mockTests = [], isLoading } = useQuery<MockTest[]>({
    queryKey: ["/api/mock-tests"],
    queryFn: async () => {
      const response = await fetch("/api/mock-tests");
      if (!response.ok) throw new Error("Failed to fetch mock tests");
      return response.json();
    },
  });

  // Evaluation mutation
  const evaluateMutation = useMutation({
    mutationFn: async ({ testId, answers, timeSpent, questionTimings }: {
      testId: number;
      answers: any[];
      timeSpent: number;
      questionTimings: number[];
    }) => {
      const response = await apiRequest("POST", `/api/mock-tests/${testId}/evaluate`, {
        answers,
        timeSpent,
        questionTimings
      });
      return response.json();
    },
    onSuccess: (data: TestEvaluation) => {
      setEvaluationData(data);
      setShowEvaluation(true);
    }
  });

  // Timer effect
  useEffect(() => {
    if (isFullscreen && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isFullscreen, timeRemaining]);

  // Question timing tracking
  useEffect(() => {
    if (questionStartTime) {
      const timer = setTimeout(() => {
        const timeSpent = Date.now() - questionStartTime.getTime();
        setQuestionTimings(prev => {
          const newTimings = [...prev];
          newTimings[currentQuestionIndex] = timeSpent / 1000;
          return newTimings;
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, questionStartTime]);

  const startTest = (test: MockTest) => {
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setBookmarkedQuestions(new Set());
    setTestStartTime(new Date());
    setQuestionStartTime(new Date());
    setQuestionTimings(new Array(test.questions.length).fill(0));
    setTimeRemaining(test.duration * 60);
    setIsFullscreen(true);
    
    // Enter fullscreen mode
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    setActiveTest(null);
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleQuestionNavigation = (index: number) => {
    if (questionStartTime) {
      const timeSpent = Date.now() - questionStartTime.getTime();
      setQuestionTimings(prev => {
        const newTimings = [...prev];
        newTimings[currentQuestionIndex] = timeSpent / 1000;
        return newTimings;
      });
    }
    setCurrentQuestionIndex(index);
    setQuestionStartTime(new Date());
  };

  const toggleBookmark = (questionIndex: number) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleSubmitTest = () => {
    if (!activeTest || !testStartTime) return;

    const totalTimeSpent = (Date.now() - testStartTime.getTime()) / 1000;
    const answersArray = activeTest.questions.map((_, index) => ({
      answer: answers[index] || undefined
    }));

    evaluateMutation.mutate({
      testId: activeTest.id,
      answers: answersArray,
      timeSpent: totalTimeSpent,
      questionTimings
    });

    exitFullscreen();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Fullscreen Test Interface
  if (isFullscreen && activeTest) {
    const currentQuestion = activeTest.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeTest.questions.length) * 100;
    const answeredQuestions = Object.keys(answers).length;

    return (
      <div className="fixed inset-0 bg-background z-50 overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold">{activeTest.title}</h1>
              <Badge variant="outline">{selectedLanguage}</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 300 ? "text-red-600 font-bold" : ""}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'hindi' : 'english')}
              >
                {selectedLanguage === 'english' ? 'हिंदी' : 'English'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Exit Test?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to exit? Your progress will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continue Test</AlertDialogCancel>
                    <AlertDialogAction onClick={exitFullscreen}>Exit</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentQuestionIndex + 1} of {activeTest.questions.length}</span>
              <span>{answeredQuestions} Answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="flex h-[calc(100vh-120px)]">
          {/* Question Panel */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge variant="secondary">{currentQuestion.subject}</Badge>
                    <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(currentQuestionIndex)}
                      className={bookmarkedQuestions.has(currentQuestionIndex) ? "text-yellow-600" : ""}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h2 className="text-xl font-medium mb-6 leading-relaxed">
                    {currentQuestion.question[selectedLanguage]}
                  </h2>
                </div>
              </div>

              <RadioGroup
                value={answers[currentQuestionIndex] || ""}
                onValueChange={handleAnswerSelect}
                className="space-y-4"
              >
                {currentQuestion.options[selectedLanguage].map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Navigation Panel */}
          <div className="w-80 border-l bg-muted/30 p-4 overflow-auto">
            <div className="space-y-4">
              <h3 className="font-medium">Question Navigation</h3>
              
              <div className="grid grid-cols-5 gap-2">
                {activeTest.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === currentQuestionIndex ? "default" : answers[index] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-10 ${bookmarkedQuestions.has(index) ? "ring-2 ring-yellow-500" : ""}`}
                    onClick={() => handleQuestionNavigation(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-secondary rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-yellow-500 rounded"></div>
                  <span>Bookmarked</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t bg-background p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => handleQuestionNavigation(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="px-8">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Test
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {answeredQuestions} out of {activeTest.questions.length} questions.
                    Are you sure you want to submit?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Review Answers</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmitTest}>Submit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              onClick={() => handleQuestionNavigation(Math.min(activeTest.questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === activeTest.questions.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Evaluation Results Dialog
  if (showEvaluation && evaluationData) {
    return (
      <Dialog open={showEvaluation} onOpenChange={setShowEvaluation}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <span>Test Results - {activeTest?.title}</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive analysis of your performance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overall Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{evaluationData.summary.correct}</div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{evaluationData.summary.incorrect}</div>
                    <div className="text-sm text-muted-foreground">Incorrect</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{evaluationData.summary.unattempted}</div>
                    <div className="text-sm text-muted-foreground">Unattempted</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{evaluationData.summary.overallScore}%</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <span>Critical Thinking</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(evaluationData.advancedScores.criticalThinkingScore)}`}>
                        {evaluationData.advancedScores.criticalThinkingScore}%
                      </span>
                    </div>
                    <Progress value={evaluationData.advancedScores.criticalThinkingScore} className="h-2" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookMarked className="h-5 w-5 text-blue-600" />
                        <span>Knowledge Retention</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(evaluationData.advancedScores.knowledgeRetentionScore)}`}>
                        {evaluationData.advancedScores.knowledgeRetentionScore}%
                      </span>
                    </div>
                    <Progress value={evaluationData.advancedScores.knowledgeRetentionScore} className="h-2" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <span>Concept Clarity</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(evaluationData.advancedScores.conceptClarityScore)}`}>
                        {evaluationData.advancedScores.conceptClarityScore}%
                      </span>
                    </div>
                    <Progress value={evaluationData.advancedScores.conceptClarityScore} className="h-2" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-5 w-5 text-orange-600" />
                        <span>Time Management</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(evaluationData.advancedScores.timeManagementScore)}`}>
                        {evaluationData.advancedScores.timeManagementScore}%
                      </span>
                    </div>
                    <Progress value={evaluationData.advancedScores.timeManagementScore} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(evaluationData.subjectAnalysis).map(([subject, data]) => (
                    <div key={subject} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subject}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.correct}/{data.total} ({Math.round((data.correct / data.total) * 100)}%)
                        </span>
                      </div>
                      <Progress value={(data.correct / data.total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>AI-Powered Recommendations</span>
                  {evaluationData.pdfReportAvailable && (
                    <Badge variant="secondary" className="ml-auto">
                      Enhanced Analysis
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Strengths */}
                  {evaluationData.strengths && evaluationData.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Your Strengths</h4>
                      <ul className="space-y-1">
                        {evaluationData.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Check className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {evaluationData.weaknesses && evaluationData.weaknesses.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {evaluationData.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                            <span className="text-sm">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Personalized Recommendations */}
                  {evaluationData.recommendations && evaluationData.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Personalized Study Plan</h4>
                      <ul className="space-y-2">
                        {evaluationData.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <span className="text-sm">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topic Analysis */}
            {evaluationData.topicAnalysis && evaluationData.topicAnalysis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Topic-wise Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {evaluationData.topicAnalysis
                      .filter(topic => topic.needsImprovement)
                      .slice(0, 5)
                      .map((topic, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <span className="font-medium">{topic.topic}</span>
                            <p className="text-sm text-muted-foreground">{topic.subject}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-red-600">
                              {topic.accuracy}% accuracy
                            </span>
                            <p className="text-xs text-muted-foreground">Needs focus</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div>
              {evaluationData.pdfReportAvailable && evaluationData.reportDownloadUrl && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(evaluationData.reportDownloadUrl, '_blank')}
                  className="mr-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Detailed Report (PDF)
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowEvaluation(false)}>
                Close
              </Button>
              <Button onClick={() => window.location.reload()}>
                Take Another Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main Mock Tests Interface
  return (
    <div className="min-h-screen bg-background">
      <Header 
        onMobileMenuToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileMenuOpen={isMobileNavOpen}
      />
      
      <div className="flex">
        <Sidebar className="hidden lg:block" />
        <MobileNav 
          isOpen={isMobileNavOpen} 
          onClose={() => setIsMobileNavOpen(false)} 
        />
        
        <main className="flex-1 lg:pl-64">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Mock Tests</h1>
                <p className="text-muted-foreground">Practice with comprehensive mock tests</p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTests.map((test) => (
                  <Card key={test.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{test.title}</span>
                        <Badge variant={test.difficulty === 'hard' ? 'destructive' : test.difficulty === 'medium' ? 'default' : 'secondary'}>
                          {test.difficulty}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{test.duration} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Circle className="h-4 w-4" />
                            <span>{test.totalQuestions} questions</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {test.subjects.map((subject) => (
                            <Badge key={subject} variant="outline" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button 
                          className="w-full" 
                          onClick={() => startTest(test)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}