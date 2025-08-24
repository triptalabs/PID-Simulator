import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Info, Thermometer, Gauge, Settings, BookOpen } from "lucide-react";
import { Mode, SimulatorState, Preset as PresetType } from "@/lib/types";
import { presets } from "@/lib/presets";
import { toast } from "@/hooks/use-toast";

interface ControlsPanelProps {
  state: SimulatorState;
  onStateChange: (updates: Partial<SimulatorState>) => void;
  onReset?: () => void;
  onApplyPreset?: (values: PresetType['values']) => void;
}

export const ControlsPanel = ({ state, onStateChange, onReset, onApplyPreset }: ControlsPanelProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  // Debouncing para evitar spam de mensajes al Worker
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  const handleSliderChange = useCallback((key: string, values: number[]) => {
    const value = values[0];
    
    // Limpiar timer anterior si existe
    if (debounceTimers[key]) {
      clearTimeout(debounceTimers[key]);
    }
    
    // Crear nuevo timer con debounce de 50ms
    const timer = setTimeout(() => {
      if (key.startsWith('pid.')) {
        const pidKey = key.split('.')[1] as keyof typeof state.pid;
        onStateChange({
          pid: { ...state.pid, [pidKey]: value }
        });
      } else if (key.startsWith('plant.')) {
        const plantKey = key.split('.')[1] as keyof typeof state.plant;
        onStateChange({
          plant: { ...state.plant, [plantKey]: value }
        });
      } else if (key.startsWith('noise.')) {
        const noiseKey = key.split('.')[1] as keyof typeof state.noise;
        onStateChange({
          noise: { ...state.noise, [noiseKey]: value }
        });
      } else if (key.startsWith('ssr.')) {
        const ssrKey = key.split('.')[1] as keyof typeof state.ssr;
        onStateChange({
          ssr: { ...state.ssr, [ssrKey]: value }
        });
      } else if (key === 'setpoint') {
        onStateChange({ setpoint: value });
      }
    }, 50); // 50ms debounce para reducir mensajes al Worker
    
    setDebounceTimers(prev => ({ ...prev, [key]: timer }));
  }, [state, onStateChange, debounceTimers]);

  // Cleanup timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    };
  }, [debounceTimers]);

  const applyPreset = () => {
    const preset = presets.find(p => p.key === selectedPreset);
    if (preset) {
      onStateChange({ plant: { ...state.plant, ...preset.values } });
      if (onApplyPreset) {
        onApplyPreset(preset.values);
      }
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

  // Componente compacto con sincronización bidireccional
  const SliderWithInput = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    unit, 
    tooltip, 
    sliderKey,
    icon
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    tooltip: string;
    sliderKey: string;
    icon?: React.ReactNode;
  }) => {
    const [inputValue, setInputValue] = useState(value.toString());
    const [isValid, setIsValid] = useState(true);

    // Sincronizar input cuando cambia el valor externo
    useEffect(() => {
      setInputValue(value.toString());
      setIsValid(true);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      const numValue = parseFloat(newValue);
      const isValidNumber = !isNaN(numValue) && isFinite(numValue);
      setIsValid(isValidNumber);
      
      if (isValidNumber) {
        // Clampear al rango válido
        const clampedValue = Math.max(min, Math.min(max, numValue));
        
        // Aplicar debounce igual que el slider
        if (debounceTimers[sliderKey]) {
          clearTimeout(debounceTimers[sliderKey]);
        }
        
        const timer = setTimeout(() => {
          if (sliderKey.startsWith('pid.')) {
            const pidKey = sliderKey.split('.')[1] as keyof typeof state.pid;
            onStateChange({
              pid: { ...state.pid, [pidKey]: clampedValue }
            });
          } else if (sliderKey.startsWith('plant.')) {
            const plantKey = sliderKey.split('.')[1] as keyof typeof state.plant;
            onStateChange({
              plant: { ...state.plant, [plantKey]: clampedValue }
            });
          } else if (sliderKey.startsWith('noise.')) {
            const noiseKey = sliderKey.split('.')[1] as keyof typeof state.noise;
            onStateChange({
              noise: { ...state.noise, [noiseKey]: clampedValue }
            });
          } else if (sliderKey.startsWith('ssr.')) {
            const ssrKey = sliderKey.split('.')[1] as keyof typeof state.ssr;
            onStateChange({
              ssr: { ...state.ssr, [ssrKey]: clampedValue }
            });
          } else if (sliderKey === 'setpoint') {
            onStateChange({ setpoint: clampedValue });
          }
        }, 50);
        
        setDebounceTimers(prev => ({ ...prev, [sliderKey]: timer }));
      }
    };

    const handleInputBlur = () => {
      const numValue = parseFloat(inputValue);
      if (isNaN(numValue) || !isFinite(numValue)) {
        // Reset al valor válido si el input es inválido
        setInputValue(value.toString());
        setIsValid(true);
      }
    };

    // Formatear valor para display
    const formatDisplayValue = (val: number) => {
      if (step < 0.01) return val.toFixed(3);
      if (step < 0.1) return val.toFixed(2);
      if (step < 1) return val.toFixed(1);
      return val.toFixed(0);
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-1">
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
              {formatDisplayValue(value)}{unit}
            </Badge>
          </div>
        </div>
        <Slider
          value={[value]}
          onValueChange={(values) => handleSliderChange(sliderKey, values)}
          min={min}
          max={max}
          step={step}
          aria-label={label}
          className="w-full h-2"
        />
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Panel Principal Compacto */}
      <Card className="industrial-control p-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Modo */}
          <div className="col-span-2">
            <div className="flex items-center mb-1 text-xs">
              <Thermometer className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="font-medium">Modo</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Tabs 
                    value={state.mode} 
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
        
        {/* Setpoint */}
        <div className="mb-4">
          <SliderWithInput
            label="Setpoint"
            value={state.setpoint}
            min={0}
            max={200}
            step={1}
            unit="°C"
            tooltip="Temperatura objetivo del proceso"
            sliderKey="setpoint"
            icon={<Thermometer className="h-3 w-3" />}
          />
        </div>

        {/* PID */}
        <div className="mb-3">
          <div className="flex items-center mb-2 text-xs">
            <Gauge className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="font-medium">Parámetros PID</span>
          </div>
          <div className="space-y-3">
            <SliderWithInput
              label="Kp"
              value={state.pid.kp}
              min={0}
              max={10}
              step={0.01}
              unit=""
              tooltip="Ganancia proporcional"
              sliderKey="pid.kp"
            />
            <SliderWithInput
              label="Ki"
              value={state.pid.ki}
              min={0}
              max={1}
              step={0.001}
              unit=" s⁻¹"
              tooltip="Ganancia integral"
              sliderKey="pid.ki"
            />
            <SliderWithInput
              label="Kd"
              value={state.pid.kd}
              min={0}
              max={200}
              step={1}
              unit=" s"
              tooltip="Ganancia derivativa"
              sliderKey="pid.kd"
            />
          </div>
        </div>
      </Card>

      {/* Controles Avanzados */}
      <Accordion type="multiple" className="space-y-1">
        {/* Planta */}
        <AccordionItem value="plant" className="industrial-control border-none">
          <AccordionTrigger className="px-2 py-1 text-xs">
            <div className="flex items-center">
              <Settings className="h-3 w-3 mr-1 text-muted-foreground" />
              Planta (avanzado)
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 pt-1 pb-2 space-y-3">
            <SliderWithInput
              label="K"
              value={state.plant.k}
              min={0}
              max={0.1}
              step={0.001}
              unit=""
              tooltip="Ganancia estática del proceso"
              sliderKey="plant.k"
            />
            <SliderWithInput
              label="τ"
              value={state.plant.tau}
              min={1}
              max={600}
              step={1}
              unit=" s"
              tooltip="Constante de tiempo del proceso"
              sliderKey="plant.tau"
            />
            <SliderWithInput
              label="L"
              value={state.plant.l}
              min={0}
              max={15}
              step={0.1}
              unit=" s"
              tooltip="Tiempo muerto del proceso"
              sliderKey="plant.l"
            />
            <SliderWithInput
              label="T_amb"
              value={state.plant.t_amb}
              min={10}
              max={35}
              step={0.5}
              unit="°C"
              tooltip="Temperatura ambiente"
              sliderKey="plant.t_amb"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Ruido y Disturbios */}
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
                checked={state.noise.enabled}
                onCheckedChange={(enabled) => 
                  onStateChange({ noise: { ...state.noise, enabled } })
                }
                className="scale-75"
              />
            </div>
            {state.noise.enabled && (
              <SliderWithInput
                label="Intensidad"
                value={state.noise.intensity}
                min={0}
                max={2}
                step={0.1}
                unit=""
                tooltip="Intensidad del ruido en la señal"
                sliderKey="noise.intensity"
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
        
        {/* SSR */}
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
                checked={state.ssr.enabled}
                onCheckedChange={(enabled) => 
                  onStateChange({ ssr: { ...state.ssr, enabled } })
                }
                className="scale-75"
              />
            </div>
            {state.ssr.enabled && (
              <SliderWithInput
                label="Periodo"
                value={state.ssr.period}
                min={0.5}
                max={10}
                step={0.5}
                unit=" s"
                tooltip="Periodo de la ventana SSR"
                sliderKey="ssr.period"
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Presets */}
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
