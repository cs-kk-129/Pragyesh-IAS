import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ChatInterface from "@/components/chat/chat-interface";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatMessage } from "@shared/schema";

export default function Chat() {
  const [activeTab, setActiveTab] = useState<string>("chat");

  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/history"],
  });

  const sampleQuestions = [
    "What is the significance of the Preamble in the Indian Constitution?",
    "Explain the key differences between fundamental rights and directive principles.",
    "What were the major causes and impacts of the 1857 revolt?",
    "How does the monsoon system affect Indian agriculture?",
    "Explain the structure and functions of the NITI Aayog.",
    "What are the main features of India's New Education Policy 2020?",
    "Discuss the importance of the Goods and Services Tax (GST) reform.",
    "What are the key environmental challenges facing India today?",
    "Explain the concept of federalism in the Indian context.",
    "What is the significance of the Green Revolution in India?",
    "Discuss the role of the Election Commission of India.",
    "Explain the importance of the Right to Information Act.",
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">AI Doubt Assistant</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-8 lg:col-span-9">
              <Card className="h-[calc(100vh-12rem)]">
                <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                      <CardTitle>Doubt Solver</CardTitle>
                      <TabsList>
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                      </TabsList>
                    </div>
                    <CardDescription>
                      Ask any UPSC-related questions and get instant answers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 h-[calc(100%-5rem)]">
                    <TabsContent value="chat" className="h-full mt-0 p-0">
                      <ChatInterface chatHistory={chatHistory || []} />
                    </TabsContent>
                    <TabsContent value="history" className="h-full mt-0 p-0">
                      <div className="h-full overflow-y-auto pr-1">
                        <div className="space-y-4">
                          {chatHistory && chatHistory.length > 0 ? (
                            chatHistory.map((chat) => (
                              <div key={chat.id} className="border rounded-lg p-4">
                                <div className="mb-2">
                                  <p className="font-medium text-primary">You asked:</p>
                                  <p className="text-sm">{chat.message}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-primary">AI response:</p>
                                  <p className="text-sm whitespace-pre-line">{chat.response}</p>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {new Date(chat.createdAt).toLocaleString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-muted-foreground">
                              <p>No chat history yet. Start asking questions!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
            <div className="md:col-span-4 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Sample Questions</CardTitle>
                  <CardDescription>Click on any question to ask</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveTab("chat");
                          const event = new CustomEvent("ask-question", {
                            detail: { question },
                          });
                          window.dispatchEvent(event);
                        }}
                        className="text-left p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
