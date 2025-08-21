
import { useState } from "react";
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
import { PlayCircle, PauseCircle, RotateCw, Download, Zap } from "lucide-react";
import { Mode, SimulatorState } from "@/lib/types";
import { presets } from "@/lib/presets";
import { toast } from "@/hooks/use-toast";

interface ControlsPanelProps {
  state: SimulatorState;
  onStateChange: (updates: Partial<SimulatorState>) => void;
}

export const ControlsPanel = ({ state, onStateChange }: ControlsPanelProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const handleSliderChange = (key: string, values: number[]) => {
    const value = values[0];
    
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
  };

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
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{label}</Label>
              <Badge variant="outline" className="control-value">
                {value.toFixed(step < 1 ? (step < 0.1 ? 3 : 2) : 0)}{unit}
              </Badge>
            </div>
            <Slider
              value={[value]}
              onValueChange={(values) => handleSliderChange(sliderKey, values)}
              min={min}
              max={max}
              step={step}
              className="w-full"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

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
