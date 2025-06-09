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
  const [customSection, setCustomSection] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileQuestions, setFileQuestions] = useState<Question[]>([]);
  const [selectAllFile, setSelectAllFile] = useState(false);

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

  // Fetch all subjects for dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subjects");
      return response.json();
    }
  });

  // Fetch sections based on selected subject
  const { data: sections = [] } = useQuery({
    queryKey: ["/api/topics", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const response = await apiRequest("GET", `/api/topics?subjectId=${selectedSubject}`);
      return response.json();
    },
    enabled: !!selectedSubject
  });

  // Handle file upload processing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/process-question-file', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      const data = await response.json();
      
      // Convert processed file data to question format
      const processedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
        question: q.question || q.text || '',
        questionHindi: q.questionHindi || '',
        options: q.options || [],
        optionsHindi: q.optionsHindi || [],
        correctAnswer: q.correctAnswer || q.answer || 0,
        explanation: q.explanation || '',
        explanationHindi: q.explanationHindi || '',
        difficulty: q.difficulty || 'medium',
        marks: q.marks || 2,
        subject: selectedSubject || 'General',
        topic: selectedTopic || customSection || 'Mixed'
      }));

      setFileQuestions(processedQuestions);
      toast({
        title: "File Processed Successfully",
        description: `Extracted ${processedQuestions.length} questions from file`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "File Processing Failed",
        description: "Please check the file format and try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const submitAllQuestions = () => {
    if (questions.length === 0 && fileQuestions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add questions before submitting",
        variant: "destructive"
      });
      return;
    }

    const allQuestions = [...questions, ...fileQuestions.filter((_, index) => selectAllFile || fileQuestions[index]?.isSelected)];
    
    addQuestionMutation.mutate({
      questions: allQuestions,
      subjectId: selectedSubject,
      topicId: selectedTopic
    });
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Question File</CardTitle>
          <CardDescription>
            Upload a file containing questions in supported formats (TXT, DOCX, PDF, CSV, JSON)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              accept=".txt,.docx,.pdf,.csv,.json"
              onChange={handleFileUpload}
              disabled={isProcessingFile}
              className="flex-1"
            />
            <Button disabled={isProcessingFile} variant="outline">
              {isProcessingFile ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>

          {/* Subject and Section Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section: any) => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or enter custom section name"
                value={customSection}
                onChange={(e) => setCustomSection(e.target.value)}
              />
            </div>
          </div>

          {/* File Questions Display */}
          {fileQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Questions from File</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectAllFile}
                    onCheckedChange={setSelectAllFile}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {fileQuestions.map((question, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        checked={selectAllFile || question.isSelected}
                        onCheckedChange={(checked) => {
                          setFileQuestions(prev => prev.map((q, i) => 
                            i === index ? { ...q, isSelected: checked as boolean } : q
                          ));
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{question.question}</p>
                        <p className="text-xs text-gray-600">
                          {question.subject} - {question.topic} ({question.difficulty})
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manual Question Input</h2>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {questions.length + fileQuestions.filter(q => selectAllFile || q.isSelected).length} Questions Total
          </Badge>
          <Button 
            onClick={submitAllQuestions} 
            disabled={(questions.length === 0 && fileQuestions.length === 0) || addQuestionMutation.isPending}
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