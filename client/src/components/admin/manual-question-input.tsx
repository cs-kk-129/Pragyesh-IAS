import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  questionHindi?: string;
  options: string[];
  optionsHindi?: string[];
  correctAnswer: number;
  explanation: string;
  explanationHindi?: string;
  difficulty: string;
  marks: number;
  subject: string;
  topic: string;
}

export default function ManualQuestionInput() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: "",
    questionHindi: "",
    options: ["", "", "", ""],
    optionsHindi: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    explanationHindi: "",
    difficulty: "medium",
    marks: 2,
    subject: "",
    topic: ""
  });
  const [bulkInput, setBulkInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const addQuestionMutation = useMutation({
    mutationFn: async (data: { questions: Question[]; subjectId: string; topicId: string }) => {
      const response = await apiRequest("POST", "/api/admin/questions/manual", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Questions Added Successfully",
        description: `${data.count} questions have been added to the database.`
      });
      setQuestions([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add questions",
        variant: "destructive"
      });
    }
  });

  const addCurrentQuestion = () => {
    if (!currentQuestion.question.trim() || currentQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Incomplete Question",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setQuestions(prev => [...prev, { ...currentQuestion }]);
    toast({
      title: "Question Added",
      description: "Question added to the batch successfully"
    });
  };

  const updateOption = (index: number, value: string, isHindi = false) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [isHindi ? 'optionsHindi' : 'options']: prev[isHindi ? 'optionsHindi' : 'options']!.map((opt, i) => i === index ? value : opt)
    }));
  };

  const submitAllQuestions = () => {
    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add questions before submitting",
        variant: "destructive"
      });
      return;
    }

    addQuestionMutation.mutate({
      questions,
      subjectId: selectedSubject,
      topicId: selectedTopic
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manual Question Input</h2>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {questions.length} Questions in Batch
          </Badge>
          <Button 
            onClick={submitAllQuestions} 
            disabled={questions.length === 0 || addQuestionMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-green-600"
          >
            <Upload className="mr-2 h-4 w-4" />
            Submit All Questions
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject & Topic Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="geography">Geography</SelectItem>
                  <SelectItem value="polity">Polity</SelectItem>
                  <SelectItem value="economics">Economics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Topic</Label>
              <Input 
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="Enter topic name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question (English)</Label>
            <Textarea
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter the question in English"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Options</Label>
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-6 text-sm">{String.fromCharCode(65 + index)})</span>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Correct Answer</Label>
              <Select value={currentQuestion.correctAnswer.toString()} onValueChange={(value) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">A</SelectItem>
                  <SelectItem value="1">B</SelectItem>
                  <SelectItem value="2">C</SelectItem>
                  <SelectItem value="3">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={currentQuestion.difficulty} onValueChange={(value) => setCurrentQuestion(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marks</Label>
              <Input
                type="number"
                value={currentQuestion.marks}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 2 }))}
                min={1}
                max={5}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Explanation</Label>
            <Textarea
              value={currentQuestion.explanation}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Provide detailed explanation for the answer"
              rows={3}
            />
          </div>

          <Button onClick={addCurrentQuestion} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Question to Batch
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions in Batch ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Question {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuestions(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{question.question}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{question.difficulty}</Badge>
                    <Badge variant="outline">{question.marks} marks</Badge>
                    <Badge variant="outline">
                      Answer: {String.fromCharCode(65 + question.correctAnswer)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}