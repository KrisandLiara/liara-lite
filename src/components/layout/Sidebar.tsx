import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Bug, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { RecentConversationsList } from '../conversations/RecentConversationsList';
import { SystemOverviewSidebar } from '../system-overview/SystemOverviewSidebar';
import { MemoryPageSidebar } from '../memory/MemoryPageSidebar';
import { PersonalityPageSidebar } from '../personality/PersonalityPageSidebar';
import { AdminPageSidebar } from '../admin/AdminPageSidebar';
import { DebugPanel } from '@/components/debug/DebugPanel';
import { useMemory } from '@/contexts/MemoryContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { debugMessages, clearDebugMessages } = useMemory();

  const isSystemOverviewPage = location.pathname.startsWith('/app/system-overview');
  const isMemoryPage = location.pathname.startsWith('/app/memory') || location.pathname.startsWith('/app/import');
  const isPersonalityPage = location.pathname.startsWith('/app/personality');
  const isAdminPage = location.pathname.startsWith('/app/admin');
  
  // Default to chat page content if none of the others match
  const isChatPage = !isSystemOverviewPage && !isMemoryPage && !isPersonalityPage && !isAdminPage;

  const handleLogout = async () => {
    await logout();
  };

  const renderSidebarContent = () => {
    if (isSystemOverviewPage) {
      return <SystemOverviewSidebar isCollapsed={collapsed} />;
    }
    if (isMemoryPage) {
      return <MemoryPageSidebar />;
    }
    if (isPersonalityPage) {
      return <PersonalityPageSidebar />;
    }
    if (isAdminPage) {
      return <AdminPageSidebar />;
    }
    // Default to chat page content
    return <RecentConversationsList isCollapsed={collapsed} />;
  };

  return (
    <div
      className={cn(
        "bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50 transition-all duration-300 flex flex-col h-screen overflow-hidden",
        collapsed ? "w-16" : "w-80"
      )}
    >
      <div className={cn("flex items-center p-4 border-b border-slate-700/50 shrink-0", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link to="/app/chat" className="flex items-center">
            <span className="font-semibold text-xl text-sky-400">Liara</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full text-slate-400 hover:bg-slate-700/50 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
        {renderSidebarContent()}
      </div>

      <div className="mt-auto shrink-0">
        <div className="p-3 border-t border-slate-700/50">
          <Button
            variant="ghost"
            onClick={() => setIsDebugOpen(!isDebugOpen)}
            className={cn(
              "w-full flex items-center text-slate-300 hover:bg-sky-700/20 hover:text-sky-300",
              collapsed ? "justify-center px-0" : "justify-start gap-2 px-2"
            )}
            title={collapsed ? "Toggle Debug Panel" : undefined}
          >
            <Bug className="h-5 w-5" />
            {!collapsed && <span className="text-sm font-medium">Debug Panel</span>}
          </Button>
        </div>
        {isDebugOpen && !collapsed && (
          <div className="h-64 border-t border-slate-700/50">
            <DebugPanel messages={debugMessages} onClear={clearDebugMessages} />
          </div>
        )}
        <div className="p-3 border-t border-slate-700/50">
          {user && (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center text-slate-300 hover:bg-red-700/20 hover:text-red-300",
                collapsed ? "justify-center px-0" : "justify-start gap-2 px-2"
              )}
              title={collapsed ? "Log Out" : undefined}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="text-sm font-medium">Log Out</span>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};