import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Info, Thermometer, Gauge, Settings, BookOpen, Minus, Plus } from "lucide-react";
import { Mode, SimulatorState, Preset as PresetType } from "@/lib/types";
import { presets } from "@/lib/presets";
import { toast } from "@/hooks/use-toast";
import ElasticSlider from "./customUI/ElasticSlider/ElasticSlider";

interface ControlsPanelProps {
  state: SimulatorState;
  onStateChange: (updates: Partial<SimulatorState>) => void;
  onReset?: () => void;
  onApplyPreset?: (values: PresetType['values']) => void;
}

interface ElasticSliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  tooltip: string;
  sliderKey: string;
  icon?: React.ReactNode;
  onValueChange: (key: string, value: number) => void;
  onImmediateValueChange: (key: string, value: number) => void;
}

const ElasticSliderWithInput = memo(({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  unit, 
  tooltip, 
  sliderKey,
  icon,
  onValueChange,
  onImmediateValueChange
}: ElasticSliderWithInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isValid, setIsValid] = useState(true);
  const [sliderValue, setSliderValue] = useState(value);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value.toString());
    setSliderValue(value);
    setIsValid(true);
  }, [value]);

  // Throttled update function
  const throttledUpdate = useCallback((newValue: number) => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = setTimeout(() => {
      onImmediateValueChange(sliderKey, newValue);
      onValueChange(sliderKey, newValue);
    }, 32); // 30fps throttling for smooth performance
  }, [sliderKey, onImmediateValueChange, onValueChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStringValue = e.target.value;
    setInputValue(newStringValue);
    
    const numValue = parseFloat(newStringValue);
    const isValidNumber = !isNaN(numValue) && isFinite(numValue);
    setIsValid(isValidNumber);
    
    if (isValidNumber) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      setSliderValue(clampedValue);
      throttledUpdate(clampedValue);
    }
  }, [min, max, throttledUpdate]);

  const handleInputBlur = useCallback(() => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !isFinite(numValue)) {
      setInputValue(value.toString());
      setIsValid(true);
    }
  }, [inputValue, value]);

  // Use MutationObserver to detect slider changes
  useEffect(() => {
    const sliderContainer = document.querySelector(`[data-slider-key="${sliderKey}"]`);
    if (!sliderContainer) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('absolute')) {
            const width = target.getBoundingClientRect().width;
            const parentWidth = target.parentElement?.getBoundingClientRect().width || 1;
            const percentage = (width / parentWidth) * 100;
            const calculatedValue = min + (percentage / 100) * (max - min);
            
            if (Math.abs(calculatedValue - sliderValue) > 0.5) {
              setSliderValue(calculatedValue);
              setInputValue(calculatedValue.toString());
              throttledUpdate(calculatedValue);
            }
          }
        }
      });
    });

    observer.observe(sliderContainer, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, [sliderKey, sliderValue, min, max, throttledUpdate]);

  const formatDisplayValue = useCallback((val: number) => {
    if (step < 0.01) return val.toFixed(3);
    if (step < 0.1) return val.toFixed(2);
    if (step < 1) return val.toFixed(1);
    return val.toFixed(0);
  }, [step]);

  const displayValue = useMemo(() => formatDisplayValue(value), [value, formatDisplayValue]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-xs">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <span className="font-medium">{label}</span>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs max-w-[200px]">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className={`w-16 h-6 text-xs px-1 py-0 ${!isValid ? 'border-red-500' : ''}`}
            aria-label={`Input numérico para ${label}`}
          />
          <Badge variant="outline" className="h-5 px-1 text-xs">
            {displayValue}{unit}
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-center px-2" data-slider-key={sliderKey}>
        <ElasticSlider
          defaultValue={sliderValue}
          startingValue={min}
          maxValue={max}
          isStepped={step > 0}
          stepSize={step}
          leftIcon={<Minus className="h-3 w-3 text-muted-foreground" />}
          rightIcon={<Plus className="h-3 w-3 text-muted-foreground" />}
          className="w-full max-w-none"
        />
      </div>
    </div>
  );
});

export const ControlsPanel = ({ state, onStateChange, onApplyPreset }: ControlsPanelProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Local state for immediate UI feedback
  const [localState, setLocalState] = useState(state);

  useEffect(() => {
    setLocalState(state);
  }, [state]);

  const handleValueChange = useCallback((key: string, value: number) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }

    const timer = setTimeout(() => {
      const keyParts = key.split('.');
      const topLevelKey = keyParts[0];
      
      if (keyParts.length > 1) {
        const secondLevelKey = keyParts[1];
        onStateChange({
          [topLevelKey]: { ...state[topLevelKey as keyof SimulatorState], [secondLevelKey]: value }
        });
      } else {
        onStateChange({ [topLevelKey]: value } as Partial<SimulatorState>);
      }
    }, 10); // Reducido de 50ms a 10ms para mejor responsividad

    debounceTimersRef.current[key] = timer;
  }, [state, onStateChange]);

  const handleImmediateValueChange = (key: string, value: number) => {
    const keyParts = key.split('.');
    const topLevelKey = keyParts[0];

    setLocalState(prevState => {
      if (keyParts.length > 1) {
        const secondLevelKey = keyParts[1];
        const topLevelState = prevState[topLevelKey as keyof SimulatorState];
        if (typeof topLevelState === 'object' && topLevelState !== null) {
          return {
            ...prevState,
            [topLevelKey]: {
              ...topLevelState,
              [secondLevelKey]: value,
            },
          };
        }
      }
      return {
        ...prevState,
        [topLevelKey]: value,
      };
    });
  };

  useEffect(() => {
    const timers = debounceTimersRef.current;
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const applyPreset = () => {
    const preset = presets.find(p => p.key === selectedPreset);
    if (preset) {
      const newState = { ...localState, plant: { ...localState.plant, ...preset.values } };
      setLocalState(newState);
      if (onApplyPreset) {
        onApplyPreset(preset.values);
      }
      onStateChange({ plant: { ...state.plant, ...preset.values } });
      toast({
        title: "Preset aplicado",
        description: `Configuración "${preset.name}" aplicada correctamente.`,
      });
    }
  };

  const handleDisturbance = () => {
    toast({
      title: "Disturbio agregado",
      description: "Disturbio agregado (placeholder)",
    });
  };

  return (
    <div className="space-y-2">
      <Card className="industrial-control p-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="col-span-2">
            <div className="flex items-center mb-1 text-xs">
              <Thermometer className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="font-medium">Modo</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Tabs 
                    value={localState.mode} 
                    onValueChange={(value) => onStateChange({ mode: value as Mode })}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 w-full h-7">
                      <TabsTrigger value="horno" className="text-xs py-0">Horno</TabsTrigger>
                      <TabsTrigger value="chiller" className="text-xs py-0">Chiller</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs max-w-[200px]">Cambia el modo de operación. En Chiller el mando se invierte (solo informativo).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="mb-4">
          <ElasticSliderWithInput
            label="Setpoint"
            value={localState.setpoint}
            min={0}
            max={200}
            step={1}
            unit="°C"
            tooltip="Temperatura objetivo del proceso"
            sliderKey="setpoint"
            icon={<Thermometer className="h-3 w-3" />}
            onValueChange={handleValueChange}
            onImmediateValueChange={handleImmediateValueChange}
          />
        </div>

        <div className="mb-3">
          <div className="flex items-center mb-2 text-xs">
            <Gauge className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="font-medium">Parámetros PID</span>
          </div>
          <div className="space-y-3">
            <ElasticSliderWithInput
              label="Kp"
              value={localState.pid.kp}
              min={0}
              max={10}
              step={0.01}
              unit=""
              tooltip="Ganancia proporcional"
              sliderKey="pid.kp"
              onValueChange={handleValueChange}
              onImmediateValueChange={handleImmediateValueChange}
            />
            <ElasticSliderWithInput
              label="Ki"
              value={localState.pid.ki}
              min={0}
              max={1}
              step={0.001}
              unit=" s⁻¹"
              tooltip="Ganancia integral"
              sliderKey="pid.ki"
              onValueChange={handleValueChange}
              onImmediateValueChange={handleImmediateValueChange}
            />
            <ElasticSliderWithInput
              label="Kd"
              value={localState.pid.kd}
              min={0}
              max={200}
              step={1}
              unit=" s"
              tooltip="Ganancia derivativa"
              sliderKey="pid.kd"
              onValueChange={handleValueChange}
              onImmediateValueChange={handleImmediateValueChange}
            />
          </div>
        </div>
      </Card>

      <Accordion type="multiple" className="space-y-1">
        <AccordionItem value="plant" className="industrial-control border-none">
          <AccordionTrigger className="px-2 py-1 text-xs">
            <div className="flex items-center">
              <Settings className="h-3 w-3 mr-1 text-muted-foreground" />
              Planta (avanzado)
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 pt-1 pb-2 space-y-3">
            <ElasticSliderWithInput
              label="K"
              value={localState.plant.k}
              min={0}
              max={0.1}
              step={0.001}
              unit=""
              tooltip="Ganancia estática del proceso"
              sliderKey="plant.k"
              onValueChange={handleValueChange}
              onImmediateValueChange={handleImmediateValueChange}
            />
            <ElasticSliderWithInput
              label="τ"
              value={localState.plant.tau}
              min={1}
              max={600}
              step={1}
              unit=" s"
              tooltip="Constante de tiempo del proceso"
              sliderKey="plant.tau"
              onValueChange={handleValueChange}
              onImmediateValueChange={handleImmediateValueChange}
            />
            <ElasticSliderWithInput
              label="L"
              value={localState.plant.l}
              min={0}
              max={15}
              step={0.1}
              unit=" s"
              tooltip="Tiempo muerto del proceso"
              sliderKey="plant.l"
              onValueChange={handleValueChange}
              onImmediateValueChange={handleImmediateValueChange}
            />
            <ElasticSliderWithInput
              label="T_amb"
              value={localState.plant.t_amb}
              min={10}
              max={35}
              step={0.5}
              unit="°C"
              tooltip="Temperatura ambiente"
              sliderKey="plant.t_amb"
              onValueChange={handleValueChange}
              onImmediateValueChange={handleImmediateValueChange}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="noise" className="industrial-control border-none">
          <AccordionTrigger className="px-2 py-1 text-xs">
            <div className="flex items-center">
              <Zap className="h-3 w-3 mr-1 text-muted-foreground" />
              Ruido y disturbios
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 pt-1 pb-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Ruido</Label>
              <Switch
                checked={localState.noise.enabled}
                onCheckedChange={(enabled) => 
                  onStateChange({ noise: { ...state.noise, enabled } })
                }
                className="scale-75"
              />
            </div>
            {localState.noise.enabled && (
              <ElasticSliderWithInput
                label="Intensidad"
                value={localState.noise.intensity}
                min={0}
                max={2}
                step={0.1}
                unit=""
                tooltip="Intensidad del ruido en la señal"
                sliderKey="noise.intensity"
                onValueChange={handleValueChange}
                onImmediateValueChange={handleImmediateValueChange}
              />
            )}
            <Button 
              variant="outline" 
              onClick={handleDisturbance}
              className="w-full h-7 text-xs gap-1 mt-1"
            >
              <Zap size={12} />
              Paso de carga
            </Button>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="ssr" className="industrial-control border-none">
          <AccordionTrigger className="px-2 py-1 text-xs">
            <div className="flex items-center">
              <Settings className="h-3 w-3 mr-1 text-muted-foreground" />
              Salida / Actuación
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 pt-1 pb-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">SSR por ventana</Label>
              <Switch
                checked={localState.ssr.enabled}
                onCheckedChange={(enabled) => 
                  onStateChange({ ssr: { ...state.ssr, enabled } })
                }
                className="scale-75"
              />
            </div>
            {localState.ssr.enabled && (
              <ElasticSliderWithInput
                label="Periodo"
                value={localState.ssr.period}
                min={0.5}
                max={10}
                step={0.5}
                unit=" s"
                tooltip="Periodo de la ventana SSR"
                sliderKey="ssr.period"
                onValueChange={handleValueChange}
                onImmediateValueChange={handleImmediateValueChange}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="industrial-control p-2">
        <div className="flex items-center mb-1 text-xs">
          <BookOpen className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="font-medium">Presets</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.key} value={preset.key} className="text-xs">
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={applyPreset} 
            disabled={!selectedPreset}
            className="h-7 text-xs"
            size="sm"
          >
            Aplicar
          </Button>
        </div>
      </Card>
    </div>
  );
};