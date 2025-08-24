import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { ChartDataPoint } from "@/lib/types";

interface ChartsPanelProps {
  data: ChartDataPoint[];
  timeWindow?: number; // Ventana de tiempo para dominio fijo del eje X
}

export const ChartsPanel = ({ data, timeWindow }: ChartsPanelProps) => {
  return (
    <Card className="industrial-control min-h-0 flex flex-col">
      <CardHeader className="py-2">
        <CardTitle className="text-xs font-medium flex items-center gap-2">
          Gráficas
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
          <div className="h-full min-h-0">
            <ChartPVSP data={data} embedded timeWindow={timeWindow} />
          </div>
          <div className="h-full min-h-0">
            <ChartOutput data={data} embedded timeWindow={timeWindow} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


