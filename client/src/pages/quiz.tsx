import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import QuizCard from "@/components/quiz/quiz-card";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, BookOpen, CheckCircle, AlertCircle, Timer, Flag, 
  ArrowLeft, ArrowRight, BookmarkPlus, BarChart2, MoreHorizontal, 
  Book, Target, HistoryIcon, Brain, ChevronLeft, ChevronRight,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Quiz() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Fetch all topics
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["/api/topics"],
  });

  // Fetch quiz if ID is provided
  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: ["/api/quizzes", id],
    enabled: !!id,
  });

  // Generate a new quiz
  const generateQuizMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const res = await apiRequest("POST", "/api/quizzes/generate", { topicId });
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/quiz/${data.quiz.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to generate quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit quiz attempt
  const submitQuizMutation = useMutation({
    mutationFn: async (data: { userId: number; quizId: number; score: number; totalQuestions: number }) => {
      const res = await apiRequest("POST", "/api/quiz-attempts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      toast({
        title: "Quiz completed!",
        description: `You scored ${score} out of ${quizData?.questions.length}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Handle navigation to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData?.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let totalScore = 0;
      quizData?.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
          totalScore++;
        }
      });
      setScore(totalScore);
      setQuizCompleted(true);
      
      // Submit quiz attempt
      if (user && quizData) {
        submitQuizMutation.mutate({
          userId: user.id,
          quizId: quizData.quiz.id,
          score: totalScore,
          totalQuestions: quizData.questions.length,
        });
      }
    }
  };

  // Handle starting a new quiz
  const handleStartNewQuiz = () => {
    setQuizCompleted(false);
    navigate("/quiz");
  };

  // Handle topic selection and quiz generation
  const handleGenerateQuiz = () => {
    if (selectedTopicId) {
      generateQuizMutation.mutate(selectedTopicId);
    } else {
      toast({
        title: "Topic required",
        description: "Please select a topic first",
        variant: "destructive",
      });
    }
  };

  // Reset user answers when a new quiz is loaded
  useEffect(() => {
    if (quizData) {
      setUserAnswers(new Array(quizData.questions.length).fill(""));
      setCurrentQuestionIndex(0);
      setQuizCompleted(false);
    }
  }, [quizData]);

  const renderQuizSelection = () => (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Take a Quiz</CardTitle>
        <CardDescription>
          Test your knowledge with topic-specific quizzes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Topic</label>
            <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a topic" />
              </SelectTrigger>
              <SelectContent>
                {topics &&
                  topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      {topic.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateQuiz}
          disabled={!selectedTopicId || generateQuizMutation.isPending}
          className="w-full"
        >
          {generateQuizMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-4 w-4" />
              Generate Quiz
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderQuizInProgress = () => {
    if (!quizData || quizLoading) return null;
    
    const currentQuestion = quizData.questions[currentQuestionIndex];
    return (
      <QuizCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizData.questions.length}
        selectedAnswer={userAnswers[currentQuestionIndex]}
        onAnswerSelect={handleAnswerSelect}
        onNextQuestion={handleNextQuestion}
        quizTitle={quizData.quiz.title}
      />
    );
  };

  const renderQuizResults = () => {
    if (!quizData) return null;
    
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>
            You've completed the quiz: {quizData.quiz.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {score >= quizData.questions.length / 2 ? (
                <CheckCircle className="h-12 w-12 text-primary" />
              ) : (
                <AlertCircle className="h-12 w-12 text-destructive" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {score} out of {quizData.questions.length} correct
            </h3>
            <p className="text-muted-foreground mb-6">
              {score >= quizData.questions.length / 2
                ? "Well done! You're making good progress."
                : "Keep practicing! Review the topics again."}
            </p>
            
            <div className="w-full space-y-4">
              <h4 className="font-medium">Question Review:</h4>
              {quizData.questions.map((question, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    userAnswers[index] === question.correctAnswer
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p className="font-medium mb-2">
                    {index + 1}. {question.question}
                  </p>
                  <div className="flex items-center text-sm mb-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                        userAnswers[index] === question.correctAnswer
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {userAnswers[index] === question.correctAnswer ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                    </div>
                    <span>
                      Your answer:{" "}
                      <span className="font-medium">
                        {userAnswers[index] || "Not answered"}
                      </span>
                    </span>
                  </div>
                  {userAnswers[index] !== question.correctAnswer && (
                    <div className="text-sm text-green-700">
                      Correct answer: {question.correctAnswer}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Explanation:</span>{" "}
                    {question.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStartNewQuiz} className="w-full">
            Take Another Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Quiz</h1>
          </div>

          {topicsLoading || (quizLoading && id) ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !id ? (
            renderQuizSelection()
          ) : quizCompleted ? (
            renderQuizResults()
          ) : (
            renderQuizInProgress()
          )}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
