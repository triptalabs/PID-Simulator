
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ControlsPanel } from "@/components/ControlsPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { TimeWindowSelect } from "@/components/TimeWindowSelect";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { SimulationStatus } from "@/components/SimulationStatus";
import { SimulatorState, ChartDataPoint } from "@/lib/types";
import { useSimulation, useSimulationData, useSimulationControls } from "@/components/SimulationProvider";
import { Button } from "@/components/ui/button";

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

export const Dashboard = () => {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const { state: simState, actions } = useSimulation();
  const { currentData, buffer } = useSimulationData();
  const controls = useSimulationControls();

  // Mapear buffer del Worker a datos de charts
  useEffect(() => {
    if (!buffer || buffer.length === 0) return;
    const mapped: ChartDataPoint[] = buffer.map(d => ({
      time: d.t,
      pv: d.PV,
      sp: d.SP,
      output: d.u * 100
    }));
    setChartData(mapped);
  }, [buffer]);

  const handleStateChange = (updates: Partial<SimulatorState>) => {
    setState(prev => ({ ...prev, ...updates }));
    // TODO: Enlazar cambios con actions.* para enviar al Worker (SET_PID/SET_PLANT/SET_SP/SET_NOISE)
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Header />
      <main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 p-6">
        <div className="lg:sticky lg:top-24 lg:h-fit space-y-6">
          <SimulationStatus />
          <ControlsPanel state={state} onStateChange={handleStateChange} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => actions.exportCSV({ type: 'window', seconds: state.timeWindow })}>
              Exportar ventana
            </Button>
            <Button variant="outline" onClick={() => actions.exportCSV({ type: 'all' })}>
              Exportar historial
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          <MetricsPanel 
            metrics={simState.metrics || {
              overshoot: 0,
              t_peak: 0,
              settling_time: 0,
              is_calculating: false,
              sp_previous: 0,
              pv_max: -Infinity,
              pv_min: Infinity,
              t_start: 0,
              t_current: 0,
              samples_count: 0
            }}
            currentSP={state.setpoint}
            currentPV={chartData.length > 0 ? chartData[chartData.length - 1]?.pv || 0 : 0}
          />
          <div className="flex justify-end">
            <TimeWindowSelect
              value={state.timeWindow}
              onValueChange={(timeWindow) => handleStateChange({ timeWindow })}
            />
          </div>
          <div className="space-y-6">
            <ChartPVSP data={chartData} />
            <ChartOutput data={chartData} />
          </div>
        </div>
      </main>
    </div>
  );
};
