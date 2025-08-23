import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Target, AlertTriangle } from "lucide-react";

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

interface MetricsPanelProps {
  metrics: MetricsData;
  currentSP: number;
  currentPV: number;
}

export const MetricsPanel = ({ metrics, currentSP, currentPV }: MetricsPanelProps) => {
  // Formatear valores para display
  const formatOvershoot = (overshoot: number) => {
    if (overshoot === 0) return "0%";
    return `${overshoot.toFixed(1)}%`;
  };

  const formatTime = (time: number) => {
    if (time === 0) return "N/A";
    return `${time.toFixed(1)}s`;
  };

  const formatTemperature = (temp: number) => {
    return `${temp.toFixed(1)}°C`;
  };

  // Calcular color del overshoot
  const getOvershootColor = (overshoot: number) => {
    if (overshoot === 0) return "bg-gray-500";
    if (overshoot < 5) return "bg-green-500";
    if (overshoot < 15) return "bg-yellow-500";
    if (overshoot < 30) return "bg-orange-500";
    return "bg-red-500";
  };

  // Calcular progreso del overshoot (0-100%)
  const getOvershootProgress = (overshoot: number) => {
    if (overshoot === 0) return 0;
    return Math.min(100, overshoot / 2); // 2% = 100% en la barra
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Estado de Cálculo */}
      <Card className="industrial-control">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Estado de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {metrics.is_calculating ? "Calculando..." : "Esperando cambio SP"}
            </span>
            <Badge 
              variant={metrics.is_calculating ? "default" : "secondary"}
              className={metrics.is_calculating ? "bg-blue-500" : ""}
            >
              {metrics.is_calculating ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {metrics.is_calculating && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Muestras: {metrics.samples_count} · Tiempo: {formatTime(metrics.t_current - metrics.t_start)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overshoot */}
      <Card className="industrial-control">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overshoot
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Porcentaje</span>
            <Badge 
              variant="outline" 
              className={`${getOvershootColor(metrics.overshoot)} text-white border-0`}
            >
              {formatOvershoot(metrics.overshoot)}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>0%</span>
              <span>2%</span>
            </div>
            <Progress 
              value={getOvershootProgress(metrics.overshoot)} 
              className="h-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted-foreground">Tiempo pico:</span>
              <div className="font-medium">{formatTime(metrics.t_peak)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">PV máximo:</span>
              <div className="font-medium">{formatTemperature(metrics.pv_max)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempo de Establecimiento */}
      <Card className="industrial-control">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tiempo de Establecimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex items-end justify-between">
            <span className="text-xs text-muted-foreground">Tiempo total</span>
            <div className="text-sm font-semibold font-mono">
              {formatTime(metrics.settling_time > 0 ? metrics.settling_time + 2 : 0)}
            </div>
          </div>
          {metrics.settling_time > 0 && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Inicio: {formatTime(metrics.settling_time)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card className="industrial-control">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Información
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">SP anterior:</span>
            <span>{formatTemperature(metrics.sp_previous)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PV mínimo:</span>
            <span>{formatTemperature(metrics.pv_min)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tiempo inicio:</span>
            <span>{formatTime(metrics.t_start)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
