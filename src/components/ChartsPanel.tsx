
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { ChartDataPoint } from "@/lib/types";

interface ChartsPanelProps {
  data: ChartDataPoint[];
  timeWindow?: number;
}

export const ChartsPanel = ({ data, timeWindow }: ChartsPanelProps) => {
  return (
    <Card className="industrial-control h-full flex flex-col">
      <CardHeader className="flex-shrink-0 py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Gráficas de Control
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-4 pt-0">
        <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4">
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
