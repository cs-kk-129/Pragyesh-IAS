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
  AlertTriangle,
  Trophy,
} from "lucide-react";

type MockTest = {
  id: number;
  title: string;
  description: string;
  duration: number; // in minutes
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subjects: string[];
  isActive: boolean;
  isAttempted: boolean;
  score?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'evaluated';
  questions?: any[]; // Questions created by admin
  scheduledDate?: string;
};

type Question = {
  id: number;
  question: string;
  questionHindi?: string;
  options: string[];
  optionsHindi?: string[];
  correctAnswer: number;
  marks: number;
  subject: string;
  topic: string;
};

type QuestionState = {
  selectedAnswer?: number;
  isAnswered: boolean;
  isMarkedForReview: boolean;
  isVisited: boolean;
};

export default function MockTests() {
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [selectedTestData, setSelectedTestData] = useState<MockTest | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);

  // Fetch mock tests created by admin from API (database-driven)
  const { data: mockTests = [], isLoading: isLoadingTests } = useQuery<MockTest[]>({
    queryKey: ["/api/student/mock-tests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/student/mock-tests");
      return response.json();
    },
  });

  // Initialize selectedTest when mockTests load
  useEffect(() => {
    if (mockTests.length > 0 && !selectedTest) {
      setSelectedTest(`test-${mockTests[0].id}`);
    }
  }, [mockTests, selectedTest]);

  // Update selectedTestData when selectedTest changes
  useEffect(() => {
    if (selectedTest && mockTests.length > 0) {
      const testId = parseInt(selectedTest.replace('test-', ''));
      const test = mockTests.find(t => t.id === testId);
      if (test) {
        setSelectedTestData(test);
      }
    }
  }, [selectedTest, mockTests]);

  // Show loading state
  if (isLoadingTests) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <MobileNav />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
                <p className="text-muted-foreground">Loading mock tests...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show empty state if no mock tests available
  if (!isLoadingTests && mockTests.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <MobileNav />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Mock Tests Available</h3>
                      <p className="text-muted-foreground">
                        No mock tests are currently scheduled or available for you to attempt.
                        Please check back later or contact your administrator.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Get questions from selected test
  const getCurrentTestQuestions = (): Question[] => {
    if (!selectedTestData?.questions) {
      return [];
    }

    // Transform admin questions to match Question interface
    return selectedTestData.questions.map((q: any, index: number) => {
      let questionText = "";
      let questionHindi = "";
      let options: string[] = [];
      let optionsHindi: string[] = [];
      let correctAnswerIndex = 0;

      try {
        // Handle question text
        if (typeof q.question === 'object') {
          questionText = q.question.english || "";
          questionHindi = q.question.hindi || "";
        } else {
          questionText = q.question || "";
          questionHindi = q.questionHindi || "";
        }

        // Handle options
        if (typeof q.options === 'object' && q.options.english) {
          options = Array.isArray(q.options.english) ? q.options.english : [];
          optionsHindi = Array.isArray(q.options.hindi) ? q.options.hindi : options;
        } else if (Array.isArray(q.options)) {
          options = q.options;
          optionsHindi = q.optionsHindi || options;
        }

        // Handle correct answer - find the index of the correct answer
        let correctAnswerText = "";
        if (typeof q.correctAnswer === 'object') {
          correctAnswerText = q.correctAnswer.english || "";
        } else {
          correctAnswerText = q.correctAnswer || "";
        }

        // Find the index of the correct answer in the options array
        correctAnswerIndex = options.findIndex(option => option === correctAnswerText);
        if (correctAnswerIndex === -1) {
          // If exact match not found, try partial match
          correctAnswerIndex = options.findIndex(option => 
            option.toLowerCase().includes(correctAnswerText.toLowerCase()) ||
            correctAnswerText.toLowerCase().includes(option.toLowerCase())
          );
        }
        // Default to 0 if still not found
        if (correctAnswerIndex === -1) {
          correctAnswerIndex = 0;
        }

      } catch (error) {
        console.error('Error parsing question data:', error, q);
        // Fallback values
        questionText = "Error loading question";
        options = ["Option A", "Option B", "Option C", "Option D"];
        correctAnswerIndex = 0;
      }

      return {
        id: index + 1,
        question: questionText,
        questionHindi: questionHindi,
        options: options,
        optionsHindi: optionsHindi,
        correctAnswer: correctAnswerIndex,
        marks: q.marks || 2,
        subject: q.subject || "General",
        topic: q.topic || "Mixed",
      };
    });
  };

  const mockQuestions = getCurrentTestQuestions();

  // Initialize question states when test starts
  useEffect(() => {
    if (isTestStarted && mockQuestions.length > 0) {
      setQuestionStates(
        mockQuestions.map(() => ({
          selectedAnswer: undefined,
          isAnswered: false,
          isMarkedForReview: false,
          isVisited: false,
        }))
      );
    }
  }, [isTestStarted, mockQuestions.length]);

  // Timer effect
  useEffect(() => {
    if (isTestStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTestSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isTestStarted, timeLeft]);

  // Mark question as visited when navigating
  useEffect(() => {
    if (isTestStarted && questionStates.length > 0) {
      setQuestionStates(prev => 
        prev.map((state, index) => 
          index === currentQuestionIndex 
            ? { ...state, isVisited: true }
            : state
        )
      );
    }
  }, [currentQuestionIndex, isTestStarted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = (test: MockTest) => {
    setSelectedTestData(test);
    setShowLanguageDialog(true);
    setShowTestDialog(false);
  };

  const handleLanguageSelection = () => {
    if (selectedTestData) {
      setIsTestStarted(true);
      setTimeLeft(selectedTestData.duration * 60); // Convert minutes to seconds
      setCurrentQuestionIndex(0);
      setShowLanguageDialog(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setQuestionStates(prev =>
      prev.map((state, index) =>
        index === currentQuestionIndex
          ? { ...state, selectedAnswer: answerIndex, isAnswered: true }
          : state
      )
    );
  };

  const handleMarkForReview = () => {
    setQuestionStates(prev =>
      prev.map((state, index) =>
        index === currentQuestionIndex
          ? { ...state, isMarkedForReview: !state.isMarkedForReview }
          : state
      )
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigate = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleTestSubmit = () => {
    setIsTestStarted(false);
    setIsTestCompleted(true);

    // Calculate results
    const answeredQuestions = questionStates.filter(state => state.isAnswered).length;
    const correctAnswers = questionStates.filter((state, index) => 
      state.isAnswered && state.selectedAnswer === mockQuestions[index]?.correctAnswer
    ).length;

    const results = {
      totalQuestions: mockQuestions.length,
      attempted: answeredQuestions,
      correct: correctAnswers,
      incorrect: answeredQuestions - correctAnswers,
      notAttempted: mockQuestions.length - answeredQuestions,
      score: Math.round((correctAnswers / mockQuestions.length) * 100),
      timeSpent: selectedTestData ? (selectedTestData.duration * 60 - timeLeft) : 0,
    };

    setTestResults(results);
    setShowSubmitDialog(false);
  };

  const getQuestionStatusIcon = (index: number) => {
    const state = questionStates[index];
    if (!state) return <Circle className="h-4 w-4 text-gray-400" />;

    if (state.isAnswered && state.isMarkedForReview) {
      return <CheckCircle className="h-4 w-4 text-purple-500" />;
    } else if (state.isAnswered) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (state.isMarkedForReview) {
      return <Bookmark className="h-4 w-4 text-yellow-500" />;
    } else if (state.isVisited) {
      return <Circle className="h-4 w-4 text-red-500" />;
    } else {
      return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getQuestionStatusColor = (index: number) => {
    const state = questionStates[index];
    if (!state) return "bg-gray-100";

    if (state.isAnswered && state.isMarkedForReview) {
      return "bg-purple-100 border-purple-300";
    } else if (state.isAnswered) {
      return "bg-green-100 border-green-300";
    } else if (state.isMarkedForReview) {
      return "bg-yellow-100 border-yellow-300";
    } else if (state.isVisited) {
      return "bg-red-100 border-red-300";
    } else {
      return "bg-gray-100 border-gray-300";
    }
  };

  const getDifficultyBadge = (difficulty: string | undefined) => {
    const variants = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };
    return variants[(difficulty || 'medium') as keyof typeof variants] || variants.medium;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      not_started: { color: "bg-gray-100 text-gray-800", text: "Not Started" },
      in_progress: { color: "bg-blue-100 text-blue-800", text: "In Progress" },
      completed: { color: "bg-yellow-100 text-yellow-800", text: "Completed" },
      evaluated: { color: "bg-green-100 text-green-800", text: "Evaluated" },
    };

    const variant = variants[status as keyof typeof variants] || variants.not_started;
    return <Badge className={variant.color}>{variant.text}</Badge>;
  };

  if (isTestStarted) {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const currentState = questionStates[currentQuestionIndex];

    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          {/* Test Header */}
          <header className="sticky top-0 z-40 border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold">{selectedTestData?.title}</h1>
                <Badge className={getDifficultyBadge(selectedTestData?.difficulty)}>
                  {(selectedTestData?.difficulty || 'medium').charAt(0).toUpperCase() + (selectedTestData?.difficulty || 'medium').slice(1)}
                </Badge>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  <span className="text-lg font-mono font-bold text-red-500">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Send className="mr-2 h-4 w-4" />
                      Submit Test
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit Test</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to submit the test? This action cannot be undone.
                        You have {questionStates.filter(s => s.isAnswered).length} answered out of {mockQuestions.length} questions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleTestSubmit}>
                        Submit Test
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </header>

          <div className="flex flex-1">
            {/* Question Panel */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-medium">
                      Question {currentQuestionIndex + 1} of {mockQuestions.length}
                    </span>
                    <Badge variant="outline">{currentQuestion?.subject}</Badge>
                    <Badge variant="outline">{currentQuestion?.marks} marks</Badge>
                  </div>

                  <Button
                    variant={currentState?.isMarkedForReview ? "default" : "outline"}
                    onClick={handleMarkForReview}
                  >
                    <BookmarkPlus className="mr-2 h-4 w-4" />
                    {currentState?.isMarkedForReview ? "Marked" : "Mark for Review"}
                  </Button>
                </div>

                {/* Question Content */}
                <Card>
                  <CardContent className="pt-6">
                    {/* Language toggle */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Language:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'hindi' : 'english')}
                        >
                          {selectedLanguage === 'english' ? 'हिन्दी' : 'English'}
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium mb-6">
                      {selectedLanguage === 'english' 
                        ? currentQuestion?.question 
                        : currentQuestion?.questionHindi || currentQuestion?.question
                      }
                    </h3>

                    <RadioGroup
                      value={currentState?.selectedAnswer?.toString()}
                      onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                    >
                      {(selectedLanguage === 'english' 
                        ? currentQuestion?.options 
                        : currentQuestion?.optionsHindi || currentQuestion?.options
                      )?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded border hover:bg-muted/50">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label 
                            htmlFor={`option-${index}`} 
                            className="flex-1 cursor-pointer"
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === mockQuestions.length - 1}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Question Navigator */}
            <div className="w-80 border-l bg-muted/20 p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Question Navigator</h3>

                {/* Legend */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Circle className="h-4 w-4 text-red-500" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bookmark className="h-4 w-4 text-yellow-500" />
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <span>Answered & Marked</span>
                  </div>
                </div>

                {/* Question Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {mockQuestions.map((_, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={`${getQuestionStatusColor(index)} ${
                        currentQuestionIndex === index ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleQuestionNavigate(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>

                {/* Summary */}
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-medium text-green-600">
                      {questionStates.filter(s => s.isAnswered).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Not Answered:</span>
                    <span className="font-medium text-red-600">
                      {questionStates.filter(s => !s.isAnswered).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marked for Review:</span>
                    <span className="font-medium text-yellow-600">
                      {questionStates.filter(s => s.isMarkedForReview).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTestCompleted && testResults) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <MobileNav />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Success Message */}
              <Card className="text-center">
                <CardContent className="pt-6">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Test Submitted Successfully!</h2>
                  <p className="text-muted-foreground">
                    Your responses have been recorded and sent for evaluation.
                  </p>
                </CardContent>
              </Card>

              {/* Test Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Test Results - {selectedTestData?.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {testResults.score}%
                        </div>
                        <div className="text-sm text-muted-foreground">Overall Score</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Questions:</span>
                          <span className="font-medium">{testResults.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attempted:</span>
                          <span className="font-medium text-blue-600">{testResults.attempted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Correct:</span>
                          <span className="font-medium text-green-600">{testResults.correct}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Incorrect:</span>
                          <span className="font-medium text-red-600">{testResults.incorrect}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Not Attempted:</span>
                          <span className="font-medium text-gray-600">{testResults.notAttempted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Performance Analysis</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Accuracy</span>
                            <span>{Math.round((testResults.correct / testResults.attempted) * 100)}%</span>
                          </div>
                          <Progress value={(testResults.correct / testResults.attempted) * 100} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Completion Rate</span>
                            <span>{Math.round((testResults.attempted / testResults.totalQuestions) * 100)}%</span>
                          </div>
                          <Progress value={(testResults.attempted / testResults.totalQuestions) * 100} className="h-2" />
                        </div>

                        <div className="flex justify-between text-sm">
                          <span>Time Spent:</span>
                          <span className="font-medium">{formatTime(testResults.timeSpent)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Detailed Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Complete evaluation report will be available once admin review is completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>Detailed subject-wise analysis and recommendations</p>
                    <p className="text-sm">will be available after admin evaluation</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={() => {
                  setIsTestCompleted(false);
                  setTestResults(null);
                  setSelectedTestData(null);
                }}>
                  Back to Mock Tests
                </Button>
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Practice with comprehensive mock tests designed to simulate the actual UPSC exam environment.
              </p>
            </div>

            <div className="flex gap-6">
              {/* Vertical Tabs */}
              <div className="w-80">
                <Tabs orientation="vertical" value={selectedTest} onValueChange={setSelectedTest}>
                  <TabsList className="grid w-full grid-rows-3 h-auto">
                    {mockTests.map((test) => (
                      <TabsTrigger
                        key={`test-${test.id}`}
                        value={`test-${test.id}`}
                        className="h-auto p-4 text-left justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{test.title}</span>
                            {getStatusBadge(test.status)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {test.totalQuestions} Questions • {test.duration}min
                          </div>
                          {test.score && (
                            <div className="text-xs font-medium text-green-600">
                              Score: {test.score}%
                            </div>
                          )}
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                {mockTests.map((test) => (
                  <div
                    key={test.id}
                    className={selectedTest === `test-${test.id}` ? 'block' : 'hidden'}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-2xl">{test.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {test.description}
                            </CardDescription>
                          </div>
                          <Badge className={getDifficultyBadge(test.difficulty)}>
                            {(test.difficulty || 'medium').charAt(0).toUpperCase() + (test.difficulty || 'medium').slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Test Details */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{test.totalQuestions}</div>
                            <div className="text-sm text-muted-foreground">Questions</div>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{test.duration}</div>
                            <div className="text-sm text-muted-foreground">Minutes</div>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{test.totalQuestions * 2}</div>
                            <div className="text-sm text-muted-foreground">Total Marks</div>
                          </div>
                        </div>

                        {/* Subjects */}
                        <div>
                          <h4 className="font-medium mb-2">Subjects Covered:</h4>
                          <div className="flex flex-wrap gap-2">
                            {(test.subjects || []).map((subject, index) => (
                              <Badge key={index} variant="outline">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Important Instructions:
                          </h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Read all questions carefully before answering</li>
                            <li>• You can navigate between questions freely</li>
                            <li>• Mark questions for review if you're unsure</li>
                            <li>• Test will auto-submit when time expires</li>
                            <li>• Ensure stable internet connection</li>
                          </ul>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-center pt-4">
                          {test.status === 'not_started' ? (
                            <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
                              <DialogTrigger asChild>
                                <Button size="lg" className="px-8">
                                  <Play className="mr-2 h-4 w-4" />
                                  Start Test
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Start Mock Test</DialogTitle>
                                  <DialogDescription>
                                    You are about to start "{test.title}". Once started, the timer will begin and cannot be paused.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Duration:</span>
                                    <span className="font-medium">{test.duration} minutes</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Questions:</span>
                                    <span className="font-medium">{test.totalQuestions}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Total Marks:</span>
                                    <span className="font-medium">{test.totalQuestions * 2}</span>
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleStartTest(test)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Now
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : test.status === 'evaluated' ? (
                            <Button variant="outline" size="lg">
                              <Trophy className="mr-2 h-4 w-4" />
                              View Results ({test.score}%)
                            </Button>
                          ) : (
                            <Button variant="secondary" size="lg" disabled>
                              {test.status === 'completed' ? 'Evaluation Pending' : 'In Progress'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Test Language</DialogTitle>
            <DialogDescription>
              Choose your preferred language for the mock test. You can switch languages during the test if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as 'english' | 'hindi')}
              className="space-y-4"
            >
              <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLanguage === 'english' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="english" id="english" />
                  <Label htmlFor="english" className="cursor-pointer flex-1">
                    <div>
                      <h4 className="font-medium">English</h4>
                      <p className="text-sm text-muted-foreground">
                        All questions and options will be displayed in English
                      </p>
                    </div>
                  </Label>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLanguage === 'hindi' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="hindi" id="hindi" />
                  <Label htmlFor="hindi" className="cursor-pointer flex-1">
                    <div>
                      <h4 className="font-medium">हिन्दी (Hindi)</h4>
                      <p className="text-sm text-muted-foreground">
                        सभी प्रश्न और विकल्प हिन्दी में प्रदर्शित होंगे
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowLanguageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLanguageSelection}>
              <Play className="mr-2 h-4 w-4" />
              Start Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}