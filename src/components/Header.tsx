
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, FileText, Thermometer, Gauge, Settings, Zap, BookOpen } from "lucide-react";
import { HelpDialog } from "./HelpDialog";
import { useState } from "react";
import CardNav from "./customUI/CardNav/CardNav";
import { SimulatorState } from "@/lib/types";
import { presets } from "@/lib/presets";

interface HeaderProps {
  state?: SimulatorState;
  onStateChange?: (updates: Partial<SimulatorState>) => void;
}

export const Header = ({ state, onStateChange }: HeaderProps) => {
  const [helpOpen, setHelpOpen] = useState(false);

  const handleHelpClick = () => {
    setHelpOpen(true);
  };

  const handleDocsClick = () => {
    console.log("Abrir documentación");
  };

  // Configurar las cards para el CardNav con TODAS las configuraciones del simulador
  const cardNavItems = [
    {
      label: "Modo de Operación",
      bgColor: "#0f172a", // slate-900
      textColor: "#f1f5f9", // slate-100
      selects: [
        {
          label: "Tipo de Sistema",
          value: state?.mode || 'horno',
          options: [
            { value: 'horno', label: 'Horno Industrial' },
            { value: 'chiller', label: 'Sistema de Enfriamiento' }
          ],
          onChange: (value: string) => onStateChange?.({ mode: value as 'horno' | 'chiller' })
        }
      ],
      controls: [
        {
          label: "Setpoint",
          value: state?.setpoint || 60,
          min: state?.mode === 'chiller' ? -50 : 0,
          max: state?.mode === 'chiller' ? 50 : 200,
          step: 1,
          unit: "°C",
          onChange: (value: number) => onStateChange?.({ setpoint: value })
        }
      ]
    },
    {
      label: "Control PID",
      bgColor: "#1e293b", // slate-800
      textColor: "#f8fafc", // slate-50
      controls: [
        {
          label: "Kp (Proporcional)",
          value: state?.pid?.kp || 2.0,
          min: 0,
          max: 10,
          step: 0.01,
          unit: "",
          onChange: (value: number) => onStateChange?.({ pid: { ...state?.pid, kp: value } })
        },
        {
          label: "Ki (Integral)",
          value: state?.pid?.ki || 0.1,
          min: 0,
          max: 1,
          step: 0.001,
          unit: " s⁻¹",
          onChange: (value: number) => onStateChange?.({ pid: { ...state?.pid, ki: value } })
        },
        {
          label: "Kd (Derivativo)",
          value: state?.pid?.kd || 10,
          min: 0,
          max: 200,
          step: 1,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ pid: { ...state?.pid, kd: value } })
        }
      ]
    },
    {
      label: "Parámetros de Planta",
      bgColor: "#374151", // gray-700
      textColor: "#f9fafb", // gray-50
      selects: [
        {
          label: "Presets de Planta",
          value: "custom",
          options: [
            { value: "custom", label: "Personalizado" },
            ...presets.map(preset => ({
              value: preset.key,
              label: preset.name
            }))
          ],
          onChange: (value: string) => {
            if (value !== "custom") {
              const preset = presets.find(p => p.key === value);
              if (preset) {
                onStateChange?.({
                  plant: {
                    k: preset.values.k,
                    tau: preset.values.tau,
                    l: preset.values.l,
                    t_amb: preset.values.t_amb
                  }
                });
              }
            }
          }
        }
      ],
      controls: [
        {
          label: "K (Ganancia Estática)",
          value: state?.plant?.k || 0.03,
          min: 0,
          max: 0.1,
          step: 0.001,
          unit: "",
          onChange: (value: number) => onStateChange?.({ plant: { ...state?.plant, k: value } })
        },
        {
          label: "τ (Constante de Tiempo)",
          value: state?.plant?.tau || 90,
          min: 1,
          max: 600,
          step: 1,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ plant: { ...state?.plant, tau: value } })
        },
        {
          label: "L (Tiempo Muerto)",
          value: state?.plant?.l || 3,
          min: 0,
          max: 15,
          step: 0.1,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ plant: { ...state?.plant, l: value } })
        },
        {
          label: "T_amb (Temperatura Ambiente)",
          value: state?.plant?.t_amb || 25,
          min: 10,
          max: 35,
          step: 0.5,
          unit: "°C",
          onChange: (value: number) => onStateChange?.({ plant: { ...state?.plant, t_amb: value } })
        }
      ]
    },
    {
      label: "Perturbaciones y Efectos",
      bgColor: "#475569", // slate-600
      textColor: "#f1f5f9", // slate-100
      switches: [
        {
          label: "Ruido en Medición",
          checked: state?.noise?.enabled || false,
          onChange: (checked: boolean) => onStateChange?.({ noise: { ...state?.noise, enabled: checked } })
        },
        {
          label: "Control SSR",
          checked: state?.ssr?.enabled || false,
          onChange: (checked: boolean) => onStateChange?.({ ssr: { ...state?.ssr, enabled: checked } })
        }
      ],
      controls: [
        {
          label: "Intensidad de Ruido",
          value: state?.noise?.intensity || 0.2,
          min: 0,
          max: 2,
          step: 0.1,
          unit: "",
          onChange: (value: number) => onStateChange?.({ noise: { ...state?.noise, intensity: value } })
        },
        {
          label: "Periodo SSR",
          value: state?.ssr?.period || 2,
          min: 0.5,
          max: 10,
          step: 0.5,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ ssr: { ...state?.ssr, period: value } })
        }
      ]
    },
    {
      label: "Visualización y Análisis",
      bgColor: "#581c87", // purple-800
      textColor: "#f3e8ff", // purple-50
      selects: [
        {
          label: "Ventana de Tiempo",
          value: String(state?.timeWindow || 60),
          options: [
            { value: "60", label: "1 minuto" },
            { value: "300", label: "5 minutos" },
            { value: "1800", label: "30 minutos" }
          ],
          onChange: (value: string) => onStateChange?.({ timeWindow: parseInt(value) as 60 | 300 | 1800 })
        }
      ],
      switches: [
        {
          label: "Simulación Activa",
          checked: state?.isRunning || false,
          onChange: (checked: boolean) => onStateChange?.({ isRunning: checked })
        }
      ]
    }
  ];

  return (
    <div className="w-full">
      {/* CardNav que se ajusta al contenido */}
      <CardNav
        logo="/placeholder.svg"
        logoAlt="PID Simulator Pro"
        items={cardNavItems}
        className="w-full"
        ease="power3.out"
        baseColor="rgba(15, 23, 42, 0.98)"
        menuColor="#f8fafc"
        buttonBgColor="#3b82f6"
        buttonTextColor="#ffffff"
        onHelpClick={handleHelpClick}
        onDocsClick={handleDocsClick}
        simulatorState={state}
        onStateChange={onStateChange}
      />
      
      {/* HelpDialog para el botón de ayuda */}
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};
