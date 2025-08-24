
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, FileText, Thermometer, Gauge, Settings, Zap, BookOpen } from "lucide-react";
import { HelpDialog } from "./HelpDialog";
import { useState } from "react";
import CardNav from "./customUI/CardNav/CardNav";
import { SimulatorState } from "@/lib/types";

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
    // Aquí puedes agregar la lógica para abrir la documentación
    console.log("Abrir documentación");
  };

  // Configurar las cards para el CardNav con controles reales del simulador
  const cardNavItems = [
    {
      label: "Control PID",
      bgColor: "#1e293b", // slate-800
      textColor: "#f8fafc", // slate-50
      controls: [
        {
          label: "Setpoint",
          value: state?.setpoint || 60,
          min: 0,
          max: 200,
          step: 1,
          unit: "°C",
          onChange: (value) => onStateChange?.({ setpoint: value })
        },
        {
          label: "Kp",
          value: state?.pid?.kp || 2.0,
          min: 0,
          max: 10,
          step: 0.01,
          unit: "",
          onChange: (value) => onStateChange?.({ pid: { ...state?.pid, kp: value } })
        },
        {
          label: "Ki",
          value: state?.pid?.ki || 0.1,
          min: 0,
          max: 1,
          step: 0.001,
          unit: " s⁻¹",
          onChange: (value) => onStateChange?.({ pid: { ...state?.pid, ki: value } })
        },
        {
          label: "Kd",
          value: state?.pid?.kd || 10,
          min: 0,
          max: 200,
          step: 1,
          unit: " s",
          onChange: (value) => onStateChange?.({ pid: { ...state?.pid, kd: value } })
        }
      ]
    },
    {
      label: "Planta",
      bgColor: "#374151", // gray-700
      textColor: "#f9fafb", // gray-50
      controls: [
        {
          label: "K",
          value: state?.plant?.k || 0.03,
          min: 0,
          max: 0.1,
          step: 0.001,
          unit: "",
          onChange: (value) => onStateChange?.({ plant: { ...state?.plant, k: value } })
        },
        {
          label: "τ",
          value: state?.plant?.tau || 90,
          min: 1,
          max: 600,
          step: 1,
          unit: " s",
          onChange: (value) => onStateChange?.({ plant: { ...state?.plant, tau: value } })
        },
        {
          label: "L",
          value: state?.plant?.l || 3,
          min: 0,
          max: 15,
          step: 0.1,
          unit: " s",
          onChange: (value) => onStateChange?.({ plant: { ...state?.plant, l: value } })
        },
        {
          label: "T_amb",
          value: state?.plant?.t_amb || 25,
          min: 10,
          max: 35,
          step: 0.5,
          unit: "°C",
          onChange: (value) => onStateChange?.({ plant: { ...state?.plant, t_amb: value } })
        }
      ]
    },
    {
      label: "Configuración",
      bgColor: "#475569", // slate-600
      textColor: "#f1f5f9", // slate-100
      controls: [
        {
          label: "Ruido",
          value: state?.noise?.intensity || 0.2,
          min: 0,
          max: 2,
          step: 0.1,
          unit: "",
          onChange: (value) => onStateChange?.({ noise: { ...state?.noise, intensity: value } })
        },
        {
          label: "SSR Period",
          value: state?.ssr?.period || 2,
          min: 0.5,
          max: 10,
          step: 0.5,
          unit: " s",
          onChange: (value) => onStateChange?.({ ssr: { ...state?.ssr, period: value } })
        }
      ]
    }
  ];

  return (
    <div className="relative">
      {/* CardNav como header principal */}
      <CardNav
        logo="/placeholder.svg"
        logoAlt="PID Simulator"
        items={cardNavItems}
        className=""
        ease="power3.out"
        baseColor="rgba(30, 41, 59, 0.95)"
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
