import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/common/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Theme:</span>
      <Button
        size="sm"
        variant={theme === "light" ? "default" : "outline"}
        onClick={() => setTheme("light")}
      >
        <Sun className="mr-2 h-4 w-4" />
        Light
      </Button>
      <Button
        size="sm"
        variant={theme === "dark" ? "default" : "outline"}
        onClick={() => setTheme("dark")}
      >
        <Moon className="mr-2 h-4 w-4" />
        Dark
      </Button>
    </div>
  );
}
