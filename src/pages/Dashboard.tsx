
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { ControlsPanel } from "@/components/ControlsPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { TimeWindowSelect } from "@/components/TimeWindowSelect";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { ChartsPanel } from "@/components/ChartsPanel";
import { SimulationStatus } from "@/components/SimulationStatus";
import { SimulatorState, ChartDataPoint, TimeWindow } from "@/lib/types";
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

  // Mapear buffer del Worker a datos de charts con ventana FIFO
  useEffect(() => {
    if (!buffer || buffer.length === 0) return;
    
    // Obtener datos de la ventana de tiempo seleccionada
    const windowData = actions.getWindowData(state.timeWindow);
    
    // Transformar datos: tiempo absoluto -> tiempo relativo al momento actual
    // CORRECCIÓN: Eje X con tiempo relativo (0s = actual, -60s = hace 60s)
    const mapped: ChartDataPoint[] = windowData.map(d => {
      // Calcular tiempo relativo al momento actual: 0s = actual, valores negativos = pasado
      const timeFromCurrent = d.t - (windowData[windowData.length - 1]?.t || 0);
      
      return {
        time: timeFromCurrent,
        pv: d.PV,
        sp: d.SP,
        output: d.u * 100
      };
    }); // ← SIN REVERSE: mantener orden cronológico
    
    setChartData(mapped);
  }, [buffer, state.timeWindow, actions]);

  const handleStateChange = useCallback((updates: Partial<SimulatorState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };

      // Mapear cambios a acciones del Worker
      // 1) Setpoint
      if (typeof updates.setpoint === 'number') {
        actions.setSetpoint(updates.setpoint).catch(console.error);
      }

      // 2) PID (enviar payload completo tras merge)
      if (updates.pid) {
        const pid = { ...prev.pid, ...updates.pid };
        actions.setPID({ kp: pid.kp, ki: pid.ki, kd: pid.kd }).catch(console.error);
      }

      // 3) Planta y modo (mapear k->K, l->L, t_amb->T_amb)
      if (updates.plant || typeof updates.mode === 'string') {
        const plant = { ...prev.plant, ...(updates.plant || {}) };
        const mode = (typeof updates.mode === 'string' ? updates.mode : prev.mode) as 'horno' | 'chiller';
        actions.setPlant({
          K: plant.k,
          tau: plant.tau,
          L: plant.l,
          T_amb: plant.t_amb,
          mode
        }).catch(console.error);
      }

      // 4) Ruido (intensity -> sigma)
      if (updates.noise) {
        const noise = { ...prev.noise, ...updates.noise };
        actions.setNoise(Boolean(noise.enabled), Number(noise.intensity || 0)).catch(console.error);
      }

      // 5) SSR: no soportado en Worker aún → sin comando (UI local)

      // 6) Start/Pause según toggle de UI y estado real del Worker
      if (typeof updates.isRunning === 'boolean') {
        if (updates.isRunning && !controls.isRunning) {
          actions.start().catch(console.error);
        } else if (!updates.isRunning && controls.isRunning) {
          actions.pause().catch(console.error);
        }
      }

      return next;
    });
  }, [actions, controls.isRunning]);

  // Atajos de teclado: S (start/pause), R (reset), ↑↓ (setpoint), ←→ (ventana)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      // Start/Pause con S
      if (e.key === 's' || e.key === 'S') {
        if (controls.isRunning) {
          actions.pause().catch(console.error);
        } else {
          actions.start().catch(console.error);
        }
      }
      
      // Reset con R
      if (e.key === 'r' || e.key === 'R') {
        actions.reset(true).catch(console.error);
      }
      
      // Modificar setpoint con flechas arriba/abajo
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Prevenir scroll de la página
        
        const currentSP = state.setpoint;
        const step = e.shiftKey ? 10 : 1; // Shift + flecha = paso de 10, solo flecha = paso de 1
        
        let newSP: number;
        if (e.key === 'ArrowUp') {
          newSP = currentSP + step;
        } else {
          newSP = currentSP - step;
        }
        
        // Limitar el setpoint a rangos razonables según el modo
        if (state.mode === 'horno') {
          newSP = Math.max(0, Math.min(200, newSP)); // Horno: 0-200°C
        } else {
          newSP = Math.max(-50, Math.min(50, newSP)); // Chiller: -50-50°C
        }
        
        // Aplicar el cambio
        handleStateChange({ setpoint: newSP });
      }
      
      // Modificar ventana de tiempo con flechas izquierda/derecha
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); // Prevenir scroll de la página
        
        const currentWindow = state.timeWindow;
        const availableWindows: TimeWindow[] = [30, 60, 300]; // Ventanas disponibles según tipo TimeWindow
        const currentIndex = availableWindows.indexOf(currentWindow);
        
        let newIndex: number;
        if (e.key === 'ArrowRight') {
          // Flecha derecha: ventana más grande
          newIndex = Math.min(availableWindows.length - 1, currentIndex + 1);
        } else {
          // Flecha izquierda: ventana más pequeña
          newIndex = Math.max(0, currentIndex - 1);
        }
        
        const newWindow = availableWindows[newIndex];
        
        // Aplicar el cambio solo si es diferente
        if (newWindow !== currentWindow) {
          handleStateChange({ timeWindow: newWindow });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [actions, controls.isRunning, state.setpoint, state.mode, state.timeWindow, handleStateChange]);

  return (
    <div className="dark h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <Header state={state} onStateChange={handleStateChange} />
      <main className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4 pt-36">
        <div className="min-h-0 flex flex-col">
          <div className="flex-none">
            <SimulationStatus />
          </div>
          <div className="flex-1 overflow-y-auto mt-2 pr-1 scrollbar-thin">
            <ControlsPanel 
              state={state} 
              onStateChange={handleStateChange}
              onReset={() => actions.reset(true)}
              onApplyPreset={(values) => {
                // Mantener modo actual del estado local
                actions.setPlant({
                  K: values.k,
                  tau: values.tau,
                  L: values.l,
                  T_amb: values.t_amb,
                  mode: state.mode
                }).catch(console.error);
              }}
            />
          </div>
          <div className="flex-none mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => actions.exportCSV({ type: 'window', seconds: state.timeWindow })}>
              Exportar ventana
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => actions.exportCSV({ type: 'all' })}>
              Exportar historial
            </Button>
          </div>
        </div>
        <section className="min-h-0 grid grid-rows-[auto_auto_1fr] gap-4">
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
          <ChartsPanel data={chartData} timeWindow={state.timeWindow} />
        </section>
      </main>
    </div>
  );
};
