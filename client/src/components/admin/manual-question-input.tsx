import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Upload, FileText, CheckCircle, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  isSelected?: boolean;
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
  const [showMockTestDialog, setShowMockTestDialog] = useState(false);
  const [mockTestData, setMockTestData] = useState({
    title: "",
    description: "",
    duration: 120,
    scheduledDate: new Date().toISOString().split('T')[0],
    difficulty: "medium"
  });

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

  const createMockTestMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; duration: number; scheduledDate: string; questions: Question[] }) => {
      // First, save questions to get their IDs
      const questionsResponse = await apiRequest("POST", "/api/admin/questions/manual", {
        questions: data.questions,
        subjectId: "1", // Default subject ID
        topicId: "1"    // Default topic ID
      });
      const savedQuestions = await questionsResponse.json();

      // Then create mock test with question IDs
      const response = await apiRequest("POST", "/api/admin/create-mock-test", {
        title: data.title,
        description: data.description,
        duration: data.duration,
        testDate: data.scheduledDate,
        selectedQuestionIds: savedQuestions.questions?.map((q: any) => q.id) || []
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mock Test Created Successfully",
        description: `Mock test "${data.mockTest.title}" has been created with ${data.mockTest.totalQuestions} questions.`
      });
      setShowMockTestDialog(false);
      setQuestions([]);
      setFileQuestions([]);
      setMockTestData({
        title: "",
        description: "",
        duration: 120,
        scheduledDate: new Date().toISOString().split('T')[0],
        difficulty: "medium"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mock test",
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

      // Convert processed file data to question format with selection capability
      const processedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
        question: q.question || q.text || '',
        questionHindi: q.questionHindi || '',
        options: Array.isArray(q.options) ? q.options : [],
        optionsHindi: q.optionsHindi || [],
        correctAnswer: Array.isArray(q.options) ? 
          (q.options.indexOf(q.correctAnswer) !== -1 ? q.options.indexOf(q.correctAnswer) : 0) : 0,
        explanation: q.explanation || '',
        explanationHindi: q.explanationHindi || '',
        difficulty: q.difficulty || 'medium',
        marks: q.marks || 2,
        subject: q.subject || 'General Knowledge',
        topic: q.topic || 'Mixed Topics',
        isSelected: false
      }));

      setFileQuestions(processedQuestions);
      toast({
        title: "File Processed Successfully",
        description: `Extracted ${processedQuestions.length} questions from file. Select questions to create mock test.`
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

  // Create mock test from selected questions
  const createMockTestFromSelected = async () => {
    const selectedQuestions = fileQuestions.filter(q => q.isSelected);

    if (selectedQuestions.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select at least one question to create a mock test",
        variant: "destructive"
      });
      return;
    }

    setShowMockTestDialog(true);
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
                <div className="flex items-center space-x-4">
                  <h4 className="font-medium">Questions from File ({fileQuestions.length} extracted)</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectAllFile}
                      onCheckedChange={(checked) => {
                        setSelectAllFile(checked as boolean);
                        setFileQuestions(prev => prev.map(q => ({ ...q, isSelected: checked as boolean })));
                      }}
                    />
                    <Label className="text-sm">Select All</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {fileQuestions.filter(q => q.isSelected).length} of {fileQuestions.length} selected
                  </span>
                  <Button
                    onClick={createMockTestFromSelected}
                    disabled={fileQuestions.filter(q => q.isSelected).length === 0}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    Create Mock Test
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {fileQuestions.map((question, index) => (
                  <Card key={index} className={question.isSelected ? "ring-2 ring-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={question.isSelected}
                          onCheckedChange={(checked) => {
                            setFileQuestions(prev => prev.map((q, i) => 
                              i === index ? { ...q, isSelected: checked as boolean } : q
                            ));
                          }}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{question.subject}</Badge>
                              <Badge variant="outline">{question.difficulty}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {question.marks} marks
                              </span>
                            </div>
                          </div>

                          <p className="font-medium">{question.question}</p>

                          {question.options && question.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {question.options.map((option: string, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded border ${
                                    optIndex === question.correctAnswer
                                      ? "bg-green-50 border-green-200"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  <span className="text-sm">
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                    {optIndex === question.correctAnswer && (
                                      <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.explanation && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
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
            onClick={() => setShowMockTestDialog(true)}
            disabled={(questions.length === 0 && fileQuestions.length === 0)}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Mock Test
          </Button>
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

      {/* Mock Test Creation Dialog */}
      <Dialog open={showMockTestDialog} onOpenChange={setShowMockTestDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Mock Test</DialogTitle>
            <DialogDescription>
              Configure your mock test with {questions.length + fileQuestions.filter(q => selectAllFile || q.isSelected).length} selected questions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={mockTestData.title}
                onChange={(e) => setMockTestData(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
                placeholder="Enter mock test title"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={mockTestData.description}
                onChange={(e) => setMockTestData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter test description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                value={mockTestData.duration}
                onChange={(e) => setMockTestData(prev => ({ ...prev, duration: parseInt(e.target.value) || 120 }))}
                className="col-span-3"
                min="30"
                max="300"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduledDate" className="text-right">
                Scheduled Date
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={mockTestData.scheduledDate}
                onChange={(e) => setMockTestData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Select 
                value={mockTestData.difficulty} 
                onValueChange={(value) => setMockTestData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMockTestDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const allQuestions = [
                  ...questions,
                  ...fileQuestions.filter(q => selectAllFile || q.isSelected)
                ];

                if (allQuestions.length === 0) {
                  toast({
                    title: "No Questions Selected",
                    description: "Please add or select questions before creating a mock test.",
                    variant: "destructive"
                  });
                  return;
                }

                if (!mockTestData.title.trim()) {
                  toast({
                    title: "Title Required",
                    description: "Please enter a title for the mock test.",
                    variant: "destructive"
                  });
                  return;
                }

                // Use createMockTestMutation for consistency
                createMockTestMutation.mutate({
                  title: mockTestData.title,
                  description: mockTestData.description,
                  duration: mockTestData.duration,
                  scheduledDate: mockTestData.scheduledDate,
                  questions: allQuestions
                });
              }}
              disabled={createMockTestMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600"
            >
              {createMockTestMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Mock Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}