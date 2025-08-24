
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeWindow } from "@/lib/types";

interface TimeWindowSelectProps {
  value: TimeWindow;
  onValueChange: (value: TimeWindow) => void;
}

export const TimeWindowSelect = ({ value, onValueChange }: TimeWindowSelectProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ventana:</span>
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onValueChange(parseInt(val) as TimeWindow)}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="60">1m</SelectItem>
          <SelectItem value="300">5m</SelectItem>
          <SelectItem value="1800">30m</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
