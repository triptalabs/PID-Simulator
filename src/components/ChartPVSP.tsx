
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

  // Glassmorphism tooltip matching CardNav style exactly
  const GlassmorphismTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="nav-card select-none relative flex flex-col gap-2 p-3 rounded-lg min-w-0 flex-[1_1_auto] h-auto min-h-[100px] transition-all duration-300 overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.98)', 
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(20px)',
            zIndex: 99999
          }}
        >
          {/* Header - matching CardNav card header exactly */}
          <div className="nav-card-label font-bold tracking-tight text-[12px] mb-1 leading-tight">
            TIEMPO: {label}s
          </div>

          {/* Content - matching CardNav controls structure exactly */}
          <div className="nav-card-controls flex flex-col gap-1">
            {payload.map((entry: any, index: number) => (
              <div key={`${entry.name}-${index}`} className="control-item">
                <div className="flex items-center justify-between p-1.5 bg-white/5 rounded hover:bg-white/10 transition-colors">
                  <span className="text-[10px] font-semibold opacity-90">{entry.name}</span>
                  <span className="text-[10px] font-bold font-mono opacity-95 bg-white/10 px-1.5 py-0.5 rounded">
                    {entry.value.toFixed(1)}°C
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (embedded) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <div className="flex items-center justify-center mb-4">
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
              <Tooltip content={<GlassmorphismTooltip />} />
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
      <div className="flex items-center justify-center mb-6">
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
            <Tooltip content={<GlassmorphismTooltip />} />
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
