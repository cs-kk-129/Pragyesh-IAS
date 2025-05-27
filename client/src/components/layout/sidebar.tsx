import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Home,
  MessageSquare,
  Calendar,
  BarChart,
  GraduationCap,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2",
          active && "bg-accent text-accent-foreground font-medium"
        )}
      >
        {icon}
        {label}
      </Button>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const menu = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Topics",
      href: "/topics",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: "Daily Quiz",
      href: "/quiz",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "AI Chat",
      href: "/chat",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Study Plan",
      href: "/study-plan",
    },
    {
      icon: <BarChart className="h-5 w-5" />,
      label: "Progress",
      href: "/progress",
    },
  ];

  // Add admin dashboard for admin users
  if (user?.username === 'admin' || user?.email?.includes('admin')) {
    menu.push({
      icon: <Settings className="h-5 w-5" />,
      label: "Admin Panel",
      href: "/admin",
    });
  }

  return (
    <aside className="hidden md:block border-r bg-background h-screen sticky top-0 w-[250px] transition-all">
      <div className="h-full py-4 flex flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <span className="font-bold text-2xl text-primary">UPSC</span>
              <span className="ml-1 font-bold text-2xl">Prep</span>
            </div>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {menu.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={
                  item.href === "/"
                    ? location === "/"
                    : location.startsWith(item.href)
                }
              />
            ))}
          </div>
        </ScrollArea>
        <div className="mt-auto p-4">
          <div className="rounded-lg bg-primary/5 p-3">
            <h5 className="mb-2 font-medium text-sm">Need Help?</h5>
            <p className="text-sm text-muted-foreground mb-3">
              Having doubts or questions? Use the AI Chat to get instant help.
            </p>
            <Link href="/chat">
              <Button size="sm" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask a Question
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
