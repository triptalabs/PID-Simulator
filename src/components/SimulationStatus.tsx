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
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
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
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Estado de conexión y simulación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Estado de Simulación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badges de estado */}
          <div className="flex gap-2">
            <Badge variant={connectionStatus.variant} className="flex items-center gap-1">
              {connectionStatus.icon}
              Worker: {connectionStatus.text}
            </Badge>
            <Badge variant={simulationStatus.variant}>
              Simulación: {simulationStatus.text}
            </Badge>
          </div>

          {/* Controles */}
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={!isConnected || isRunning}
              size="sm"
              className="flex items-center gap-1"
            >
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
            
            <Button
              onClick={handlePause}
              disabled={!isConnected || !isRunning}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
            
            <Button
              onClick={handleReset}
              disabled={!isConnected}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Datos actuales */}
          {currentData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

          {/* Métricas de rendimiento */}
          {state.performance.samples_processed > 0 && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  Muestras: {state.performance.samples_processed.toLocaleString()}
                </div>
                <div>
                  Uptime: {Math.floor(state.performance.uptime / 60)}m {Math.floor(state.performance.uptime % 60)}s
                </div>
                <div>
                  Ciclo avg: {state.performance.avg_cycle_time.toFixed(1)}ms
                </div>
                <div>
                  CPU: {state.performance.cpu_usage_estimate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta de error */}
      {state.lastError && (
        <Alert variant={state.lastError.severity === 'warning' ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-start">
            <div>
              <div className="font-medium">
                {state.lastError.severity.toUpperCase()}: {state.lastError.message}
              </div>
              {state.lastError.details && (
                <div className="text-sm mt-1 opacity-80">
                  {JSON.stringify(state.lastError.details)}
                </div>
              )}
              {state.lastError.suggestions && (
                <ul className="text-sm mt-1 opacity-80 list-disc list-inside">
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
              className="ml-2 shrink-0"
            >
              Cerrar
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
