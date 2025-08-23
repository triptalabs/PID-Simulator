
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/lib/types';

interface ChartOutputProps {
  data: ChartDataPoint[];
  embedded?: boolean;
}

export const ChartOutput = ({ data, embedded = false }: ChartOutputProps) => {
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
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Salida']}
              labelFormatter={(value) => `Tiempo: ${value}s`}
            />
            <Line
              type="monotone"
              dataKey="output"
              stroke="hsl(var(--industrial-green))"
              strokeWidth={2}
              name="Salida (%)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="industrial-control p-4 h-full min-h-0 flex flex-col">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Salida del PID (%)</h3>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Salida']}
              labelFormatter={(value) => `Tiempo: ${value}s`}
            />
            <Line
              type="monotone"
              dataKey="output"
              stroke="hsl(var(--industrial-green))"
              strokeWidth={2}
              name="Salida (%)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
