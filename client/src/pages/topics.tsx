import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, FileText, Search } from "lucide-react";
import { Topic } from "@shared/schema";

export default function Topics() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all topics
  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  // Get unique categories
  const categories = topics
    ? Array.from(new Set(topics.map((topic) => topic.category)))
    : [];

  // Filter topics based on search query
  const filteredTopics = topics
    ? topics.filter(
        (topic) =>
          topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Start a quiz on the selected topic
  const handleStartQuiz = async (topicId: number) => {
    try {
      const res = await apiRequest("POST", "/api/quizzes/generate", { topicId });
      const data = await res.json();
      navigate(`/quiz/${data.quiz.id}`);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
    }
  };

  const renderTopicCard = (topic: Topic) => (
    <Card key={topic.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle>{topic.name}</CardTitle>
        <CardDescription>{topic.category}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{topic.description}</p>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 pt-3">
        <div className="flex space-x-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/chat?topic=${topic.id}`)}
          >
            <FileText className="h-4 w-4 mr-2" /> Study Notes
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => handleStartQuiz(topic.id)}
          >
            <BookOpen className="h-4 w-4 mr-2" /> Start Quiz
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Topics</h1>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Topics</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all">
                {searchQuery && filteredTopics.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No topics found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTopics.map(renderTopicCard)}
                  </div>
                )}
              </TabsContent>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTopics
                      .filter((topic) => topic.category === category)
                      .map(renderTopicCard)}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
