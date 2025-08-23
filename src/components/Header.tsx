
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, FileText } from "lucide-react";
import { HelpDialog } from "./HelpDialog";
import { useState } from "react";

export const Header = () => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b px-4 py-3 bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            Simulador PID — Horno / Chiller
          </h1>
          {/* Etiqueta de entorno opcional */}
          {import.meta.env.DEV && (
            <Badge variant="secondary" className="text-[10px] font-mono">DEV</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setHelpOpen(true)}
            className="gap-2"
          >
            <Info size={16} />
            Cómo usar
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <FileText size={16} />
            Docs
          </Button>
        </div>
      </div>
      
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
};
