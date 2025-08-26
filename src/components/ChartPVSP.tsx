
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/lib/types';
import { useEffect, useState } from 'react';

interface ChartPVSPProps {
  data: ChartDataPoint[];
  embedded?: boolean;
  timeWindow?: number; // Ventana de tiempo para dominio fijo del eje X
}

export const ChartPVSP = ({ data, embedded = false, timeWindow }: ChartPVSPProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Actualizar datos del chart cuando cambian, con throttling mínimo para actualización frecuente
  useEffect(() => {
    if (data.length > 0) {
      // Solo actualizar si hay cambios significativos en los datos
      const currentData = data[data.length - 1];
      const lastData = chartData[chartData.length - 1];
      
      if (!lastData || 
          Math.abs(currentData.time - lastData.time) > 0.02 || // Umbral muy pequeño para actualización muy frecuente
          Math.abs(currentData.pv - lastData.pv) > 0.005 || // Umbral mínimo para cambios de PV
          Math.abs(currentData.sp - lastData.sp) > 0.005) { // Umbral mínimo para cambios de SP
        setChartData(data);
      }
    } else {
      setChartData(data);
    }
  }, [data]);

  // Dominio fijo del eje X basado en la ventana de tiempo
  const xAxisDomain = timeWindow ? [-timeWindow, 0] : ['dataMin', 'dataMax'];
  
  // Dominio fijo del eje Y para temperaturas coherentes (horno: 0-200°C, chiller: -50-50°C)
  const getYAxisDomain = () => {
    if (!chartData || chartData.length === 0) return [0, 100];
    
    // Calcular rangos de datos reales
    const pvValues = chartData.map(d => d.pv).filter(v => !isNaN(v) && isFinite(v));
    const spValues = chartData.map(d => d.sp).filter(v => !isNaN(v) && isFinite(v));
    const allValues = [...pvValues, ...spValues];
    
    if (allValues.length === 0) return [0, 100];
    
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    
    // Detectar si es horno (temperaturas altas) o chiller (temperaturas bajas)
    const isHeating = maxVal > 50; // Si hay valores > 50°C, probablemente es horno
    
    if (isHeating) {
      // Horno: dominio 0-200°C con margen
      const yMin = Math.max(0, Math.floor(minVal / 10) * 10 - 10);
      const yMax = Math.min(200, Math.ceil(maxVal / 10) * 10 + 10);
      return [yMin, yMax];
    } else {
      // Chiller: dominio -50-50°C con margen
      const yMin = Math.max(-50, Math.floor(minVal / 10) * 10 - 10);
      const yMax = Math.min(50, Math.ceil(maxVal / 10) * 10 + 10);
      return [yMin, yMax];
    }
  };
  
  const yAxisDomain = getYAxisDomain();
  
  // Generar ticks personalizados para el eje X
  const generateXTicks = (timeWindow: number) => {
    if (!timeWindow) return [];
    const ticks = [];
    const step = timeWindow / 4; // 5 ticks (-60, -45, -30, -15, 0 para ventana de 60s)
    for (let i = 0; i <= 4; i++) {
      ticks.push(-timeWindow + (i * step));
    }
    return ticks;
  };
  
  const xTicks = timeWindow ? generateXTicks(timeWindow) : undefined;
  
  if (embedded) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                scale="linear"
                domain={xAxisDomain}
                ticks={xTicks}
                tickFormatter={(value) => `${value}s`}
                allowDataOverflow={false}
                allowDecimals={false}
                minTickGap={20}
              />
              <YAxis
                domain={yAxisDomain}
                tickFormatter={(value) => `${value}°C`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  <span className="font-mono">{value.toFixed(1)}°C</span>,
                  name === 'pv' ? 'Proceso' : 'Setpoint'
                ]}
                labelFormatter={(value) => `Tiempo: ${value}s`}
                isAnimationActive={false}
                animationDuration={0}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="pv"
                stroke="hsl(var(--industrial-blue))"
                strokeWidth={2}
                name="PV (Proceso)"
                dot={{ fill: "hsl(var(--industrial-blue))", strokeWidth: 1, r: 2 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="sp"
                stroke="hsl(var(--industrial-orange))"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="SP (Setpoint)"
                dot={{ fill: "hsl(var(--industrial-orange))", strokeWidth: 1, r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="industrial-control p-4 h-full min-h-0 flex flex-col">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">PV vs SP</h3>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              type="number"
              scale="linear"
              domain={xAxisDomain}
              ticks={xTicks}
              tickFormatter={(value) => `${value}s`}
              allowDataOverflow={false}
              allowDecimals={false}
              minTickGap={20}
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={(value) => `${value}°C`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                <span className="font-mono">{value.toFixed(1)}°C</span>,
                name === 'pv' ? 'Proceso' : 'Setpoint'
              ]}
              labelFormatter={(value) => `Tiempo: ${value}s`}
              isAnimationActive={false}
              animationDuration={0}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="pv"
              stroke="hsl(var(--industrial-blue))"
              strokeWidth={2}
              name="PV (Proceso)"
              dot={{ fill: "hsl(var(--industrial-blue))", strokeWidth: 1, r: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sp"
              stroke="hsl(var(--industrial-orange))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="SP (Setpoint)"
              dot={{ fill: "hsl(var(--industrial-orange))", strokeWidth: 1, r: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
