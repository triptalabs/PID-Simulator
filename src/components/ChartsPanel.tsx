
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { ChartDataPoint } from "@/lib/types";
import { useEffect, useState, useRef } from "react";

interface ChartsPanelProps {
  data: ChartDataPoint[];
  timeWindow?: number;
}

export const ChartsPanel = ({ data, timeWindow }: ChartsPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef<number>(0);
  const lastTimeWindow = useRef<number | undefined>(timeWindow);

  // Asegurar que las gráficas se rendericen después de que el componente esté visible
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Forzar re-renderizado de las gráficas
      setKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Forzar re-renderizado cuando cambien los datos o la ventana
  useEffect(() => {
    if (isVisible && data.length > 0) {
      const currentTime = data[data.length - 1]?.time || 0;
      const timeChanged = Math.abs(currentTime - lastUpdateTime.current) > 0.05; // Actualizar cada 0.05 segundos para actualización más frecuente
      
      if (timeChanged || timeWindow !== lastTimeWindow.current) {
        setKey(prev => prev + 1);
        lastUpdateTime.current = currentTime;
        lastTimeWindow.current = timeWindow;
      }
    }
  }, [data, timeWindow, isVisible]);

  // Resize observer para forzar actualización cuando cambia el tamaño
  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    const resizeObserver = new ResizeObserver(() => {
      // Forzar re-renderizado cuando cambia el tamaño del contenedor
      setKey(prev => prev + 1);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isVisible]);

  return (
    <Card className="industrial-panel h-full flex flex-col transition-all duration-500 ease-in-out transform hover:scale-[1.01] hover:shadow-xl">
      <CardHeader className="flex-shrink-0 py-3 transition-all duration-300 ease-in-out">
        <CardTitle className="text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-4 duration-500">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-glow"></div>
          Gráficas de Control
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-4 pt-0 transition-all duration-500 ease-in-out">
        {isVisible && (
          <div ref={containerRef} className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="h-full min-h-0 animate-in slide-in-from-left-4 duration-500 delay-200">
              <ChartPVSP key={`pvsp-${key}`} data={data} embedded timeWindow={timeWindow} />
            </div>
            <div className="h-full min-h-0 animate-in slide-in-from-right-4 duration-500 delay-300">
              <ChartOutput key={`output-${key}`} data={data} embedded timeWindow={timeWindow} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
