
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Download, Zap, Thermometer } from "lucide-react";
import { SimulatorState } from "@/lib/types";

interface QuickActionsProps {
  state: SimulatorState;
  onStateChange: (updates: Partial<SimulatorState>) => void;
  onReset: () => void;
  onExportWindow: () => void;
  onExportAll: () => void;
}

export const QuickActions = ({ 
  state, 
  onStateChange, 
  onReset, 
  onExportWindow, 
  onExportAll 
}: QuickActionsProps) => {
  return (
    <Card className="industrial-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-industrial-blue" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control de Simulación */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Control</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={state.isRunning ? "destructive" : "default"}
              size="sm"
              onClick={() => onStateChange({ isRunning: !state.isRunning })}
              className="w-full"
            >
              {state.isRunning ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Iniciar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-full"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Estado Actual */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Estado Actual</h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span>Modo:</span>
              <Badge variant={state.mode === 'horno' ? 'default' : 'secondary'} className="text-xs">
                <Thermometer className="w-3 h-3 mr-1" />
                {state.mode === 'horno' ? 'Horno' : 'Chiller'}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>Setpoint:</span>
              <span className="control-value">{state.setpoint}°C</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>Ventana:</span>
              <span className="control-value">{state.timeWindow}s</span>
            </div>
          </div>
        </div>

        {/* Exportación */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Exportar Datos</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportWindow}
              className="w-full text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Ventana Actual
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportAll}
              className="w-full text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Historial Completo
            </Button>
          </div>
        </div>

        {/* Atajos de Teclado */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Atajos</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>S</span>
              <span>Iniciar/Pausar</span>
            </div>
            <div className="flex justify-between">
              <span>R</span>
              <span>Reset</span>
            </div>
            <div className="flex justify-between">
              <span>↑↓</span>
              <span>Setpoint</span>
            </div>
            <div className="flex justify-between">
              <span>←→</span>
              <span>Ventana</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
