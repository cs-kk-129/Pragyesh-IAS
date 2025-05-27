import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  BookOpen,
  FileText,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type Subject = {
  id: number;
  name: string;
  description: string;
  category: string;
};

type Section = {
  id: number;
  subject_id: number;
  name: string;
  description?: string;
  subject_name?: string;
};

type Topic = {
  id: number;
  section_id: number;
  name: string;
  description?: string;
  status?: string;
  section_name?: string;
  subject_name?: string;
};

type SearchItem = {
  type: 'subject' | 'section' | 'topic';
  id: number;
  name: string;
  parent?: string;
  description?: string;
};

export default function EnhancedTopics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: allSections = [] } = useQuery<Section[]>({
    queryKey: ["/api/sections"],
  });

  const { data: allTopics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  // Build search index when data loads
  useEffect(() => {
    const items: SearchItem[] = [];
    
    // Add subjects
    subjects.forEach(subject => {
      items.push({
        type: 'subject',
        id: subject.id,
        name: subject.name,
        description: subject.description,
      });
    });

    // Add sections with parent info
    allSections.forEach(section => {
      const subject = subjects.find(s => s.id === section.subject_id);
      items.push({
        type: 'section',
        id: section.id,
        name: section.name,
        parent: subject?.name,
        description: section.description,
      });
    });

    // Add topics with parent info
    allTopics.forEach(topic => {
      const section = allSections.find(s => s.id === topic.section_id);
      const subject = subjects.find(s => s.id === section?.subject_id);
      items.push({
        type: 'topic',
        id: topic.id,
        name: topic.name,
        parent: `${subject?.name} > ${section?.name}`,
        description: topic.description,
      });
    });

    setSearchItems(items);
  }, [subjects, allSections, allTopics]);

  // Filter search results
  const filteredSearchItems = searchItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.parent && item.parent.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 10); // Limit to 10 results

  // Handle search selection
  const handleSearchSelect = (item: SearchItem) => {
    if (item.type === 'subject') {
      setExpandedSubjects(prev => new Set([...prev, item.id]));
    } else if (item.type === 'section') {
      const section = allSections.find(s => s.id === item.id);
      if (section) {
        setExpandedSubjects(prev => new Set([...prev, section.subject_id]));
      }
    } else if (item.type === 'topic') {
      const topic = allTopics.find(t => t.id === item.id);
      const section = allSections.find(s => s.id === topic?.section_id);
      if (section) {
        setExpandedSubjects(prev => new Set([...prev, section.subject_id]));
      }
    }
    setSearchTerm("");
    setShowSearchDropdown(false);
  };

  const getSubjectSections = (subjectId: number) => {
    return allSections.filter(section => section.subject_id === subjectId);
  };

  const getSectionTopics = (sectionId: number) => {
    return allTopics.filter(topic => topic.section_id === sectionId);
  };

  const toggleSubject = (subjectId: number) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: Clock },
      not_started: { color: "bg-gray-100 text-gray-800", icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status || "Not Started"}
      </Badge>
    );
  };

  const filteredSubjects = searchTerm
    ? subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSubjectSections(subject.id).some(section =>
          section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getSectionTopics(section.id).some(topic =>
            topic.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      )
    : subjects;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <MobileNav />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Study Topics</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore comprehensive UPSC curriculum organized by subjects, sections, and topics.
              </p>
            </div>

            {/* Enhanced Search with Suggestions */}
            <div className="relative max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects, sections, or topics..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearchDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSearchDropdown(searchTerm.length > 0)}
                  className="pl-9"
                />
              </div>
              
              {/* Search Suggestions Dropdown */}
              {showSearchDropdown && filteredSearchItems.length > 0 && (
                <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
                  <CardContent className="p-0">
                    {filteredSearchItems.map((item, index) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSearchSelect(item)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {item.type === 'subject' && <BookOpen className="h-4 w-4 text-blue-500" />}
                              {item.type === 'section' && <FileText className="h-4 w-4 text-green-500" />}
                              {item.type === 'topic' && <ArrowRight className="h-4 w-4 text-orange-500" />}
                              <span className="font-medium">{item.name}</span>
                            </div>
                            {item.parent && (
                              <p className="text-xs text-muted-foreground mt-1">
                                in {item.parent}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Topics Grid */}
            {subjectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-border" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubjects.map((subject) => {
                  const sections = getSubjectSections(subject.id);
                  const isExpanded = expandedSubjects.has(subject.id);
                  
                  return (
                    <Card key={subject.id} className="overflow-hidden">
                      <CardHeader 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleSubject(subject.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <BookOpen className="h-6 w-6 text-primary" />
                            <div>
                              <CardTitle className="text-xl">{subject.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {subject.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{sections.length} sections</Badge>
                            {getStatusBadge('not_started')}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0 space-y-4">
                          {sections.map((section) => {
                            const topics = getSectionTopics(section.id);
                            
                            return (
                              <div key={section.id} className="ml-8 border-l-2 border-muted pl-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5 text-green-600" />
                                    <h4 className="font-medium text-lg">{section.name}</h4>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {topics.length} topics
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {topics.map((topic) => (
                                    <Card key={topic.id} className="hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <h5 className="font-medium text-sm leading-tight">
                                            {topic.name}
                                          </h5>
                                          {getStatusBadge(topic.status)}
                                        </div>
                                        {topic.description && (
                                          <p className="text-xs text-muted-foreground mb-3">
                                            {topic.description}
                                          </p>
                                        )}
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="w-full text-xs"
                                          onClick={() => setLocation(`/quiz?topic=${topic.id}`)}
                                        >
                                          Start Practice
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}