/**
 * SimulationStatus - Componente de estado y controles básicos de simulación
 * 
 * Muestra el estado de conexión del Worker y proporciona controles básicos
 * para iniciar/pausar/resetear la simulación.
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useSimulation, useSimulationData, useSimulationControls } from './SimulationProvider'

export function SimulationStatus() {
  const { state } = useSimulation()
  const { currentData, isRunning, isConnected } = useSimulationData()
  const { start, pause, reset, clearError } = useSimulationControls()

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStart = async () => {
    try {
      await start()
    } catch (error) {
      console.error('Error iniciando simulación:', error)
    }
  }

  const handlePause = async () => {
    try {
      await pause()
    } catch (error) {
      console.error('Error pausando simulación:', error)
    }
  }

  const handleReset = async () => {
    try {
      await reset()
    } catch (error) {
      console.error('Error reseteando simulación:', error)
    }
  }

  // ============================================================================
  // ESTADO DE CONEXIÓN
  // ============================================================================

  const getConnectionStatus = () => {
    if (!isConnected) {
      return {
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Desconectado'
      }
    }
    
    if (!state.isInitialized) {
      return {
        variant: 'secondary' as const,
        icon: <Clock className="h-4 w-4" />,
        text: 'Inicializando'
      }
    }
    
    return {
      variant: 'default' as const,
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Conectado'
    }
  }

  const connectionStatus = getConnectionStatus()

  // ============================================================================
  // ESTADO DE SIMULACIÓN
  // ============================================================================

  const getSimulationStatus = () => {
    switch (state.workerState) {
      case 'initializing':
        return { variant: 'secondary' as const, text: 'Inicializando' }
      case 'ready':
        return { variant: 'outline' as const, text: 'Listo' }
      case 'running':
        return { variant: 'default' as const, text: 'Ejecutándose' }
      case 'paused':
        return { variant: 'secondary' as const, text: 'Pausado' }
      case 'error':
        return { variant: 'destructive' as const, text: 'Error' }
      default:
        return { variant: 'outline' as const, text: 'Desconocido' }
    }
  }

  const simulationStatus = getSimulationStatus()

  // ============================================================================
  // WARNINGS DE TELEMETRÍA (thresholds simples)
  // ============================================================================

  const PERF_WARN_MS = 15
  const CPU_WARN_PERCENT = 80

  const avgCycleWarn = state.performance.avg_cycle_time > PERF_WARN_MS
  const cpuWarn = state.performance.cpu_usage_estimate > CPU_WARN_PERCENT


  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-2">
      {/* Estado de conexión y simulación */}
      <Card className="p-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <h3 className="text-sm font-medium">Estado de Simulación</h3>
          </div>
          <div className="flex gap-1">
            <Badge variant={connectionStatus.variant} className="flex items-center gap-1 text-xs h-5 px-1">
              {connectionStatus.icon}
              {connectionStatus.text}
            </Badge>
            <Badge variant={simulationStatus.variant} className="text-xs h-5 px-1">
              {simulationStatus.text}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {/* Controles */}
          <div className="flex gap-1">
            <Button
              onClick={handleStart}
              disabled={!isConnected || isRunning}
              size="sm"
              className="flex items-center gap-1 h-7 text-xs"
            >
              <Play className="h-3 w-3" />
              Iniciar
            </Button>
            
            <Button
              onClick={handlePause}
              disabled={!isConnected || !isRunning}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs"
            >
              <Pause className="h-3 w-3" />
              Pausar
            </Button>
            
            <Button
              onClick={handleReset}
              disabled={!isConnected}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>

          {/* Datos actuales */}
          {currentData && (
            <div className="grid grid-cols-4 gap-2 text-xs pt-1">
              <div>
                <div className="text-muted-foreground">Tiempo</div>
                <div className="font-mono">{currentData.t.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-muted-foreground">SP</div>
                <div className="font-mono">{currentData.SP.toFixed(1)}°C</div>
              </div>
              <div>
                <div className="text-muted-foreground">PV</div>
                <div className="font-mono">{currentData.PV.toFixed(1)}°C</div>
              </div>
              <div>
                <div className="text-muted-foreground">Salida</div>
                <div className="font-mono">{(currentData.u * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}

          {/* Atajos de teclado */}
          <div className="text-[10px] text-muted-foreground pt-1 border-t">
            <div className="grid grid-cols-4 gap-1">
              <div>
                <span className="text-muted-foreground">S:</span> Start/Pause
              </div>
              <div>
                <span className="text-muted-foreground">R:</span> Reset
              </div>
              <div>
                <span className="text-muted-foreground">↑/↓:</span> SP ±1°C
              </div>
              <div>
                <span className="text-muted-foreground">Shift+↑/↓:</span> SP ±10°C
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div>
                <span className="text-muted-foreground">←/→:</span> Ventana tiempo
              </div>
            </div>
          </div>

          {/* Métricas de rendimiento */}
          {state.performance.samples_processed > 0 && (
            <div className="text-[10px] text-muted-foreground pt-1 border-t">
              <div className="grid grid-cols-4 gap-1">
                <div>
                  M: <span className="font-mono">{state.performance.samples_processed.toLocaleString()}</span>
                </div>
                <div>
                  T: <span className="font-mono">{Math.floor(state.performance.uptime / 60)}m {Math.floor(state.performance.uptime % 60)}s</span>
                </div>
                <div>
                  Ciclo: <span className="font-mono">{state.performance.avg_cycle_time.toFixed(1)}ms</span>
                </div>
                <div>
                  CPU: <span className="font-mono">{state.performance.cpu_usage_estimate.toFixed(1)}%</span>
                </div>
              </div>

              {(avgCycleWarn || cpuWarn) && (
                <div className="mt-1">
                  <Alert variant="default" className="py-1 px-2 text-[10px]">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-[10px]">
                      {avgCycleWarn && (
                        <div>Advertencia: tiempo de ciclo promedio alto</div>
                      )}
                      {cpuWarn && (
                        <div>Advertencia: uso de CPU elevado</div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Alerta de error */}
      {state.lastError && (
        <Alert variant={state.lastError.severity === 'warning' ? 'default' : 'destructive'} className="py-2 text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription className="flex justify-between items-start">
            <div>
              <div className="font-medium text-xs">
                {state.lastError.severity.toUpperCase()}: {state.lastError.message}
              </div>
              {state.lastError.suggestions && (
                <ul className="text-[10px] mt-1 opacity-80 list-disc list-inside">
                  {state.lastError.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="ml-1 h-5 w-5 p-0 rounded-full"
            >
              ×
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
