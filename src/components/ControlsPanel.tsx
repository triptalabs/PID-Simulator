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
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayCircle, PauseCircle, RotateCw, Download, Zap, Info } from "lucide-react";
import { Mode, SimulatorState } from "@/lib/types";
import { presets } from "@/lib/presets";
import { toast } from "@/hooks/use-toast";

interface ControlsPanelProps {
  state: SimulatorState;
  onStateChange: (updates: Partial<SimulatorState>) => void;
}

export const ControlsPanel = ({ state, onStateChange }: ControlsPanelProps) => {
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
      onStateChange({
        plant: {
          ...state.plant,
          ...preset.values
        }
      });
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

  // Componente mejorado con sincronización bidireccional
  const SliderWithInput = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    unit, 
    tooltip, 
    sliderKey
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    tooltip: string;
    sliderKey: string;
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm">{label}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Información: ${label}`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              min={min}
              max={max}
              step={step}
              className={`w-20 h-8 text-xs ${!isValid ? 'border-red-500' : ''}`}
              aria-label={`Input numérico para ${label}`}
            />
            <Badge variant="outline" className="control-value">
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
          className="w-full"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 industrial-scroll" style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}>
      {/* Modo */}
      <Card className="industrial-control">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Modo</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Tabs 
                  value={state.mode} 
                  onValueChange={(value) => onStateChange({ mode: value as Mode })}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="horno">Horno</TabsTrigger>
                    <TabsTrigger value="chiller">Chiller</TabsTrigger>
                  </TabsList>
                </Tabs>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cambia el modo de operación. En Chiller el mando se invierte (solo informativo).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Setpoint */}
      <Card className="industrial-control">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Setpoint (°C)</CardTitle>
        </CardHeader>
        <CardContent>
          <SliderWithInput
            label="Temperatura objetivo"
            value={state.setpoint}
            min={0}
            max={200}
            step={1}
            unit="°C"
            tooltip="Temperatura objetivo del proceso"
            sliderKey="setpoint"
          />
        </CardContent>
      </Card>

      {/* PID */}
      <Card className="industrial-control">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Gains PID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            label="Ki (s⁻¹)"
            value={state.pid.ki}
            min={0}
            max={1}
            step={0.001}
            unit=" s⁻¹"
            tooltip="Ganancia integral"
            sliderKey="pid.ki"
          />
          <SliderWithInput
            label="Kd (s)"
            value={state.pid.kd}
            min={0}
            max={200}
            step={1}
            unit=" s"
            tooltip="Ganancia derivativa"
            sliderKey="pid.kd"
          />
        </CardContent>
      </Card>

      {/* Controles Avanzados */}
      <Accordion type="multiple" className="space-y-2">
        {/* Planta */}
        <AccordionItem value="plant" className="industrial-control border-none">
          <AccordionTrigger className="px-4 text-sm">
            Planta (avanzado)
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <SliderWithInput
              label="K (ganancia efectiva)"
              value={state.plant.k}
              min={0}
              max={0.1}
              step={0.001}
              unit=""
              tooltip="Ganancia estática del proceso"
              sliderKey="plant.k"
            />
            <SliderWithInput
              label="τ (constante de tiempo, s)"
              value={state.plant.tau}
              min={1}
              max={600}
              step={1}
              unit=" s"
              tooltip="Constante de tiempo del proceso"
              sliderKey="plant.tau"
            />
            <SliderWithInput
              label="L (tiempo muerto, s)"
              value={state.plant.l}
              min={0}
              max={15}
              step={0.1}
              unit=" s"
              tooltip="Tiempo muerto del proceso"
              sliderKey="plant.l"
            />
            <SliderWithInput
              label="T_amb (°C)"
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
          <AccordionTrigger className="px-4 text-sm">
            Ruido y disturbios
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Ruido</Label>
              <Switch
                checked={state.noise.enabled}
                onCheckedChange={(enabled) => 
                  onStateChange({ noise: { ...state.noise, enabled } })
                }
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
              className="w-full gap-2"
            >
              <Zap size={16} />
              Paso de carga
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Presets */}
      <Card className="industrial-control">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar preset..." />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.key} value={preset.key}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={applyPreset} 
            disabled={!selectedPreset}
            className="w-full"
          >
            Aplicar
          </Button>
        </CardContent>
      </Card>

      {/* SSR */}
      <Card className="industrial-control">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Salida / Actuación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">SSR por ventana</Label>
            <Switch
              checked={state.ssr.enabled}
              onCheckedChange={(enabled) => 
                onStateChange({ ssr: { ...state.ssr, enabled } })
              }
            />
          </div>
          {state.ssr.enabled && (
            <SliderWithInput
              label="Periodo (s)"
              value={state.ssr.period}
              min={0.5}
              max={10}
              step={0.5}
              unit=" s"
              tooltip="Periodo de la ventana SSR"
              sliderKey="ssr.period"
            />
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card className="industrial-control">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={state.isRunning ? "secondary" : "default"}
              onClick={() => onStateChange({ isRunning: !state.isRunning })}
              className="gap-2"
            >
              {state.isRunning ? (
                <>
                  <PauseCircle size={16} />
                  Pausar
                </>
              ) : (
                <>
                  <PlayCircle size={16} />
                  Iniciar
                </>
              )}
            </Button>
            <Button variant="outline" className="gap-2">
              <RotateCw size={16} />
              Reset
            </Button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" disabled className="w-full gap-2">
                  <Download size={16} />
                  Exportar CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disponible en la versión con lógica</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="text-xs text-muted-foreground text-center">
            <strong>S</strong> = Iniciar/Pausar • <strong>R</strong> = Reset
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
