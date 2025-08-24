
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
        <SelectTrigger className="w-20 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">30 s</SelectItem>
          <SelectItem value="60">60 s</SelectItem>
          <SelectItem value="300">300 s</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
