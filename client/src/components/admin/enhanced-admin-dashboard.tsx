import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

type GeneratedQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  section: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  isSelected: boolean;
};

export function EnhancedAdminDashboard() {
  // State management
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectAllQuestions, setSelectAllQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [customSection, setCustomSection] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Fetch subjects and sections
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subjects");
      return response.json();
    }
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["/api/topics", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const response = await apiRequest("GET", `/api/topics?subjectId=${selectedSubject}`);
      return response.json();
    },
    enabled: !!selectedSubject
  });

  // Handle difficulty selection for AI question generation
  const handleDifficultyChange = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
  };

  // Handle select all questions functionality
  const handleSelectAllQuestions = (checked: boolean) => {
    setSelectAllQuestions(checked);
    setGeneratedQuestions(prev => 
      prev.map(q => ({ ...q, isSelected: checked }))
    );
  };

  // Handle individual question selection
  const handleQuestionSelection = (questionId: string, checked: boolean) => {
    setGeneratedQuestions(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, isSelected: checked } : q
      )
    );
    
    // Update select all state
    const updatedQuestions = generatedQuestions.map(q => 
      q.id === questionId ? { ...q, isSelected: checked } : q
    );
    const allSelected = updatedQuestions.every(q => q.isSelected);
    const noneSelected = updatedQuestions.every(q => !q.isSelected);
    
    if (allSelected) setSelectAllQuestions(true);
    if (noneSelected) setSelectAllQuestions(false);
  };

  // Handle file upload and processing
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
      const processedQuestions: GeneratedQuestion[] = data.questions.map((q: any, index: number) => ({
        id: `file-${index}`,
        question: q.question || q.text || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer || q.answer || '',
        explanation: q.explanation || '',
        subject: selectedSubject || 'General',
        section: selectedSection || customSection || 'Mixed',
        difficulty: selectedDifficulty,
        marks: 2,
        isSelected: false
      }));

      setGeneratedQuestions(processedQuestions);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file. Please check the format and try again.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Generate questions with selected difficulty
  const generateQuestionsWithDifficulty = async (prompt: string) => {
    try {
      const response = await apiRequest('POST', '/api/admin/generate-questions', {
        prompt: `${prompt}\n\nDifficulty Level: ${selectedDifficulty.toUpperCase()}\n\nGenerate questions with ${selectedDifficulty} difficulty level suitable for UPSC examination.`,
        difficulty: selectedDifficulty,
        subject: selectedSubject || 'General Studies',
        section: selectedSection || customSection || 'Mixed'
      });

      const data = await response.json();
      
      if (data.questions) {
        const formattedQuestions: GeneratedQuestion[] = data.questions.map((q: any) => ({
          id: q.id || Math.random().toString(),
          question: q.question?.english || q.question || '',
          options: q.options?.english || q.options || [],
          correctAnswer: q.correctAnswer?.english || q.correctAnswer || '',
          explanation: q.explanation?.english || q.explanation || '',
          subject: selectedSubject || q.subject || 'General',
          section: selectedSection || customSection || q.topic || 'Mixed',
          difficulty: selectedDifficulty,
          marks: 2,
          isSelected: false
        }));

        setGeneratedQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Questions Tab Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle>AI Question Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject Selection */}
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
              <Select value={selectedSection} onValueChange={setSelectedSection}>
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

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <div className="flex space-x-4">
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <label key={difficulty} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="difficulty"
                    value={difficulty}
                    checked={selectedDifficulty === difficulty}
                    onChange={() => handleDifficultyChange(difficulty)}
                  />
                  <span className="capitalize">{difficulty}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generated Questions with Select All */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Generated Questions</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAllQuestions}
                    onCheckedChange={handleSelectAllQuestions}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {generatedQuestions.map((question) => (
                  <Card key={question.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={question.isSelected}
                        onCheckedChange={(checked) => 
                          handleQuestionSelection(question.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium">{question.question}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          <p>Subject: {question.subject} | Section: {question.section}</p>
                          <p>Difficulty: {question.difficulty} | Marks: {question.marks}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Input Tab Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Question Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Question File</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept=".txt,.docx,.pdf,.csv,.json"
                onChange={handleFileUpload}
                disabled={isProcessingFile}
              />
              <Button disabled={isProcessingFile}>
                {isProcessingFile ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Supported formats: TXT, DOCX, PDF, CSV, JSON
            </p>
          </div>

          {/* Subject and Section with improved dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manual-subject">Subject</Label>
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
              <Label htmlFor="manual-section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
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
        </CardContent>
      </Card>
    </div>
  );
}