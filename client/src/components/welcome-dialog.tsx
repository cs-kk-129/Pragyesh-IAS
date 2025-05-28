import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  Zap
} from "lucide-react";

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function WelcomeDialog({ isOpen, onClose, userName }: WelcomeDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "AI-Powered Learning",
      description: "Personalized study plans created just for you"
    },
    {
      icon: <Target className="h-6 w-6 text-blue-500" />,
      title: "Smart Mock Tests",
      description: "Practice with real exam-like questions"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      title: "Progress Tracking",
      description: "Monitor your improvement journey"
    },
    {
      icon: <BookOpen className="h-6 w-6 text-purple-500" />,
      title: "Comprehensive Coverage",
      description: "Complete UPSC syllabus at your fingertips"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0">
        <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-4 left-4 w-8 h-8 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-8 right-8 w-6 h-6 bg-blue-400 rounded-full opacity-30 animate-bounce"></div>
            <div className="absolute bottom-8 left-8 w-4 h-4 bg-green-400 rounded-full opacity-25 animate-ping"></div>
            <div className="absolute bottom-4 right-4 w-10 h-10 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
          </div>

          <div className="relative z-10 p-8 text-center">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                    <Sparkles className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Award className="h-6 w-6 text-yellow-500 animate-bounce" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Welcome to Pragyesh IAS! 🎉
              </h1>
              
              {userName && (
                <p className="text-lg text-muted-foreground">
                  Hello <span className="font-semibold text-blue-600 dark:text-blue-400">{userName}</span>! 
                </p>
              )}
              
              <p className="text-base text-muted-foreground mt-2 max-w-md mx-auto">
                Your AI-powered companion for UPSC success is ready to transform your preparation journey!
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    {feature.icon}
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-4 mb-6 border border-orange-200 dark:border-orange-800">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                ✨ Your Success Story Starts Here!
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Join thousands of successful UPSC aspirants who transformed their dreams into reality with personalized AI guidance.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center space-x-4 mb-6">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Users className="h-3 w-3 mr-1" />
                10,000+ Students
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Award className="h-3 w-3 mr-1" />
                500+ Selections
              </Badge>
            </div>

            {/* Action Button */}
            <Button 
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Start My Journey
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Let's make your UPSC dreams come true! 🚀
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}