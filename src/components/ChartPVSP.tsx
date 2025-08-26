
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/lib/types';

interface ChartPVSPProps {
  data: ChartDataPoint[];
  embedded?: boolean;
  timeWindow?: number; // Ventana de tiempo para dominio fijo del eje X
}

export const ChartPVSP = ({ data, embedded = false, timeWindow }: ChartPVSPProps) => {
  // Dominio fijo del eje X basado en la ventana de tiempo
  const xAxisDomain = timeWindow ? [-timeWindow, 0] : ['dataMin', 'dataMax'];
  
  // Dominio fijo del eje Y para temperaturas coherentes (horno: 0-200°C, chiller: -50-50°C)
  const getYAxisDomain = () => {
    if (!data || data.length === 0) return [0, 100];
    
    // Calcular rangos de datos reales
    const pvValues = data.map(d => d.pv).filter(v => !isNaN(v) && isFinite(v));
    const spValues = data.map(d => d.sp).filter(v => !isNaN(v) && isFinite(v));
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

  // Custom tooltip component with glassmorphism
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">
              Tiempo: {label}s
            </span>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-0.5 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs font-medium text-white/80">
                    {entry.name}:
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-1 rounded">
                  {entry.value.toFixed(1)}°C
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex items-center justify-center gap-6 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-0.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  if (embedded) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Temperatura del Proceso
          </h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data} 
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="1 2" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                type="number"
                scale="linear"
                domain={xAxisDomain}
                ticks={xTicks}
                tickFormatter={(value) => `${value}s`}
                allowDataOverflow={false}
                allowDecimals={false}
                minTickGap={30}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                tickLine={false}
              />
              <YAxis
                domain={yAxisDomain}
                tickFormatter={(value) => `${value}°C`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line
                type="monotone"
                dataKey="pv"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                name="Proceso"
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
                isAnimationActive={false}
                className="chart-line"
              />
              <Line
                type="monotone"
                dataKey="sp"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="Setpoint"
                dot={false}
                activeDot={{ 
                  r: 3, 
                  fill: 'hsl(var(--muted-foreground))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
                isAnimationActive={false}
                className="chart-line"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container p-6 h-full min-h-0 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          Temperatura del Proceso
        </h3>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="1 2" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              type="number"
              scale="linear"
              domain={xAxisDomain}
              ticks={xTicks}
              tickFormatter={(value) => `${value}s`}
              allowDataOverflow={false}
              allowDecimals={false}
              minTickGap={30}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              tickLine={false}
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={(value) => `${value}°C`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Line
              type="monotone"
              dataKey="pv"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              name="Proceso"
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: 'hsl(var(--primary))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2
              }}
              isAnimationActive={false}
              className="chart-line"
            />
            <Line
              type="monotone"
              dataKey="sp"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="4 4"
              name="Setpoint"
              dot={false}
              activeDot={{ 
                r: 3, 
                fill: 'hsl(var(--muted-foreground))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2
              }}
              isAnimationActive={false}
              className="chart-line"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
