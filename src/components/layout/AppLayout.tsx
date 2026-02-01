import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationArea } from "@/components/notifications/NotificationArea";
import { RockerSwitch } from "@/components/ui/controls/RockerSwitch";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { MessageSquare, Brain, Wand2, UploadCloud, Settings, BookOpen } from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AppLayout = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user) {
            supabase.from('user_profiles').select('role').eq('id', user.id).single().then(({ data }) => {
                if (data) setIsAdmin(data.role === 'admin');
            });
        }
    }, [user]);

    const navLinks = [
        { to: "/app/chat", icon: MessageSquare, label: "Chat" },
        { to: "/app/memory", icon: Brain, label: "Memory" },
        { to: "/app/personality", icon: Wand2, label: "Personality" },
    ];

    if (isAdmin) {
        navLinks.push({ to: "/app/admin", icon: Settings, label: "Admin" });
        navLinks.push({ to: "/app/system-overview", icon: BookOpen, label: "System" });
    }
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-700/50 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-md">
           <div className="flex items-center">
             <Link to="/app/chat" className="font-semibold text-xl text-sky-400 mr-6 hidden lg:block">
               Liara
             </Link>
            <NavigationMenu>
                <NavigationMenuList>
                    {navLinks.map(link => (
                        <NavigationMenuItem key={link.to}>
                            <NavigationMenuLink asChild active={location.pathname.startsWith(link.to)}>
                                <Link
                                    to={link.to}
                                    className={cn(
                                        navigationMenuTriggerStyle(),
                                        "flex gap-2 bg-transparent text-slate-300 hover:bg-slate-700/60 hover:text-sky-300",
                                        location.pathname.startsWith(link.to) && "data-[active]:bg-slate-700/80 data-[active]:text-sky-300"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
           </div>
            <div className="flex items-center space-x-4">
                <RockerSwitch />
                <NotificationArea />
                <AuthButton />
            </div>
        </header>
        <div className="flex-1 overflow-auto p-0 no-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
