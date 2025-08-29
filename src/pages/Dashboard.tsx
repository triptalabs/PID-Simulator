import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { UnifiedControlPanel } from "@/components/UnifiedControlPanel";
import { ChartsPanel } from "@/components/ChartsPanel";
import { SimulatorState, ChartDataPoint, TimeWindow } from "@/lib/types";
import { useSimulation, useSimulationData, useSimulationControls } from "@/components/SimulationProvider";

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
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { state: simState, actions } = useSimulation();
  const { currentData, buffer } = useSimulationData();
  const controls = useSimulationControls();

  // Mapear buffer del Worker a datos de charts con ventana FIFO
  useEffect(() => {
    // Si no hay buffer o está vacío, limpiar chartData
    if (!buffer || buffer.length === 0) {
      setChartData([]);
      return;
    }
    
    // Obtener datos de la ventana de tiempo seleccionada
    const windowData = actions.getWindowData(state.timeWindow);
    
    // Si no hay datos en la ventana, limpiar chartData
    if (windowData.length === 0) {
      setChartData([]);
      return;
    }
    
    // Transformar datos: tiempo absoluto -> tiempo relativo al momento actual
    const mapped: ChartDataPoint[] = windowData.map(d => {
      // Calcular tiempo relativo al momento actual: 0s = actual, valores negativos = pasado
      const currentTime = windowData[windowData.length - 1]?.t || 0;
      const timeFromCurrent = d.t - currentTime;
      
      return {
        time: timeFromCurrent,
        pv: d.PV,
        sp: d.SP,
        output: d.u * 100
      };
    });
    
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
      
      // Start/Pause with S
      if (e.key === 's' || e.key === 'S') {
        if (controls.isRunning) {
          actions.pause().catch(console.error);
        } else {
          actions.start().catch(console.error);
        }
      }
      
      // Reset with R
      if (e.key === 'r' || e.key === 'R') {
        actions.reset(true).catch(console.error);
      }
      
      // Modify setpoint with up/down arrows
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        const currentSP = state.setpoint;
        const step = e.shiftKey ? 10 : 1;
        
        let newSP: number;
        if (e.key === 'ArrowUp') {
          newSP = currentSP + step;
        } else {
          newSP = currentSP - step;
        }
        
        if (state.mode === 'horno') {
          newSP = Math.max(0, Math.min(200, newSP));
        } else {
          newSP = Math.max(-50, Math.min(50, newSP));
        }
        
        handleStateChange({ setpoint: newSP });
      }
      
      // Modify time window with left/right arrows
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        const currentWindow = state.timeWindow;
        const availableWindows: TimeWindow[] = [60, 300, 1800];
        const currentIndex = availableWindows.indexOf(currentWindow);
        
        let newIndex: number;
        if (e.key === 'ArrowRight') {
          newIndex = Math.min(availableWindows.length - 1, currentIndex + 1);
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }
        
        const newWindow = availableWindows[newIndex];
        
        if (newWindow !== currentWindow) {
          handleStateChange({ timeWindow: newWindow });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [actions, controls.isRunning, state.setpoint, state.mode, state.timeWindow, handleStateChange]);

  // Callback para detectar cuando el header se expande/comprime con animación
  const handleHeaderStateChange = useCallback((expanded: boolean) => {
    setIsTransitioning(true);
    setIsHeaderExpanded(expanded);
    
    // Permitir que la animación se complete antes de permitir otra transición
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Duración de la transición más un pequeño buffer
  }, []);

  return (
    <div className="dark h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header con altura fija y animación */}
      <div className="flex-shrink-0 z-50 transition-all duration-500 ease-in-out">
        <Header 
          state={state} 
          onStateChange={handleStateChange}
          onExpansionChange={handleHeaderStateChange}
        />
      </div>
      
      {/* Contenido principal con layout dinámico y animaciones */}
      <div className="flex-1 min-h-0 relative">
        {/* Overlay de transición para suavizar cambios */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 transition-opacity duration-300 ease-in-out" />
        )}
        
        {/* Layout expandido con animaciones */}
        <div 
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            isHeaderExpanded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
            {/* Contenedor centrado con ancho máximo igual al header */}
            <div className="w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-4 h-full">
            {/* Panel de control lateral con animación de entrada */}
            <div className="flex-shrink-0 w-full lg:w-80 xl:w-96 animate-in slide-in-from-left-4 duration-500">
              <UnifiedControlPanel 
                state={state} 
                onStateChange={handleStateChange}
                onReset={() => actions.reset(true)}
                onExportWindow={() => actions.exportCSV({ type: 'window', seconds: state.timeWindow })}
                onExportAll={() => actions.exportCSV({ type: 'all' })}
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
                currentPV={chartData.length > 0 ? chartData[chartData.length - 1]?.pv || 0 : 0}
              />
            </div>
            
                         {/* Panel de gráficas con animación de entrada */}
             <div className="flex-1 min-h-0 animate-in slide-in-from-right-4 duration-500 delay-100">
               <ChartsPanel data={chartData} timeWindow={state.timeWindow} isRunning={controls.isRunning} />
             </div>
            </div>
          </div>
        </div>
        
        {/* Layout comprimido con animaciones */}
        <div 
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            !isHeaderExpanded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="h-full flex flex-col gap-2 p-2">
            {/* Contenedor centrado con ancho máximo igual al header */}
            <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-2 h-full p-2">
              {/* Panel de control con animación de entrada - altura fija */}
              <div className="flex-shrink-0 w-full animate-in slide-in-from-top-4 duration-500">
                <UnifiedControlPanel 
                  state={state} 
                  onStateChange={handleStateChange}
                  onReset={() => actions.reset(true)}
                  onExportWindow={() => actions.exportCSV({ type: 'window', seconds: state.timeWindow })}
                  onExportAll={() => actions.exportCSV({ type: 'all' })}
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
                  currentPV={chartData.length > 0 ? chartData[chartData.length - 1]?.pv || 0 : 0}
                  compact={true}
                />
              </div>
              
                             {/* Panel de gráficas con animación de entrada - altura restante */}
               <div className="flex-1 min-h-0 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                 <ChartsPanel data={chartData} timeWindow={state.timeWindow} isRunning={controls.isRunning} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
