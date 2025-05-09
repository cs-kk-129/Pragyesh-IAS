import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Home,
  MessageSquare,
  Calendar,
  GraduationCap,
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const menu = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      href: "/",
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Topics",
      href: "/topics",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: "Quiz",
      href: "/quiz",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Chat",
      href: "/chat",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Plan",
      href: "/study-plan",
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-40">
      <div className="grid grid-cols-5">
        {menu.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex flex-col items-center py-2 px-1",
                (item.href === "/" ? location === "/" : location.startsWith(item.href))
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
