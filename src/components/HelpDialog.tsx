
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cómo usar este simulador (UI)</DialogTitle>
          <DialogDescription className="space-y-4 text-sm">
            <p>
              Este prototipo muestra la interfaz para ajustar el controlador PID 
              y parámetros de planta. No ejecuta una simulación real.
            </p>
            <p>
              Los sliders solo cambian valores visibles. Las gráficas muestran 
              datos simulados para demostrar la funcionalidad visual.
            </p>
            <p>
              Próximamente se conectará la lógica de simulación PID real con 
              cálculos de control y respuesta del sistema.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Atajos de teclado:</h4>
              <ul className="space-y-1 text-sm font-mono">
                <li><strong>S</strong> - Iniciar/Pausar simulación</li>
                <li><strong>R</strong> - Reset del sistema</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
