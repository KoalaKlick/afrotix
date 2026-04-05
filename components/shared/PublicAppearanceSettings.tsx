"use client"

import { useTheme } from "next-themes";
import { Sun, Moon, Type, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function PublicAppearanceSettings() {
  const { setTheme, theme } = useTheme();
  const [fontSize, setFontSize] = useState("16");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("font-size") || "16";
    setFontSize(saved);
    document.documentElement.style.fontSize = `${saved}px`;
  }, []);

  const updateFontSize = (size: string) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem("font-size", size);
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Theme Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-14 w-14 shadow-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-2 border-primary/20 hover:border-primary/50 hover:scale-110 transition-all duration-300 group"
          >
            <div className="relative h-6 w-6">
              <Sun className="h-6 w-6 transition-all scale-100 rotate-0 dark:scale-0 dark:-rotate-90 text-yellow-500" />
              <Moon className="absolute inset-0 h-6 w-6 transition-all scale-0 rotate-90 dark:scale-100 dark:rotate-0 text-blue-400" />
            </div>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-4 p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl min-w-[140px]">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Theme</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => setTheme("light")}
            className={cn("rounded-xl mt-1 gap-3", theme === "light" && "bg-primary/10 text-primary")}
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("dark")}
            className={cn("rounded-xl gap-3", theme === "dark" && "bg-primary/10 text-primary")}
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("system")}
            className={cn("rounded-xl gap-3", theme === "system" && "bg-primary/10 text-primary")}
          >
            <SunMoon className="h-4 w-4" />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Size Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-14 w-14 shadow-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-2 border-secondary/20 hover:border-secondary/50 hover:scale-110 transition-all duration-300 group"
          >
            <Type className="h-6 w-6 text-foreground/80 group-hover:text-secondary group-hover:scale-110 transition-all" />
            <span className="sr-only">Toggle font size</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-4 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl min-w-[160px]">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">Text Size</DropdownMenuLabel>
          <div className="mt-3 flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-xl">
            {[
              { size: "14", label: "S" },
              { size: "16", label: "M" },
              { size: "18", label: "L" },
              { size: "20", label: "XL" }
            ].map((item) => (
              <Button
                key={item.size}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0 text-xs font-bold rounded-lg transition-all",
                  fontSize === item.size 
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-primary scale-105" 
                    : "hover:bg-white/50 dark:hover:bg-zinc-800/50 text-muted-foreground"
                )}
                onClick={() => updateFontSize(item.size)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
