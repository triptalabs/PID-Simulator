
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ControlsPanel } from "@/components/ControlsPanel";
import { MetricCard } from "@/components/MetricCard";
import { TimeWindowSelect } from "@/components/TimeWindowSelect";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { SimulatorState, ChartDataPoint, MetricData } from "@/lib/types";

const initialState: SimulatorState = {
  mode: 'horno',
  setpoint: 60,
  pid: {
    kp: 2.00,
    ki: 0.10,
    kd: 10
  },
  plant: {
    k: 0.03,
    tau: 90,
    l: 3,
    t_amb: 25
  },
  noise: {
    enabled: false,
    intensity: 0.2
  },
  ssr: {
    enabled: false,
    period: 2
  },
  timeWindow: 60,
  isRunning: false
};

// Generate mock data for demonstration
const generateMockData = (timeWindow: number, setpoint: number): ChartDataPoint[] => {
  const points: ChartDataPoint[] = [];
  const numPoints = Math.min(100, timeWindow * 2);
  
  for (let i = 0; i < numPoints; i++) {
    const time = (i / numPoints) * timeWindow;
    
    // Simple mock PV response (step response with some overshoot)
    const normalizedTime = time / timeWindow;
    let pv = setpoint * (1 - Math.exp(-normalizedTime * 4)) * (1 + 0.1 * Math.sin(normalizedTime * 8));
    
    // Add some noise if enabled
    pv += (Math.random() - 0.5) * 2;
    
    // Mock PID output (inverse relationship to error)
    const error = setpoint - pv;
    const output = Math.max(0, Math.min(100, 50 + error * 2 + (Math.random() - 0.5) * 10));
    
    points.push({
      time: parseFloat(time.toFixed(1)),
      pv: parseFloat(pv.toFixed(1)),
      sp: setpoint,
      output: parseFloat(output.toFixed(1))
    });
  }
  
  return points;
};

const calculateMetrics = (data: ChartDataPoint[]): MetricData => {
  if (data.length < 10) return { overshoot: null, settlingTime: null };
  
  const setpoint = data[0]?.sp || 0;
  const maxPV = Math.max(...data.map(d => d.pv));
  const overshoot = ((maxPV - setpoint) / setpoint) * 100;
  
  // Mock settling time calculation
  const settlingTime = data.length * 0.6; // Roughly 60% of the time window
  
  return {
    overshoot: overshoot > 0 ? overshoot : null,
    settlingTime: settlingTime
  };
};

export const Dashboard = () => {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [metrics, setMetrics] = useState<MetricData>({ overshoot: null, settlingTime: null });

  const handleStateChange = (updates: Partial<SimulatorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Generate new data when key parameters change
  useEffect(() => {
    const data = generateMockData(state.timeWindow, state.setpoint);
    setChartData(data);
    setMetrics(calculateMetrics(data));
  }, [state.setpoint, state.timeWindow, state.pid, state.isRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handleStateChange({ isRunning: !state.isRunning });
          break;
        case 'r':
          e.preventDefault();
          // Reset logic would go here
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [state.isRunning]);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 p-6">
        {/* Left Panel - Controls */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <ControlsPanel state={state} onStateChange={handleStateChange} />
        </div>
        
        {/* Right Panel - Charts and Metrics */}
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Overshoot"
              value={metrics.overshoot}
              unit="%"
              subtitle="Máximo sobrepaso"
              tooltip="Porcentaje de sobrepaso respecto al setpoint"
            />
            <MetricCard
              title="tₛ (±2%)"
              value={metrics.settlingTime}
              unit="s"
              subtitle="Tiempo de establecimiento"
              tooltip="Tiempo para establecerse dentro del ±2% del setpoint"
            />
          </div>
          
          {/* Time Window Control */}
          <div className="flex justify-end">
            <TimeWindowSelect
              value={state.timeWindow}
              onValueChange={(timeWindow) => handleStateChange({ timeWindow })}
            />
          </div>
          
          {/* Charts */}
          <div className="space-y-6">
            <ChartPVSP data={chartData} />
            <ChartOutput data={chartData} />
          </div>
        </div>
      </main>
    </div>
  );
};
