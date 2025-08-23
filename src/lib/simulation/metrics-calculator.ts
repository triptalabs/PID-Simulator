/**
 * Calculador de métricas de control automático
 * 
 * Implementa algoritmos para calcular:
 * - Overshoot porcentual
 * - Tiempo de pico (t_peak)
 * - Tiempo de establecimiento
 * - Reset automático de métricas
 * 
 * Referencia: H4.1 - Cálculo de Overshoot (Sprint 2)
 */

export interface MetricsState {
  overshoot: number        // Overshoot porcentual actual
  t_peak: number          // Tiempo del pico máximo [s]
  settling_time: number   // Tiempo de establecimiento [s]
  is_calculating: boolean // True si está calculando métricas
  sp_previous: number     // Setpoint anterior para detectar cambios
  pv_max: number          // Valor máximo de PV detectado
  pv_min: number          // Valor mínimo de PV detectado
  t_start: number         // Tiempo de inicio del cálculo [s]
  t_current: number       // Tiempo actual [s]
  samples_count: number   // Número de muestras procesadas
}

export interface MetricsConfig {
  sp_change_threshold: number  // Umbral para detectar cambio de SP (%)
  settling_threshold: number   // Umbral para tiempo de establecimiento (%)
  settling_window: number      // Ventana de estabilidad [s]
  max_calculation_time: number // Tiempo máximo de cálculo [s]
}

export class MetricsCalculator {
  private state: MetricsState
  private config: MetricsConfig

  constructor(config?: Partial<MetricsConfig>) {
    this.config = {
      sp_change_threshold: 5.0,    // 5% cambio de SP
      settling_threshold: 2.0,     // 2% del SP final
      settling_window: 2.0,        // 2 segundos de estabilidad
      max_calculation_time: 60.0,  // 60 segundos máximo
      ...config
    }
    
    this.reset()
  }

  /**
   * Resetea todas las métricas
   */
  reset(): void {
    this.state = {
      overshoot: 0,
      t_peak: 0,
      settling_time: 0,
      is_calculating: false,
      sp_previous: 0,
      pv_max: -Infinity,
      pv_min: Infinity,
      t_start: 0,
      t_current: 0,
      samples_count: 0
    }
  }

  /**
   * Procesa una nueva muestra de datos
   * 
   * @param t - Tiempo actual [s]
   * @param sp - Setpoint actual [°C]
   * @param pv - Process Variable actual [°C]
   * @returns Estado actualizado de métricas
   */
  processSample(t: number, sp: number, pv: number): MetricsState {
    // Validar entradas
    if (!Number.isFinite(t) || !Number.isFinite(sp) || !Number.isFinite(pv)) {
      console.warn('Métricas: Entradas inválidas', { t, sp, pv })
      return this.state
    }

    this.state.t_current = t
    this.state.samples_count++

    // Detectar cambio significativo de SP
    const sp_change_abs = Math.abs(sp - this.state.sp_previous)
    const sp_ref = Math.max(1e-9, Math.abs(this.state.sp_previous))
    const sp_change_percent = (sp_change_abs / sp_ref) * 100

    if (sp_change_percent > this.config.sp_change_threshold) {
      this.startNewCalculation(t, sp, pv)
      // actualizar referencia de SP inmediatamente
      this.state.sp_previous = sp
      return this.state
    }

    // Si no estamos calculando, no hacer nada
    if (!this.state.is_calculating) {
      return this.state
    }

    // Verificar timeout de cálculo
    if (t - this.state.t_start > this.config.max_calculation_time) {
      this.finishCalculation()
      return this.state
    }

    // Actualizar min/max de PV
    this.state.pv_max = Math.max(this.state.pv_max, pv)
    this.state.pv_min = Math.min(this.state.pv_min, pv)

    // Calcular overshoot en tiempo real
    this.calculateOvershoot(sp, pv, t)

    // Calcular tiempo de establecimiento
    this.calculateSettlingTime(sp, pv, t)

    // Verificar si el cálculo debe terminar
    if (this.shouldFinishCalculation(sp, pv, t)) {
      this.finishCalculation()
    }

    // Actualizar SP previo para la siguiente detección
    this.state.sp_previous = sp
    return this.state
  }

  /**
   * Inicia un nuevo cálculo de métricas
   */
  private startNewCalculation(t: number, sp: number, pv: number): void {
    this.state.is_calculating = true
    this.state.t_start = t
    this.state.sp_previous = sp
    this.state.pv_max = pv
    this.state.pv_min = pv
    this.state.overshoot = 0
    this.state.t_peak = 0
    this.state.settling_time = 0
    this.state.samples_count = 0

    console.log(`Métricas: Iniciando cálculo - SP: ${sp}°C, t: ${t}s`)
  }

  /**
   * Calcula overshoot en tiempo real
   */
  private calculateOvershoot(sp: number, pv: number, t: number): void {
    if (sp === 0) {
      // Caso especial: SP = 0, usar overshoot absoluto
      if (pv > this.state.pv_max) {
        this.state.pv_max = pv
        this.state.overshoot = pv
        this.state.t_peak = t
      }
      return
    }

    // Overshoot coherente para pasos ascendentes y descendentes
    // Definir referencia de signo respecto al SP final
    const direction = Math.sign(sp - this.state.sp_previous || 1)
    const error = pv - sp
    const signedOvershoot = (error / Math.abs(sp)) * 100

    // Para paso descendente (direction < 0), medimos undershoot (mínimo)
    if (direction < 0) {
      // Registrar mínimos
      if (pv < this.state.pv_min) {
        this.state.pv_min = pv
      }
      const undershootPercent = -signedOvershoot // valor positivo cuando pv < sp
      if (undershootPercent > this.state.overshoot) {
        this.state.overshoot = undershootPercent
        this.state.t_peak = t
      }
      return
    }

    // Paso ascendente (direction >= 0): mantener lógica clásica
    if (pv > this.state.pv_max) {
      this.state.pv_max = pv
    }
    const overshootPercent = signedOvershoot
    if (overshootPercent > this.state.overshoot) {
      this.state.overshoot = overshootPercent
      this.state.t_peak = t
    }
  }

  /**
   * Calcula tiempo de establecimiento
   */
  private calculateSettlingTime(sp: number, pv: number, t: number): void {
    if (sp === 0) return // No calcular settling time para SP = 0

    const error_percent = Math.abs(pv - sp) / Math.abs(sp) * 100

    if (error_percent <= this.config.settling_threshold) {
      if (this.state.settling_time === 0) {
        // Primer momento dentro del umbral
        this.state.settling_time = t
      }
    } else {
      // Fuera del umbral, resetear
      this.state.settling_time = 0
    }
  }

  /**
   * Determina si el cálculo debe terminar
   */
  private shouldFinishCalculation(sp: number, pv: number, t: number): boolean {
    if (sp === 0) {
      // Para SP = 0, terminar cuando PV se estabilice
      return t - this.state.t_peak > this.config.settling_window
    }

    // Para SP ≠ 0, terminar cuando se mantenga en banda por ventana definida
    return this.state.settling_time > 0 &&
           t - this.state.settling_time > this.config.settling_window
  }

  /**
   * Finaliza el cálculo actual
   */
  private finishCalculation(): void {
    this.state.is_calculating = false
    
    console.log(`Métricas: Cálculo completado`, {
      overshoot: this.state.overshoot.toFixed(2) + '%',
      t_peak: this.state.t_peak.toFixed(1) + 's',
      settling_time: this.state.settling_time > 0 
        ? (this.state.settling_time + this.config.settling_window).toFixed(1) + 's'
        : 'N/A',
      samples: this.state.samples_count
    })
  }

  /**
   * Obtiene el estado actual de métricas
   */
  getMetrics(): MetricsState {
    return { ...this.state }
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Valida que las métricas sean razonables
   */
  validateMetrics(): boolean {
    if (this.state.overshoot < 0 || this.state.overshoot > 1000) {
      console.warn('Métricas: Overshoot fuera de rango razonable', this.state.overshoot)
      return false
    }

    if (this.state.t_peak < 0 || this.state.t_peak > 1000) {
      console.warn('Métricas: Tiempo de pico fuera de rango razonable', this.state.t_peak)
      return false
    }

    if (this.state.settling_time < 0 || this.state.settling_time > 1000) {
      console.warn('Métricas: Tiempo de establecimiento fuera de rango razonable', this.state.settling_time)
      return false
    }

    return true
  }
}
