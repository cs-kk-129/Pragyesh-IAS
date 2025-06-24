import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Menu, Settings, User, Moon, Sun, CreditCard, HelpCircle, Shield, Phone, Mail, Calendar, Trophy, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'mocktest',
      title: 'Mock Test Reminder',
      message: 'You have a pending mock test - "UPSC Prelims Practice"',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'announcement',
      title: 'Admin Announcement',
      message: 'New study materials have been added to Geography section',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      type: 'study',
      title: 'Study Plan Reminder',
      message: 'Complete today\'s topics: Modern History and Polity',
      time: '3 hours ago',
      read: true
    }
  ]);
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex md:hidden">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
        <div className="flex">
          <Link to="/">
            <div className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105">
              <img 
                src="/attached_assets/Logo_Transparent_v1.png" 
                alt="Pragyesh IAS Logo" 
                className="h-10 w-10 transition-transform duration-300 group-hover:rotate-12"
              />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="transition-all duration-200 hover:scale-110">
            {theme === "light" ? (
              <Moon className="h-5 w-5 transition-transform duration-300" />
            ) : (
              <Sun className="h-5 w-5 transition-transform duration-300 rotate-180" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative transition-all duration-200 hover:scale-110">
                <Bell className="h-5 w-5 transition-transform duration-300" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs text-white font-bold">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  </div>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Button variant="ghost" size="sm" className="text-xs">
                  Mark all read
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 hover:bg-muted/50">
                    <div className="flex items-start space-x-3 w-full">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'mocktest' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'announcement' ? 'bg-green-100 text-green-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {notification.type === 'mocktest' ? <Trophy className="h-4 w-4" /> :
                         notification.type === 'announcement' ? <AlertCircle className="h-4 w-4" /> :
                         <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full transition-all duration-200 hover:scale-110">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="@username" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user.email?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Profile Section */}
                <div className="p-3 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Profile Information</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3" />
                      <span>Name: {user.username}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span>Email: {user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3" />
                      <span>Mobile: +91 98765 43210</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-3 w-3" />
                        <span>Tier: {user.accountType || 'Free'}</span>
                      </div>
                      {(!user.accountType || user.accountType === 'free') && (
                        <Button size="sm" variant="outline" className="h-6 text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Support & Help</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}