/**
 * SimulationProvider - Context Provider para la simulación PID
 * 
 * Gestiona el estado global de la simulación y proporciona una API limpia
 * para que los componentes interactúen con el Worker de simulación.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { WorkerManager, type WorkerManagerCallbacks } from '../lib/simulation/worker-manager'
import type {
  SimulationBuffer,
  PerformanceMetrics,
  SetPIDCommand,
  SetPlantCommand,
  TickEvent,
  StateEvent,
  ReadyEvent,
  ErrorEvent
} from '../lib/simulation/types'

// ============================================================================
// TIPOS DEL CONTEXTO
// ============================================================================

export interface SimulationContextState {
  // Estado de conexión
  isConnected: boolean
  isInitialized: boolean
  isRunning: boolean
  workerState: StateEvent['payload']['state']
  
  // Datos actuales
  currentData: TickEvent['payload'] | null
  buffer: SimulationBuffer['data']
  
  // Métricas de rendimiento
  performance: PerformanceMetrics
  
  // Errores
  lastError: ErrorEvent['payload'] | null

  // Métricas de control
  metrics: {
    overshoot: number
    t_peak: number
    settling_time: number
    is_calculating: boolean
    sp_previous: number
    pv_max: number
    pv_min: number
    t_start: number
    t_current: number
    samples_count: number
  } | null
  
  // Configuración actual
  config: {
    timestep: number
    bufferSize: number
    debugMode: boolean
  }
}

export interface SimulationContextActions {
  // Control de simulación
  start: () => Promise<void>
  pause: () => Promise<void>
  reset: (preserveParams?: boolean) => Promise<void>
  
  // Configuración de parámetros
  setPID: (params: SetPIDCommand['payload']) => Promise<void>
  setPlant: (params: SetPlantCommand['payload']) => Promise<void>
  setSetpoint: (value: number, rampRate?: number) => Promise<void>
  setNoise: (enabled: boolean, sigma?: number, seed?: number) => Promise<void>
  
  // Utilidades
  getWindowData: (windowSeconds: number) => SimulationBuffer['data']
  clearBuffer: () => void
  clearError: () => void
  
  // Estado del Worker
  getWorkerStatus: () => import('../lib/simulation/worker-manager').WorkerManagerStatus

  // Exportación CSV
  exportCSV: (range: { type: 'window'; seconds: number } | { type: 'all' }) => void
}

export interface SimulationContextValue {
  state: SimulationContextState
  actions: SimulationContextActions
}

export interface SimulationProviderProps {
  children: React.ReactNode
  config?: {
    timestep?: number
    bufferSize?: number
    debugMode?: boolean
    workerPath?: string
  }
}

// ============================================================================
// CONTEXTO
// ============================================================================

const SimulationContext = createContext<SimulationContextValue | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function SimulationProvider({ children, config = {} }: SimulationProviderProps) {
  // Referencias
  const workerManagerRef = useRef<WorkerManager | null>(null)
  const isInitializingRef = useRef(false)
  
  // Estado local
  const [state, setState] = useState<SimulationContextState>({
    isConnected: false,
    isInitialized: false,
    isRunning: false,
    workerState: 'initializing',
    currentData: null,
    buffer: [],
    performance: {
      avg_cycle_time: 0,
      max_cycle_time: 0,
      cpu_usage_estimate: 0,
      uptime: 0,
      samples_processed: 0
    },
    lastError: null,
    metrics: null,
    config: {
      timestep: config.timestep || 0.1,
      bufferSize: config.bufferSize || 10000,
      debugMode: config.debugMode || false
    }
  })

  // ============================================================================
  // CALLBACKS DEL WORKER
  // ============================================================================

  const workerCallbacks: WorkerManagerCallbacks = {
    onReady: useCallback((data: ReadyEvent['payload']) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isInitialized: true,
        workerState: 'ready',
        lastError: null
      }))
      
      if (config.debugMode) {
        console.log('Simulación lista:', data)
      }
    }, [config.debugMode]),

    onTick: useCallback((data: TickEvent['payload']) => {
      setState(prev => ({
        ...prev,
        currentData: data,
        buffer: workerManagerRef.current?.getBufferData() || []
      }))
    }, []),

    onState: useCallback((data: StateEvent['payload']) => {
      setState(prev => ({
        ...prev,
        workerState: data.state,
        isRunning: data.state === 'running',
        performance: data.performance
      }))
    }, []),

    onMetrics: useCallback((data) => {
      setState(prev => ({
        ...prev,
        metrics: data
      }))
    }, []),

    onError: useCallback((data: ErrorEvent['payload']) => {
      setState(prev => ({
        ...prev,
        lastError: data,
        isConnected: data.severity !== 'critical',
        isInitialized: data.severity !== 'critical'
      }))
      
      console.error(`Error de simulación [${data.severity}]:`, data.message)
      
      if (data.suggestions) {
        console.log('Sugerencias:', data.suggestions)
      }
    }, []),

    onConnectionLost: useCallback(() => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isRunning: false,
        workerState: 'error'
      }))
      
      console.error('Conexión con Worker perdida')
    }, [])
  }

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  useEffect(() => {
    const initializeWorker = async () => {
      if (isInitializingRef.current || workerManagerRef.current) {
        return
      }
      
      isInitializingRef.current = true
      
      try {
        // Crear WorkerManager
        workerManagerRef.current = new WorkerManager({
          timestep: config.timestep,
          bufferSize: config.bufferSize,
          debugMode: config.debugMode,
          workerPath: config.workerPath
        })
        
        // Configurar callbacks
        workerManagerRef.current.setCallbacks(workerCallbacks)
        
        // Inicializar
        await workerManagerRef.current.initialize()
        
      } catch (error) {
        console.error('Error inicializando WorkerManager:', error)
        setState(prev => ({
          ...prev,
          lastError: {
            severity: 'critical',
            code: 'INIT_002',
            message: `Error inicializando simulación: ${error.message}`,
            timestamp: performance.now(),
            recoverable: false
          }
        }))
      } finally {
        isInitializingRef.current = false
      }
    }

    initializeWorker()

    // Cleanup al desmontar
    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.destroy()
        workerManagerRef.current = null
      }
      isInitializingRef.current = false
    }
  }, []) // Solo ejecutar una vez

  // ============================================================================
  // ACCIONES
  // ============================================================================

  const actions: SimulationContextActions = {
    start: useCallback(async () => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.start()
    }, []),

    pause: useCallback(async () => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.pause()
    }, []),

    reset: useCallback(async (preserveParams = false) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.reset(preserveParams)
      
      // Limpiar estado local
      setState(prev => ({
        ...prev,
        currentData: null,
        buffer: []
      }))
    }, []),

    setPID: useCallback(async (params: SetPIDCommand['payload']) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setPID(params)
    }, []),

    setPlant: useCallback(async (params: SetPlantCommand['payload']) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setPlant(params)
    }, []),

    setSetpoint: useCallback(async (value: number, rampRate?: number) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setSetpoint(value, rampRate)
    }, []),

    setNoise: useCallback(async (enabled: boolean, sigma = 0, seed?: number) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setNoise(enabled, sigma, seed)
    }, []),

    getWindowData: useCallback((windowSeconds: number) => {
      if (!workerManagerRef.current) {
        return []
      }
      return workerManagerRef.current.getWindowData(windowSeconds)
    }, []),

    clearBuffer: useCallback(() => {
      if (workerManagerRef.current) {
        workerManagerRef.current.clearBuffer()
      }
      setState(prev => ({
        ...prev,
        buffer: []
      }))
    }, []),

    clearError: useCallback(() => {
      setState(prev => ({
        ...prev,
        lastError: null
      }))
    }, []),

    getWorkerStatus: useCallback(() => {
      if (!workerManagerRef.current) {
        return {
          connected: false,
          workerState: 'error' as const,
          lastTick: 0,
          performance: {
            avg_cycle_time: 0,
            max_cycle_time: 0,
            cpu_usage_estimate: 0,
            uptime: 0,
            samples_processed: 0
          }
        }
      }
      return workerManagerRef.current.getStatus()
    }, []),

    exportCSV: useCallback((range) => {
      // Recolectar datos
      const data = range.type === 'all'
        ? (workerManagerRef.current?.getBufferData() || [])
        : (workerManagerRef.current?.getWindowData(range.seconds) || [])

      if (!data.length) {
        console.warn('Export CSV: no hay datos para exportar')
        return
      }

      // Metadatos
      const nowIso = new Date().toISOString()
      const metaLines = [
        '# PID-Simulator CSV Export',
        `# timestamp: ${nowIso}`,
        `# timestep: ${state.config.timestep}s`,
        `# bufferSize: ${state.config.bufferSize}`,
        `# window: ${range.type === 'all' ? 'all' : `${range.seconds}s`}`
      ]

      // Encabezados
      const header = ['t','SP','PV','u','PV_clean']

      // Filas de datos
      const rows = data.map(d => [
        d.t.toFixed(3),
        d.SP.toFixed(3),
        d.PV.toFixed(3),
        d.u.toFixed(6),
        d.PV_clean.toFixed(3)
      ].join(','))

      const csv = [...metaLines, header.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pid-simulator_${range.type}_${nowIso.replace(/[:.]/g,'-')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, [state.config.bufferSize, state.config.timestep])
  }

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: SimulationContextValue = {
    state,
    actions
  }

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  )
}

// ============================================================================
// HOOK PERSONALIZADO
// ============================================================================

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext)
  
  if (!context) {
    throw new Error('useSimulation debe usarse dentro de un SimulationProvider')
  }
  
  return context
}

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

/**
 * Hook para obtener solo el estado actual de simulación
 */
export function useSimulationData() {
  const { state } = useSimulation()
  return {
    currentData: state.currentData,
    buffer: state.buffer,
    isRunning: state.isRunning,
    isConnected: state.isConnected
  }
}

/**
 * Hook para obtener solo las acciones de control
 */
export function useSimulationControls() {
  const { actions, state } = useSimulation()
  return {
    ...actions,
    isConnected: state.isConnected,
    isRunning: state.isRunning,
    workerState: state.workerState
  }
}

/**
 * Hook para obtener solo las métricas de rendimiento
 */
export function useSimulationPerformance() {
  const { state } = useSimulation()
  return {
    performance: state.performance,
    lastError: state.lastError,
    workerState: state.workerState
  }
}
