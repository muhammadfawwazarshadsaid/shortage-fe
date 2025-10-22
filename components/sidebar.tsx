"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CircleUser,
  MoreHorizontal,
  BoxIcon,
  ListTodo,
  ClipboardList, 
} from "lucide-react";

interface SidebarProps {
  isExpanded: boolean;
}

export default function Sidebar({ isExpanded }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden border-r bg-background sm:block transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-18"
        )}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link
              href="/bom" 
              className="flex items-center gap-2 font-semibold"
            >
              <BoxIcon className="h-6 w-6 text-primary" />
              {isExpanded && (
                <span className="text-lg font-semibold">Shortage Detection</span>
              )}
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/bom"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      pathname.startsWith("/bom") && "bg-accent text-primary font-semibold"
                    )}
                  >
                    <ClipboardList className="h-4 w-4" />
                    {isExpanded && <span>Bill of Materials</span>}
                  </Link>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right">Bill of Materials</TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/actions"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      pathname.startsWith("/actions") && "bg-accent text-primary font-semibold"
                    )}
                  >
                    <ListTodo className="h-4 w-4" />
                    {isExpanded && <span>Action List</span>}
                  </Link>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right">Action List</TooltipContent>
                )}
              </Tooltip>
            </nav>
          </div>

          <div className="mt-auto border-t p-2">
            {isExpanded ? (
              <div className="flex items-center gap-2 rounded-md p-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <CircleUser className="h-6 w-6" />
                </Button>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-semibold">Arshad</p>
                  <p className="truncate text-xs text-muted-foreground">
                    user@example.com
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-14 w-full items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                    >
                      <CircleUser className="h-6 w-6" />
                      <span className="sr-only">User Profile</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Arshad</p>
                  <p className="text-xs text-muted-foreground">
                    user@example.com
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}