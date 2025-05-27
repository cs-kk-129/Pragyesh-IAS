import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Topics from "@/pages/topics";
import DailyQuiz from "@/pages/daily-quiz";
import Chat from "@/pages/chat";
import StudyPlan from "@/pages/study-plan";
import AdminDashboard from "@/pages/admin-dashboard";
import MockTests from "@/pages/mock-tests";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/topics" component={Topics} />
      <ProtectedRoute path="/quiz" component={DailyQuiz} />
      <ProtectedRoute path="/quiz/:id" component={DailyQuiz} />
      <ProtectedRoute path="/mock-tests" component={MockTests} />
      <ProtectedRoute path="/chat" component={Chat} />
      <ProtectedRoute path="/study-plan" component={StudyPlan} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
