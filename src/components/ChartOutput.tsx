
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/lib/types';

interface ChartOutputProps {
  data: ChartDataPoint[];
  embedded?: boolean;
  timeWindow?: number; // Ventana de tiempo para dominio fijo del eje X
}

export const ChartOutput = ({ data, embedded = false, timeWindow }: ChartOutputProps) => {
  // Dominio fijo del eje X basado en la ventana de tiempo
  const xAxisDomain = timeWindow ? [-timeWindow, 0] : ['dataMin', 'dataMax'];
  
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
            <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
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
                    Salida:
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-1 rounded">
                  {entry.value.toFixed(1)}%
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
        <div className="flex items-center justify-center mb-4">
          <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Salida del Controlador
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
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line
                type="monotone"
                dataKey="output"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2.5}
                name="Salida"
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: 'hsl(var(--chart-2))',
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
          Salida del Controlador
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
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Line
              type="monotone"
              dataKey="output"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2.5}
              name="Salida"
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: 'hsl(var(--chart-2))',
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
