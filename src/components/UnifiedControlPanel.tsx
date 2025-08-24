
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Thermometer,
  Clock,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react'
import { SimulatorState } from '@/lib/types'
import { useSimulation, useSimulationData, useSimulationControls } from './SimulationProvider'

interface MetricsData {
  overshoot: number;
  t_peak: number;
  settling_time: number;
  is_calculating: boolean;
  sp_previous: number;
  pv_max: number;
  pv_min: number;
  t_start: number;
  t_current: number;
  samples_count: number;
}

interface UnifiedControlPanelProps {
  state: SimulatorState;
  onStateChange: (updates: Partial<SimulatorState>) => void;
  onReset: () => void;
  onExportWindow: () => void;
  onExportAll: () => void;
  metrics: MetricsData;
  currentPV: number;
}

export const UnifiedControlPanel = ({ 
  state, 
  onStateChange, 
  onReset, 
  onExportWindow, 
  onExportAll,
  metrics,
  currentPV
}: UnifiedControlPanelProps) => {
  const { state: simState } = useSimulation()
  const { currentData, isRunning, isConnected } = useSimulationData()
  const { start, pause, reset } = useSimulationControls()

  // Handlers
  const handleStart = async () => {
    try {
      await start()
    } catch (error) {
      console.error('Error iniciando simulación:', error)
    }
  }

  const handlePause = async () => {
    try {
      await pause()
    } catch (error) {
      console.error('Error pausando simulación:', error)
    }
  }

  const handleReset = async () => {
    try {
      await reset()
      onReset()
    } catch (error) {
      console.error('Error reseteando simulación:', error)
    }
  }

  // Status helpers
  const getConnectionStatus = () => {
    if (!isConnected) {
      return {
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-3 w-3" />,
        text: 'Desconectado'
      }
    }
    
    if (!simState.isInitialized) {
      return {
        variant: 'secondary' as const,
        icon: <Clock className="h-3 w-3" />,
        text: 'Inicializando'
      }
    }
    
    return {
      variant: 'default' as const,
      icon: <CheckCircle className="h-3 w-3" />,
      text: 'Conectado'
    }
  }

  const connectionStatus = getConnectionStatus()

  // Format helpers
  const formatOvershoot = (overshoot: number) => {
    if (overshoot === 0) return "0%";
    return `${overshoot.toFixed(1)}%`;
  }

  const formatTime = (time: number) => {
    if (time === 0) return "N/A";
    return `${time.toFixed(1)}s`;
  }

  const formatTemperature = (temp: number) => {
    return `${temp.toFixed(1)}°C`;
  }

  const getOvershootColor = (overshoot: number) => {
    if (overshoot === 0) return "bg-gray-500";
    if (overshoot < 5) return "bg-green-500";
    if (overshoot < 15) return "bg-yellow-500";
    if (overshoot < 30) return "bg-orange-500";
    return "bg-red-500";
  }

  return (
    <Card className="industrial-panel h-fit">
      <CardContent className="p-4 space-y-4">
        {/* Header con estado de conexión */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-industrial-blue" />
            <span className="text-sm font-semibold">Panel de Control</span>
          </div>
          <Badge variant={connectionStatus.variant} className="flex items-center gap-1 text-xs h-5 px-2">
            {connectionStatus.icon}
            {connectionStatus.text}
          </Badge>
        </div>

        {/* Controles principales */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleStart}
              disabled={!isConnected || isRunning}
              size="sm"
              className="flex items-center gap-1 h-8 text-xs"
            >
              <Play className="h-3 w-3" />
              Iniciar
            </Button>
            
            <Button
              onClick={handlePause}
              disabled={!isConnected || !isRunning}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 text-xs"
            >
              <Pause className="h-3 w-3" />
              Pausar
            </Button>
            
            <Button
              onClick={handleReset}
              disabled={!isConnected}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </div>

        <Separator />

        {/* Estado actual compacto */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado Actual</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modo:</span>
                <Badge variant={state.mode === 'horno' ? 'default' : 'secondary'} className="text-xs h-4 px-1">
                  <Thermometer className="w-2 h-2 mr-1" />
                  {state.mode === 'horno' ? 'Horno' : 'Chiller'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SP:</span>
                <span className="control-value font-mono">{state.setpoint}°C</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PV:</span>
                <span className="control-value font-mono">{formatTemperature(currentPV)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ventana:</span>
                <span className="control-value font-mono">{state.timeWindow === 60 ? '1m' : state.timeWindow === 300 ? '5m' : '30m'}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Métricas compactas */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="h-3 w-3" />
            Métricas de Control
          </h4>
          
          {/* Estado de cálculo */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">
              {metrics.is_calculating ? "Calculando..." : "En espera"}
            </span>
            <Badge 
              variant={metrics.is_calculating ? "default" : "secondary"}
              className={`text-xs h-4 px-2 ${metrics.is_calculating ? "bg-blue-500" : ""}`}
            >
              {metrics.is_calculating ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          {/* Overshoot compacto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">Overshoot</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${getOvershootColor(metrics.overshoot)} text-white border-0 text-xs h-4 px-2`}
              >
                {formatOvershoot(metrics.overshoot)}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, metrics.overshoot / 2)} 
              className="h-1"
            />
          </div>

          {/* Tiempo de establecimiento */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-medium">Tiempo Est.</span>
            </div>
            <span className="text-xs font-mono">
              {formatTime(metrics.settling_time > 0 ? metrics.settling_time + 2 : 0)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Exportación compacta */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exportar</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportWindow}
              className="w-full text-xs h-7"
            >
              <Download className="w-3 h-3 mr-1" />
              Ventana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportAll}
              className="w-full text-xs h-7"
            >
              <Download className="w-3 h-3 mr-1" />
              Todo
            </Button>
          </div>
        </div>

        {/* Datos en tiempo real si están disponibles */}
        {currentData && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-muted/20 rounded">
                <div className="text-muted-foreground">Tiempo</div>
                <div className="font-mono font-medium">{currentData.t.toFixed(1)}s</div>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded">
                <div className="text-muted-foreground">Salida</div>
                <div className="font-mono font-medium">{(currentData.u * 100).toFixed(1)}%</div>
              </div>
            </div>
          </>
        )}

        {/* Atajos de teclado */}
        <div className="pt-2 border-t border-muted/20">
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <div className="grid grid-cols-2 gap-1">
              <span><kbd className="text-[9px] bg-muted px-1 rounded">S</kbd> Start/Pause</span>
              <span><kbd className="text-[9px] bg-muted px-1 rounded">R</kbd> Reset</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span><kbd className="text-[9px] bg-muted px-1 rounded">↑/↓</kbd> SP ±1°C</span>
              <span><kbd className="text-[9px] bg-muted px-1 rounded">←/→</kbd> Ventana</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
