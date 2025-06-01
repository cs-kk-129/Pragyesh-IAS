import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Trophy, BookOpen, Target, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface WelcomeBannerProps {
  onClose?: () => void;
}

export default function WelcomeBanner({ onClose }: WelcomeBannerProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if banner should be shown (first time users or returning users)
    const hasSeenBanner = localStorage.getItem('hasSeenWelcomeBanner');
    if (!hasSeenBanner && user) {
      setIsVisible(true);
      // Auto-progress through steps
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < 2) return prev + 1;
          clearInterval(timer);
          return prev;
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenWelcomeBanner', 'true');
    onClose?.();
  };

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
      title: "Comprehensive Study Material",
      description: "Access detailed notes and resources for all UPSC subjects",
      color: "bg-blue-50 border-blue-200"
    },
    {
      icon: <Target className="h-8 w-8 text-green-500" />,
      title: "AI-Powered Mock Tests",
      description: "Take realistic practice tests with instant detailed feedback",
      color: "bg-green-50 border-green-200"
    },
    {
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      title: "Performance Analytics",
      description: "Track your progress with comprehensive performance insights",
      color: "bg-yellow-50 border-yellow-200"
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto animate-in slide-in-from-bottom-4 duration-500">
        <CardContent className="p-0">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-500 p-8 text-white">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome to Pragyesh IAS, {user?.username}!
                </h1>
                <p className="text-yellow-100 text-lg">
                  Your comprehensive UPSC preparation platform is ready
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">1000+</div>
                <div className="text-yellow-100">Practice Questions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">50+</div>
                <div className="text-yellow-100">Mock Tests</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-yellow-100">AI Support</div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Key Features to Get You Started</h2>
              <p className="text-muted-foreground">
                Discover powerful tools designed to accelerate your UPSC preparation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg border-2 transition-all duration-500 ${feature.color} ${
                    currentStep >= index ? 'animate-in slide-in-from-bottom-4' : 'opacity-50'
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="animate-bounce">{feature.icon}</div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Start Actions */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Quick Start Recommendations
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Button className="justify-start bg-blue-600 hover:bg-blue-700" onClick={handleClose}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Start with Study Materials
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="justify-start" onClick={handleClose}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Take a Quick Assessment
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Account Status */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Account Status: Active</span>
                  <Badge variant="outline" className="bg-white">
                    {user?.accountType || 'Free'} Plan
                  </Badge>
                </div>
                <Button variant="link" size="sm">
                  Upgrade to Premium →
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/20 p-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Need help getting started? Check out our quick tutorial or contact support.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Skip Tour
              </Button>
              <Button size="sm" onClick={handleClose}>
                Get Started
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}