import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ManualQuestionInput from "@/components/admin/manual-question-input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Settings,
  FileText,
  Brain,
  ClipboardCheck,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Crown,
  GraduationCap,
  BarChart3,
  Calendar,
  Target,
  BookOpen,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type User = {
  id: number;
  username: string;
  email: string;
  accountType: 'free' | 'paid' | 'admin';
  stream: 'UPSC' | 'BPSC';
  registeredAt: string;
  lastActive: string;
  isActive: boolean;
};

type GeneratedQuestion = {
  id: string;
  question: string;
  questionHindi?: string;
  options?: string[];
  optionsHindi?: string[];
  correctAnswer?: string;
  type: 'objective' | 'subjective';
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  isSelected: boolean;
};

type EvaluationSubmission = {
  id: number;
  studentName: string;
  quizTitle: string;
  submissionType: 'objective' | 'subjective';
  submittedAt: string;
  status: 'pending' | 'evaluating' | 'completed';
  score?: number;
  answerFileUrl?: string;
  evaluationReport?: string;
};

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("users");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMockTestDialog, setShowMockTestDialog] = useState(false);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Record<string, {topicId: number, questionCount: number, subject: string}>>({});
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Fetch all subjects for topic selection
  const { data: allSubjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subjects");
      return response.json();
    }
  });

  // Fetch all sections
  const { data: allSections = [] } = useQuery({
    queryKey: ["/api/sections"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/sections");
      return response.json();
    }
  });

  // Fetch all topics
  const { data: allTopics = [] } = useQuery({
    queryKey: ["/api/topics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/topics");
      return response.json();
    }
  });

  // Helper function to get sections for a subject
  const getSubjectSections = (subjectId: number) => {
    return allSections.filter((section: any) => section.subjectId === subjectId);
  };

  // Helper function to get topics for a section
  const getSectionTopics = (sectionId: number) => {
    return allTopics.filter((topic: any) => topic.section_id === sectionId);
  };

  // Helper function to get direct topics for a subject (when no sections)
  const getSubjectTopics = (subjectId: number) => {
    return allTopics.filter((topic: any) => topic.subject_id === subjectId);
  };

  const [mockTestDetails, setMockTestDetails] = useState({
    title: "",
    description: "",
    duration: 60,
    scheduledDate: "",
  });

  // Additional state for enhanced functionality
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectAllQuestions, setSelectAllQuestions] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedFileQuestions, setProcessedFileQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [customSection, setCustomSection] = useState<string>('');

  // Mock data - in real app, this would come from API
  const mockUsers: User[] = [
    {
      id: 1,
      username: "csk",
      email: "chaitanyasaikam@gmail.com",
      accountType: "paid",
      stream: "UPSC",
      registeredAt: "2025-05-20",
      lastActive: "2025-05-27",
      isActive: true,
    },
    {
      id: 2,
      username: "student1",
      email: "student1@example.com",
      accountType: "free",
      stream: "BPSC",
      registeredAt: "2025-05-25",
      lastActive: "2025-05-26",
      isActive: true,
    },
    {
      id: 3,
      username: "admin_user",
      email: "admin@pragyeshias.com",
      accountType: "admin",
      stream: "UPSC",
      registeredAt: "2025-05-15",
      lastActive: "2025-05-27",
      isActive: true,
    },
  ];

  // Fetch real-time evaluations data (database-driven)
  const { data: evaluationsData, isLoading: evaluationsLoading } = useQuery({
    queryKey: ["/api/admin/evaluations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/evaluations");
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const realEvaluations = evaluationsData?.evaluations || [];

  // Handlers for topic-based question generation
  const handleTopicSelection = (subject: string, topic: string, questionCount: number) => {
    const key = `${subject}-${topic}`;
    setSelectedTopics(prev => {
      if (questionCount === 0) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: { topicId: Math.random(), questionCount, subject }
      };
    });
    
    // Update total question count
    const newTotal = Object.values({
      ...selectedTopics,
      [key]: questionCount > 0 ? { topicId: Math.random(), questionCount, subject } : undefined
    }).filter(Boolean).reduce((sum, item) => sum + (item?.questionCount || 0), 0);
    setTotalQuestions(newTotal);
  };

  const handleGenerateFromTopics = async () => {
    if (Object.keys(selectedTopics).length === 0) return;

    setIsGenerating(true);
    try {
      // Generate questions for each selected topic
      const allQuestions: any[] = [];
      
      for (const [key, topicData] of Object.entries(selectedTopics)) {
        const [subject, topic] = key.split('-');
        
        // Create UPSC-standard prompt with specific formatting
        const prompt = `Generate ${topicData.questionCount} UPSC-standard questions on ${topic} from ${subject}.

Follow these UPSC formatting guidelines:
- Question Types: 50% factual, 30% analytical, 20% assertion-reason
- Difficulty: 50% Moderate, 30% Tough, 20% Tricky/trap-based
- Format: Numbered questions (Q1, Q2...) with four options (A-D)
- Include correct answer and 3-5 line explanation
- Questions in both English and Hindi
- Maintain UPSC exam standards for depth and accuracy`;

        const response = await apiRequest('POST', '/api/admin/generate-questions', {
          prompt,
          questionType: 'objective',
          generateBilingual: true,
          subject,
          topic
        });

        const data = await response.json();
        if (data.questions) {
          allQuestions.push(...data.questions.map((q: any) => ({
            id: q.id.toString(),
            question: q.question?.english || q.question,
            questionHindi: q.question?.hindi || q.questionHindi,
            options: Array.isArray(q.options) ? q.options : (q.options?.english || q.options),
            optionsHindi: q.options?.hindi || q.optionsHindi,
            correctAnswer: q.correctAnswer?.english || q.correctAnswer,
            type: "objective",
            subject,
            topic,
            difficulty: q.difficulty || "medium",
            marks: 2,
            isSelected: false
          })));
        }
      }

      // Shuffle questions randomly as requested
      const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
      setGeneratedQuestions(shuffledQuestions);
      
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!questionPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Extract requested number from prompt and double it for admin choice
      const numberMatch = questionPrompt.match(/(\d+)\s*(?:questions?|mcqs?)/i);
      const requestedCount = numberMatch ? parseInt(numberMatch[1]) : 10;
      const generateCount = requestedCount * 2; // Generate double for selection

      // Enhanced prompt with difficulty and increased count
      const enhancedPrompt = questionPrompt.replace(/(\d+)/, generateCount.toString()) + 
        `\n\nDifficulty Level: ${selectedDifficulty.toUpperCase()}. Generate ${generateCount} questions to give admin choice for selection.`;

      const response = await apiRequest('POST', '/api/admin/generate-questions', {
        prompt: enhancedPrompt,
        questionType: 'objective',
        difficulty: selectedDifficulty,
        requestedCount: generateCount
      });

      const data = await response.json();
      
      if (data.questions) {
        // Transform database response to match our GeneratedQuestion type
        const transformedQuestions = data.questions.map((q: any) => ({
          id: q.id.toString(),
          question: typeof q.question === 'object' ? q.question?.english || q.question?.hindi || '' : q.question,
          questionHindi: typeof q.question === 'object' ? q.question?.hindi : q.questionHindi,
          options: Array.isArray(q.options) ? q.options : (typeof q.options === 'object' ? q.options?.english || [] : []),
          optionsHindi: typeof q.options === 'object' ? q.options?.hindi : q.optionsHindi,
          correctAnswer: typeof q.correctAnswer === 'object' ? q.correctAnswer?.english || q.correctAnswer?.hindi || '' : q.correctAnswer,
          type: "objective",
          subject: q.subject || "General Knowledge",
          topic: q.topic || "Mixed Topics",
          difficulty: q.difficulty || selectedDifficulty,
          marks: q.marks || 2,
          isSelected: false,
        }));

        setGeneratedQuestions(transformedQuestions);
        setSelectAllQuestions(false); // Reset select all state
        console.log(`Generated and saved ${data.questions.length} questions to database (requested ${requestedCount}, generated ${generateCount} for choice)`);
      } else {
        throw new Error('No questions received from database');
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again with a different prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionSelection = (questionId: string, isSelected: boolean) => {
    setGeneratedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, isSelected } : q)
    );
  };

  const handleCreateMockTest = () => {
    const selectedQuestions = generatedQuestions.filter(q => q.isSelected);
    if (selectedQuestions.length === 0) {
      alert("Please select at least one question to create a mock test.");
      return;
    }

    // Open dialog to customize mock test details
    setMockTestDetails({
      title: `Mock Test ${new Date().toLocaleDateString()}`,
      description: "AI-generated comprehensive mock test",
      duration: Math.max(30, selectedQuestions.length * 2),
      scheduledDate: new Date().toISOString().split('T')[0],
    });
    setShowMockTestDialog(true);
  };

  const handleConfirmMockTest = async () => {
    try {
      const selectedQuestions = generatedQuestions.filter(q => q.isSelected);
      const subjects = selectedQuestions.map(q => q.subject);
      const uniqueSubjects = subjects.filter((subject, index) => subjects.indexOf(subject) === index);

      const mockTestData = {
        ...mockTestDetails,
        questions: selectedQuestions,
        difficulty: selectedQuestions.some(q => q.difficulty === 'hard') ? 'hard' : 
                   selectedQuestions.some(q => q.difficulty === 'medium') ? 'medium' : 'easy',
        subjects: uniqueSubjects,
      };

      console.log("Creating mock test with data:", mockTestData);
      
      // Call database-driven API to save the mock test
      const response = await apiRequest('POST', '/api/admin/create-mock-test', {
        title: mockTestDetails.title,
        description: mockTestDetails.description,
        duration: mockTestDetails.duration,
        testDate: mockTestDetails.scheduledDate,
        selectedQuestionIds: selectedQuestions.map(q => q.id) // Use full UUID, don't parse as integer
      });

      const result = await response.json();
      if (result.success) {
        alert(`Mock test "${mockTestDetails.title}" created successfully with ${selectedQuestions.length} questions! Students can now see this test in their Mock Tests section.`);
        
        // Reset everything
        setGeneratedQuestions([]);
        setQuestionPrompt("");
        setShowMockTestDialog(false);
        setMockTestDetails({ title: "", description: "", duration: 60, scheduledDate: "" });
      } else {
        throw new Error(result.error || 'Failed to create mock test');
      }
    } catch (error) {
      console.error('Error creating mock test:', error);
      alert('Failed to create mock test. Please try again.');
    }
  };

  const handleUserAccountTypeChange = (userId: number, newType: 'free' | 'paid' | 'admin') => {
    console.log(`Changing user ${userId} account type to ${newType}`);
    // In real app, update user in database
  };

  const handleUserStreamChange = (userId: number, newStream: 'UPSC' | 'BPSC') => {
    console.log(`Changing user ${userId} stream to ${newStream}`);
    // In real app, update user in database
  };

  const handleEvaluateSubmission = async (submissionId: number) => {
    console.log(`Starting evaluation for submission ${submissionId}`);
    // In real app, this would:
    // 1. For objective: Send answers to ChatGPT for detailed analysis
    // 2. For subjective: Convert PDF to images, OCR, then send to ChatGPT
  };

  const getAccountTypeBadge = (type: string) => {
    const variants = {
      free: { color: "bg-gray-100 text-gray-800", icon: BookOpen },
      paid: { color: "bg-green-100 text-green-800", icon: Crown },
      admin: { color: "bg-blue-100 text-blue-800", icon: Settings },
    };

    const variant = variants[type as keyof typeof variants] || variants.free;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      evaluating: { color: "bg-blue-100 text-blue-800", text: "Evaluating" },
      completed: { color: "bg-green-100 text-green-800", text: "Completed" },
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;

    return (
      <Badge className={variant.color}>
        {variant.text}
      </Badge>
    );
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
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive admin panel for managing users, creating AI-powered mock tests, and handling evaluations.
              </p>
            </div>

            {/* Admin Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid Students</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">456</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Mock Tests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Currently running</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Admin Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="users" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </TabsTrigger>
                <TabsTrigger value="questions" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Questions</span>
                </TabsTrigger>
                <TabsTrigger value="manual-questions" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Manual Input</span>
                </TabsTrigger>
                <TabsTrigger value="evaluations" className="flex items-center space-x-2">
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Evaluations</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user access, account types, and monitor student activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Account Type</TableHead>
                          <TableHead>Stream</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.accountType}
                                onValueChange={(value: 'free' | 'paid' | 'admin') =>
                                  handleUserAccountTypeChange(user.id, value)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.stream}
                                onValueChange={(value: 'UPSC' | 'BPSC') =>
                                  handleUserStreamChange(user.id, value)
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UPSC">UPSC</SelectItem>
                                  <SelectItem value="BPSC">BPSC</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{user.registeredAt}</TableCell>
                            <TableCell>{user.lastActive}</TableCell>
                            <TableCell>
                              {user.isActive ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Student Profile Modal */}
                {selectedUser && (
                  <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Student Profile - {selectedUser.username}</DialogTitle>
                        <DialogDescription>
                          Comprehensive view of student activity and progress
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Account Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between">
                              <span>Email:</span>
                              <span className="font-medium">{selectedUser.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Account Type:</span>
                              {getAccountTypeBadge(selectedUser.accountType)}
                            </div>
                            <div className="flex justify-between">
                              <span>Stream:</span>
                              <Badge variant="outline">{selectedUser.stream}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Registered:</span>
                              <span>{selectedUser.registeredAt}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Performance Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Quiz Completion</span>
                                <span>75%</span>
                              </div>
                              <Progress value={75} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Average Score</span>
                                <span>82%</span>
                              </div>
                              <Progress value={82} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Study Streak</span>
                                <span>12 days</span>
                              </div>
                              <Progress value={60} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </TabsContent>

              {/* Question Generation Tab */}
              <TabsContent value="questions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>AI-Powered Question Generation</span>
                    </CardTitle>
                    <CardDescription>
                      Generate questions using ChatGPT and curate them for mock tests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Question Generation Prompt</label>
                        <Textarea
                          placeholder="Enter your prompt for ChatGPT. For example: 'Generate 10 multiple choice questions on Indian Constitution, focusing on Fundamental Rights, with medium difficulty level for UPSC preparation.'"
                          value={questionPrompt}
                          onChange={(e) => setQuestionPrompt(e.target.value)}
                          rows={4}
                          className="mt-2"
                        />
                      </div>

                      {/* Difficulty Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Difficulty Level</label>
                        <RadioGroup
                          value={selectedDifficulty}
                          onValueChange={(value) => setSelectedDifficulty(value as 'easy' | 'medium' | 'hard')}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="easy" id="easy" />
                            <Label htmlFor="easy">Easy</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="medium" id="medium" />
                            <Label htmlFor="medium">Medium</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hard" id="hard" />
                            <Label htmlFor="hard">Hard</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="flex space-x-4">
                        <Button
                          onClick={handleGenerateQuestions}
                          disabled={isGenerating || !questionPrompt.trim()}
                          variant="outline"
                          className="flex-1"
                        >
                          {isGenerating ? (
                            <>
                              <Brain className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="mr-2 h-4 w-4" />
                              Generate from Prompt
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => setShowTopicSelector(true)}
                          className="flex-1"
                        >
                          <Target className="mr-2 h-4 w-4" />
                          Select Topics & Generate
                        </Button>
                      </div>
                    </div>

                    {/* Generated Questions */}
                    {generatedQuestions.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <h3 className="text-lg font-medium">Generated Questions</h3>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="select-all-questions"
                                checked={selectAllQuestions}
                                onCheckedChange={(checked) => {
                                  setSelectAllQuestions(checked as boolean);
                                  setGeneratedQuestions(prev => 
                                    prev.map(q => ({ ...q, isSelected: checked as boolean }))
                                  );
                                }}
                              />
                              <Label htmlFor="select-all-questions" className="text-sm font-medium">
                                Select All
                              </Label>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {generatedQuestions.filter(q => q.isSelected).length} of {generatedQuestions.length} selected
                            </span>
                            <Button
                              onClick={handleCreateMockTest}
                              disabled={generatedQuestions.filter(q => q.isSelected).length === 0}
                            >
                              Create Mock Test Paper
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {generatedQuestions.map((question) => (
                            <Card key={question.id} className={question.isSelected ? "ring-2 ring-primary" : ""}>
                              <CardContent className="pt-6">
                                <div className="flex items-start space-x-4">
                                  <Checkbox
                                    checked={question.isSelected}
                                    onCheckedChange={(checked) =>
                                      handleQuestionSelection(question.id, checked as boolean)
                                    }
                                  />
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Badge variant="outline">{question.type}</Badge>
                                        <Badge variant="outline">{question.subject}</Badge>
                                        <Badge variant="outline">{question.difficulty}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                          {question.marks} marks
                                        </span>
                                      </div>
                                    </div>

                                    <p className="font-medium">{question.question}</p>

                                    {question.options && (
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        {(Array.isArray(question.options) ? question.options : []).map((option: string, index: number) => (
                                          <div
                                            key={index}
                                            className={`p-2 rounded border ${
                                              option === question.correctAnswer
                                                ? "bg-green-50 border-green-200"
                                                : "bg-gray-50"
                                            }`}
                                          >
                                            <span className="text-sm">
                                              {String.fromCharCode(65 + index)}. {option}
                                              {option === question.correctAnswer && (
                                                <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />
                                              )}
                                            </span>
                                          </div>
                                        ))}
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
              </TabsContent>

              {/* Manual Question Input Tab */}
              <TabsContent value="manual-questions" className="space-y-6">
                <ManualQuestionInput />
              </TabsContent>

              {/* Evaluations Tab */}
              <TabsContent value="evaluations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ClipboardCheck className="h-5 w-5" />
                      <span>Student Evaluations</span>
                    </CardTitle>
                    <CardDescription>
                      Manage objective and subjective test evaluations with AI assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Test</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluationsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                              <p className="mt-2 text-muted-foreground">Loading evaluations...</p>
                            </TableCell>
                          </TableRow>
                        ) : realEvaluations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <p className="text-muted-foreground">No mock test evaluations found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          realEvaluations.map((evaluation: any) => (
                            <TableRow key={evaluation.id}>
                              <TableCell className="font-medium">
                                {evaluation.studentName || evaluation.username}
                              </TableCell>
                              <TableCell>{evaluation.quizTitle || evaluation.title}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  objective
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(evaluation.submittedAt || evaluation.createdAt).toLocaleString()}</TableCell>
                              <TableCell>
                                {getStatusBadge(evaluation.status || "completed")}
                              </TableCell>
                              <TableCell>
                                {evaluation.score ? `${evaluation.score}%` : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {evaluation.status === "pending" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEvaluateSubmission(evaluation.id)}
                                    >
                                      <Brain className="h-4 w-4 mr-1" />
                                      Evaluate with AI
                                    </Button>
                                  )}

                                  {evaluation.answerFileUrl && (
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  )}

                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Report
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Evaluation Process Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Evaluation Process</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Objective Questions</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Student responses are recorded automatically</li>
                          <li>Answers are sent to ChatGPT for detailed analysis</li>
                          <li>AI generates comprehensive report with analytics</li>
                          <li>Score calculation and weak area identification</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Subjective Questions</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Student uploads handwritten answer PDF</li>
                          <li>PDF is converted to high-quality images</li>
                          <li>OCR extracts text from images</li>
                          <li>Extracted text sent to ChatGPT for grading</li>
                          <li>Detailed report with suggestions generated</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>Analytics dashboard coming soon</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>Revenue tracking coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Mock Test Customization Dialog */}
      <Dialog open={showMockTestDialog} onOpenChange={setShowMockTestDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Customize Mock Test Details</DialogTitle>
            <DialogDescription>
              Edit the mock test details that will be displayed to students in the Mock Tests section.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-title">Test Title</Label>
              <Input
                id="test-title"
                value={mockTestDetails.title}
                onChange={(e) => setMockTestDetails(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter mock test title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-description">Test Description</Label>
              <Textarea
                id="test-description"
                value={mockTestDetails.description}
                onChange={(e) => setMockTestDetails(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this mock test covers..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-duration">Duration (minutes)</Label>
                <Input
                  id="test-duration"
                  type="number"
                  value={mockTestDetails.duration}
                  onChange={(e) => setMockTestDetails(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  min="15"
                  max="300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-date">Scheduled Date</Label>
                <Input
                  id="test-date"
                  type="date"                  value={mockTestDetails.scheduledDate}
                  onChange={(e) => setMockTestDetails(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Test Summary</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Questions: {generatedQuestions.filter(q => q.isSelected).length}</div>
                <div>Estimated Time: {mockTestDetails.duration} minutes</div>
                <div>Subjects: {[...new Set(generatedQuestions.filter(q => q.isSelected).map(q => q.subject))].join(", ")}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowMockTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMockTest}>
              Create Mock Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topic Selection Dialog */}
      <Dialog open={showTopicSelector} onOpenChange={setShowTopicSelector}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-6 w-6" />
              <span>Select Topics for Question Generation</span>
            </DialogTitle>
            <DialogDescription>
              Choose subjects and topics with UPSC-standard distribution. Select question count for each topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Question Distribution Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{Object.keys(selectedTopics).length}</div>
                    <div className="text-sm text-muted-foreground">Selected Topics</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{Array.from(new Set(Object.values(selectedTopics).map(t => t.subject))).length}</div>
                    <div className="text-sm text-muted-foreground">Subjects Covered</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {totalQuestions > 0 ? Math.round((totalQuestions / 100) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">UPSC Standard</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Selection */}
            <div className="space-y-6">
              {allSubjects.map((subject: any) => {
                const subjectSections = getSubjectSections(subject.id);
                const subjectTopics = getSubjectTopics(subject.id);
                
                // Only show subjects that have either sections or direct topics
                const hasContent = subjectSections.length > 0 || subjectTopics.length > 0;
                if (!hasContent) return null;

                return (
                  <Card key={subject.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{subject.name}</span>
                        <Badge variant="outline">
                          {subjectSections.length > 0 ? 
                            `${subjectSections.length} Sections` : 
                            `${subjectTopics.length} Topics`
                          }
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Priority 1: Show sections if they exist */}
                        {subjectSections.length > 0 ? (
                          <div>
                            <div className="text-sm text-muted-foreground mb-4">
                              Sections available in {subject.name}:
                            </div>
                            {subjectSections.map((section: any) => {
                              const sectionTopics = getSectionTopics(section.id);
                              
                              return (
                                <div key={section.id} className="border rounded-lg p-4 space-y-3 bg-blue-50/30">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-base text-blue-800">{section.name}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {sectionTopics.length} topics
                                    </Badge>
                                  </div>
                                  
                                  {/* Show topics under this section */}
                                  {sectionTopics.length > 0 ? (
                                    <div className="ml-2 space-y-3">
                                      <div className="text-sm text-blue-700 font-medium">
                                        Topics in this section:
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {sectionTopics.map((topic: any) => {
                                          const key = `${subject.name}-${section.name}-${topic.name}`;
                                          const currentCount = selectedTopics[key]?.questionCount || 0;
                                          
                                          return (
                                            <div key={topic.id} className="border rounded-lg p-3 space-y-2 bg-white">
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  checked={currentCount > 0}
                                                  onCheckedChange={(checked) => {
                                                    if (!checked) {
                                                      handleTopicSelection(subject.name, `${section.name}-${topic.name}`, 0);
                                                    } else {
                                                      handleTopicSelection(subject.name, `${section.name}-${topic.name}`, 5);
                                                    }
                                                  }}
                                                />
                                                <label className="text-sm font-medium text-gray-800 cursor-pointer">
                                                  {topic.name}
                                                </label>
                                              </div>
                                              
                                              {currentCount > 0 && (
                                                <div className="space-y-1 ml-6">
                                                  <label className="text-xs text-muted-foreground">Questions</label>
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={currentCount}
                                                    onChange={(e) => {
                                                      const count = parseInt(e.target.value) || 0;
                                                      handleTopicSelection(subject.name, `${section.name}-${topic.name}`, count);
                                                    }}
                                                    className="h-8 text-sm"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground ml-4 italic">
                                      No topics available in this section
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Priority 2: Show direct topics only when NO sections exist */
                          <div>
                            <div className="text-sm text-muted-foreground mb-3">
                              Direct topics (no sections defined):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {subjectTopics.map((topic: any) => {
                                const key = `${subject.name}-${topic.name}`;
                                const currentCount = selectedTopics[key]?.questionCount || 0;
                                
                                return (
                                  <div key={topic.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={currentCount > 0}
                                        onCheckedChange={(checked) => {
                                          if (!checked) {
                                            handleTopicSelection(subject.name, topic.name, 0);
                                          } else {
                                            handleTopicSelection(subject.name, topic.name, 5);
                                          }
                                        }}
                                      />
                                      <label className="text-sm font-medium cursor-pointer">{topic.name}</label>
                                    </div>
                                    
                                    {currentCount > 0 && (
                                      <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">Questions</label>
                                        <Input
                                          type="number"
                                          min="1"
                                          max="50"
                                          value={currentCount}
                                          onChange={(e) => {
                                            const count = parseInt(e.target.value) || 0;
                                            handleTopicSelection(subject.name, topic.name, count);
                                          }}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected Topics Summary */}
            {Object.keys(selectedTopics).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Topics Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(selectedTopics).map(([key, data]) => {
                      const [subject, topic] = key.split('-');
                      return (
                        <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm">
                            <span className="font-medium">{subject}</span> - {topic}
                          </span>
                          <Badge variant="secondary">{data.questionCount} questions</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowTopicSelector(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleGenerateFromTopics();
                setShowTopicSelector(false);
              }}
              disabled={Object.keys(selectedTopics).length === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {totalQuestions} Questions
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}