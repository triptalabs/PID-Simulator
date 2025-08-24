
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
      <div className="h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(value) => `${value}°C`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}°C`,
                name === 'pv' ? 'Proceso' : 'Setpoint'
              ]}
              labelFormatter={(value) => `Tiempo: ${value}s`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="pv"
              stroke="hsl(var(--industrial-blue))"
              strokeWidth={2}
              name="PV (Proceso)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sp"
              stroke="hsl(var(--industrial-orange))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="SP (Setpoint)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="industrial-control p-4 h-full min-h-0 flex flex-col">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">PV vs SP</h3>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(value) => `${value}°C`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}°C`,
                name === 'pv' ? 'Proceso' : 'Setpoint'
              ]}
              labelFormatter={(value) => `Tiempo: ${value}s`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="pv"
              stroke="hsl(var(--industrial-blue))"
              strokeWidth={2}
              name="PV (Proceso)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sp"
              stroke="hsl(var(--industrial-orange))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="SP (Setpoint)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
