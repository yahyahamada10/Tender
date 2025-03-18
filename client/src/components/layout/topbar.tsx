import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Bell, HelpCircle, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "./sidebar";

interface TopbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Topbar({ toggleSidebar, isSidebarOpen }: TopbarProps) {
  const { user } = useAuth();
  const [notificationCount] = useState(3);
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {/* Search Bar */}
        <div className="flex-1 mx-4 relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              type="text" 
              placeholder="Search tenders, contracts, etc..." 
              className="w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>
        
        {/* Top navigation actions */}
        <div className="flex items-center">
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-accent relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 bg-error rounded-full text-white text-xs">
                  {notificationCount}
                </span>
              )}
            </Button>
          </div>
          
          <div className="border-l border-gray-300 h-6 mx-3"></div>
          
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-accent">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleSidebar}></div>
          <Sidebar className="fixed left-0 top-0 h-full" />
        </div>
      )}
    </header>
  );
}
