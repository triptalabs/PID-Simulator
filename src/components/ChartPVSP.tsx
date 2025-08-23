
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/lib/types';

interface ChartPVSPProps {
  data: ChartDataPoint[];
}

export const ChartPVSP = ({ data }: ChartPVSPProps) => {
  return (
    <div className="industrial-control p-4 h-full min-h-0 flex flex-col">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        PV vs SP
      </h3>
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
