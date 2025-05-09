import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ChevronRight, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QuizCardProps {
  question: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  onNextQuestion: () => void;
  quizTitle: string;
}

export default function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNextQuestion,
  quizTitle,
}: QuizCardProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Calculate progress percentage
  const progressPercentage = (questionNumber / totalQuestions) * 100;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-1">
          <CardTitle>{quizTitle}</CardTitle>
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Need a hint?</DialogTitle>
                <DialogDescription>
                  Here's some help for this question without giving away the answer.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Think about:</p>
                    <p className="text-sm text-muted-foreground">
                      Read each option carefully and eliminate the obviously incorrect ones first.
                      Remember to connect this question with the broader topic concepts.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => setHelpOpen(false)}
                >
                  Got it
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Question {questionNumber} of {totalQuestions}
        </CardDescription>
        <Progress value={progressPercentage} className="h-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-lg mb-4">{question.question}</h3>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedAnswer === option
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => onAnswerSelect(option)}
                >
                  <div className="flex items-center">
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                        selectedAnswer === option
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedAnswer === option && (
                        <div className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="text-sm text-muted-foreground">
          Select an answer to continue
        </div>
        <Button
          onClick={onNextQuestion}
          disabled={!selectedAnswer}
          className="ml-auto"
        >
          {questionNumber === totalQuestions ? "Finish" : "Next"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
