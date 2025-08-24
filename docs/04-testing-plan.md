# Plan de Pruebas y KPIs de Validación Numérica

## 1. Estrategia General de Testing

### 1.1 Pirámide de Testing
```
                    /\
                   /  \
                  / E2E \
                 /______\
                /        \
               /   INTE   \
              /____________\
             /              \
            /     UNIT       \
           /__________________\
```

**Distribución objetivo**:
- **70% Unit Tests**: Lógica matemática, algoritmos, funciones puras
- **20% Integration Tests**: Worker ↔ UI, componentes integrados  
- **10% E2E Tests**: Flujos completos de usuario

### 1.2 Criterios de Calidad
- **Cobertura mínima**: 80% para código crítico (PID, planta, métricas)
- **Performance**: Todos los tests unitarios < 5 segundos total
- **Determinismo**: Tests deben pasar 100% de las veces (no flaky)
- **Aislamiento**: Tests no deben depender de orden de ejecución

## 2. Tests Unitarios

### 2.1 Modelo de Planta (PlantModel)

#### Test Suite: FOPDT Discretization
```typescript
describe('PlantModel - FOPDT Discretization', () => {
  // Casos de validación numérica
  test('exact discretization matches analytical solution (L=0)', () => {
    // Configuración
    const params = { K: 0.03, tau: 90, L: 0, T_amb: 25 }
    const plant = new PlantModel(params, 0.1) // T_s = 0.1s
    
    // Input escalón u = 0.5
    const u = 0.5
    const analytical = (t: number) => 
      25 + params.tau * params.K * u * (1 - Math.exp(-t / params.tau))
    
    // Simulación vs analítica
    plant.reset()
    for (let i = 0; i < 100; i++) {
      const t = i * 0.1
      const y_sim = plant.step(u, 0)
      const y_analytical = analytical(t)
      const error = Math.abs(y_sim - y_analytical)
      
      // Error debe ser < 0.1% después de t > 0.5s
      if (t > 0.5) {
        expect(error / y_analytical).toBeLessThan(0.001)
      }
    }
  })
  
  test('time delay buffer works correctly', () => {
    const params = { K: 0.03, tau: 90, L: 1.0, T_amb: 25 }
    const plant = new PlantModel(params, 0.1) // L_s = 10 samples
    
    plant.reset()
    
    // Aplicar escalón y verificar que no hay efecto inmediato
    for (let i = 0; i < 10; i++) {
      const y = plant.step(1.0, 0)
      expect(y).toBeCloseTo(25, 3) // Solo T_amb
    }
    
    // Después de L segundos debe empezar el efecto
    const y_after_delay = plant.step(1.0, 0)
    expect(y_after_delay).toBeGreaterThan(25.01)
  })
  
  test('steady state gain validation', () => {
    const params = { K: 0.02, tau: 60, L: 0, T_amb: 20 }
    const plant = new PlantModel(params, 0.1)
    
    // Simular hasta estado estacionario
    plant.reset()
    let y_final = 20
    for (let i = 0; i < 1000; i++) { // 100s
      y_final = plant.step(0.8, 0)
    }
    
    // Ganancia estática debe ser tau * K
    const expected_gain = params.tau * params.K
    const actual_gain = (y_final - params.T_amb) / 0.8
    expect(actual_gain).toBeCloseTo(expected_gain, 3)
  })
  
  test('numerical stability over long simulation', () => {
    const params = { K: 0.01, tau: 120, L: 0, T_amb: 25 }
    const plant = new PlantModel(params, 0.1)
    
    plant.reset()
    
    // Simulación de 1 hora
    for (let i = 0; i < 36000; i++) {
      plant.step(0.5, 0)
    }
    
    // Estado debe estar cerca del valor esperado (sin drift)
    const expected = 25 + params.tau * params.K * 0.5
    const actual = plant.step(0.5, 0)
    expect(Math.abs(actual - expected) / expected).toBeLessThan(0.01)
  })
})
```

#### Test Suite: Chiller Mode
```typescript
describe('PlantModel - Chiller Mode', () => {
  test('negative gain produces cooling effect', () => {
    const params = { K: -0.04, tau: 60, L: 0, T_amb: 25 }
    const plant = new PlantModel(params, 0.1)
    
    plant.reset()
    
    // Con u = 1 (máximo enfriamiento), temperatura debe bajar
    let y = 25
    for (let i = 0; i < 600; i++) { // 60s
      y = plant.step(1.0, 0)
    }
    
    // Temperatura final debe ser menor que ambiente
    expect(y).toBeLessThan(25)
    
    // Ganancia estática debe ser negativa
    const gain = (y - 25) / 1.0
    expect(gain).toBeCloseTo(params.tau * params.K, 2)
  })
})
```

### 2.2 Controlador PID (PIDController)

#### Test Suite: Basic PID Operation
```typescript
describe('PIDController - Basic Operation', () => {
  test('proportional term calculation', () => {
    const pid = new PIDController(2.0, 0, 0, 0.1)
    
    const output = pid.compute(50, 45) // SP=50, PV=45, error=5
    
    // Solo término proporcional debe ser Kp * error
    expect(output.u).toBeCloseTo(2.0 * 5, 3)
    expect(output.P_term).toBeCloseTo(10, 3)
    expect(output.I_term).toBeCloseTo(0, 3)
    expect(output.D_term).toBeCloseTo(0, 3)
  })
  
  test('integral term accumulation', () => {
    const pid = new PIDController(0, 0.1, 0, 0.1) // Ki = 0.1 s⁻¹
    
    // Aplicar error constante
    let integral_expected = 0
    for (let i = 0; i < 10; i++) {
      const output = pid.compute(50, 45) // error = 5 constante
      integral_expected += 0.1 * 0.1 * 5 // Ki * T_s * error
      
      expect(output.I_term).toBeCloseTo(integral_expected, 4)
    }
  })
  
  test('derivative on measurement (not error)', () => {
    const pid = new PIDController(0, 0, 10, 0.1) // Kd = 10s
    
    // Primer paso: PV = 40
    pid.compute(50, 40)
    
    // Segundo paso: PV = 45 (incremento de 5)
    const output = pid.compute(50, 45)
    
    // Derivada debe ser sobre PV, no error
    // D_term = Kd * (PV_k - PV_{k-1}) / T_s
    const expected_D = 10 * (45 - 40) / 0.1
    expect(output.D_term).toBeCloseTo(expected_D, 2)
  })
  
  test('output saturation', () => {
    const pid = new PIDController(10, 0, 0, 0.1)
    
    // Error muy grande que debería saturar
    const output = pid.compute(100, 0) // error = 100
    
    expect(output.u).toBeLessThanOrEqual(1.0)
    expect(output.u).toBeGreaterThanOrEqual(0.0)
    expect(output.saturated).toBe(true)
  })
})
```

#### Test Suite: Anti-windup
```typescript
describe('PIDController - Anti-windup', () => {
  test('back-calculation prevents windup', () => {
    const pid = new PIDController(1, 0.5, 0, 0.1)
    
    // Forzar saturación prolongada
    let max_integral = 0
    for (let i = 0; i < 100; i++) {
      const output = pid.compute(100, 10) // Gran error
      max_integral = Math.max(max_integral, Math.abs(output.I_term))
      
      if (output.saturated) {
        // Integrador no debe seguir creciendo indefinidamente
        expect(max_integral).toBeLessThan(50) // Límite razonable
      }
    }
  })
  
  test('recovery after saturation is smooth', () => {
    const pid = new PIDController(2, 0.2, 0, 0.1)
    
    // Saturar primero
    for (let i = 0; i < 50; i++) {
      pid.compute(80, 20)
    }
    
    // Cambiar a condición no saturante
    const outputs = []
    for (let i = 0; i < 20; i++) {
      const output = pid.compute(45, 40)
      outputs.push(output.u)
    }
    
    // La salida debe converger suavemente, no oscilar
    const derivatives = outputs.slice(1).map((u, i) => u - outputs[i])
    const max_change = Math.max(...derivatives.map(Math.abs))
    expect(max_change).toBeLessThan(0.3) // Cambio suave
  })
})
```

### 2.3 Calculadora de Métricas (MetricsCalculator)

#### Test Suite: Overshoot Calculation
```typescript
describe('MetricsCalculator - Overshoot', () => {
  test('calculates overshoot correctly for step response', () => {
    const calc = new MetricsCalculator()
    
    // Simular respuesta escalón con overshoot conocido
    const SP = 60
    calc.reset(SP)
    
    // Agregar datos que simulan overshoot del 20%
    const data = [
      { t: 0, PV: 25, SP: 60 },
      { t: 10, PV: 50, SP: 60 },
      { t: 20, PV: 70, SP: 60 },  // Pico
      { t: 30, PV: 72, SP: 60 },  // Máximo overshoot
      { t: 40, PV: 65, SP: 60 },
      { t: 50, PV: 62, SP: 60 },
      { t: 60, PV: 60, SP: 60 }
    ]
    
    data.forEach(point => calc.addDataPoint(point))
    
    const metrics = calc.getMetrics()
    const expected_overshoot = (72 - 60) / 60 * 100 // 20%
    expect(metrics.overshoot.value).toBeCloseTo(expected_overshoot, 1)
    expect(metrics.overshoot.peak_value).toBeCloseTo(72, 1)
  })
  
  test('handles zero setpoint correctly', () => {
    const calc = new MetricsCalculator()
    calc.reset(0)
    
    calc.addDataPoint({ t: 10, PV: 5, SP: 0 })
    
    const metrics = calc.getMetrics()
    // Con SP=0, overshoot debe reportarse en unidades absolutas
    expect(metrics.overshoot.value).toBe(5)
  })
})
```

#### Test Suite: Settling Time
```typescript
describe('MetricsCalculator - Settling Time', () => {
  test('calculates settling time with 2% band', () => {
    const calc = new MetricsCalculator()
    const SP = 50
    calc.reset(SP)
    
    const band = SP * 0.02 // ±2%
    const data = [
      { t: 0, PV: 25, SP: 50 },
      { t: 10, PV: 45, SP: 50 },
      { t: 15, PV: 48.5, SP: 50 }, // Entra en banda
      { t: 20, PV: 49.2, SP: 50 }, // Permanece
      { t: 25, PV: 50.8, SP: 50 }, // Permanece
      { t: 30, PV: 49.5, SP: 50 }  // Sigue en banda
    ]
    
    data.forEach(point => calc.addDataPoint(point))
    
    // Avanzar tiempo para cumplir hold_time = 5s
    for (let t = 31; t <= 40; t++) {
      calc.addDataPoint({ t, PV: 49.8, SP: 50 })
    }
    
    const metrics = calc.getMetrics()
    expect(metrics.settling_time.value).toBeCloseTo(15, 1)
    expect(metrics.settling_time.valid).toBe(true)
  })
  
  test('resets when leaving band', () => {
    const calc = new MetricsCalculator()
    calc.reset(50)
    
    // Entra en banda
    calc.addDataPoint({ t: 10, PV: 49, SP: 50 })
    calc.addDataPoint({ t: 12, PV: 49.5, SP: 50 })
    
    // Sale de banda
    calc.addDataPoint({ t: 15, PV: 47, SP: 50 })
    
    // Vuelve a entrar
    calc.addDataPoint({ t: 20, PV: 49.8, SP: 50 })
    
    const metrics = calc.getMetrics()
    // Settling time debe reiniciarse
    expect(metrics.settling_time.valid).toBe(false) // Aún no cumple hold
  })
})
```

## 3. Tests de Integración

### 3.1 Worker Communication

```typescript
describe('Worker Integration', () => {
  test('simulation loop maintains 10 Hz frequency', async () => {
    const worker = new SimulationWorker()
    await worker.initialize({ timestep: 0.1 })
    
    const timestamps: number[] = []
    
    worker.onMessage = (event) => {
      if (event.type === 'TICK') {
        timestamps.push(event.payload.t)
      }
    }
    
    worker.start()
    
    // Esperar 5 segundos
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    worker.pause()
    
    // Verificar frecuencia
    expect(timestamps.length).toBeGreaterThanOrEqual(45) // ~50 ticks
    expect(timestamps.length).toBeLessThanOrEqual(55)
    
    // Verificar spacing regular
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i])
    const avg_interval = intervals.reduce((a, b) => a + b) / intervals.length
    expect(avg_interval).toBeCloseTo(0.1, 0.01)
  })
  
  test('parameter changes apply immediately', async () => {
    const worker = new SimulationWorker()
    await worker.initialize()
    
    worker.start()
    
    // Cambiar setpoint
    worker.postMessage({
      type: 'SET_SP',
      payload: { value: 80 }
    })
    
    // Esperar algunos ticks
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const lastTick = await getLastTick(worker)
    expect(lastTick.SP).toBe(80)
  })
})
```

### 3.2 UI ↔ Worker Integration

```typescript
describe('UI Worker Integration', () => {
  test('slider changes propagate to simulation', async () => {
    render(<SimulationProvider><Dashboard /></SimulationProvider>)
    
    // Cambiar slider de Kp
    const kpSlider = screen.getByRole('slider', { name: /kp/i })
    fireEvent.change(kpSlider, { target: { value: '3.5' } })
    
    // Esperar propagación
    await waitFor(() => {
      const worker = getWorkerInstance()
      expect(worker.getLastPIDParams().kp).toBe(3.5)
    })
  })
  
  test('metrics update in real time', async () => {
    render(<SimulationProvider><Dashboard /></SimulationProvider>)
    
    // Iniciar simulación
    const startButton = screen.getByText(/iniciar/i)
    fireEvent.click(startButton)
    
    // Cambiar SP para generar overshoot
    const spInput = screen.getByLabelText(/setpoint/i)
    fireEvent.change(spInput, { target: { value: '80' } })
    
    // Esperar que aparezcan métricas
    await waitFor(() => {
      expect(screen.getByText(/overshoot/i)).toBeInTheDocument()
      expect(screen.getByText(/%/)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
```

## 4. Tests E2E (End-to-End)

### 4.1 Flujos Principales de Usuario

```typescript
describe('E2E User Flows', () => {
  test('complete tuning session workflow', async () => {
    await page.goto('/simulator')
    
    // 1. Cargar preset
    await page.click('[data-testid="preset-horno-medio"]')
    await page.waitForSelector('[data-testid="preset-loaded"]')
    
    // 2. Iniciar simulación
    await page.click('[data-testid="start-button"]')
    await expect(page.locator('[data-testid="status"]')).toContainText('Ejecutando')
    
    // 3. Ajustar ganancias
    await page.fill('[data-testid="kp-input"]', '3.0')
    await page.fill('[data-testid="ki-input"]', '0.15')
    
    // 4. Cambiar setpoint
    await page.fill('[data-testid="sp-input"]', '70')
    
    // 5. Esperar estabilización
    await page.waitForSelector('[data-testid="ts-value"]', { timeout: 30000 })
    
    // 6. Verificar métricas aparecen
    const overshoot = await page.textContent('[data-testid="overshoot-value"]')
    expect(parseFloat(overshoot)).toBeGreaterThan(0)
    
    // 7. Exportar datos
    await page.click('[data-testid="export-csv"]')
    const download = await page.waitForEvent('download')
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
  })
  
  test('preset loading changes all parameters', async () => {
    await page.goto('/simulator')
    
    // Cargar preset específico
    await page.click('[data-testid="preset-chiller-compacto"]')
    
    // Verificar que parámetros cambiaron
    await expect(page.locator('[data-testid="mode-select"]')).toHaveValue('chiller')
    await expect(page.locator('[data-testid="K-input"]')).toHaveValue('-0.04')
    await expect(page.locator('[data-testid="tau-input"]')).toHaveValue('60')
    
    // Verificar que simulación responde correctamente
    await page.click('[data-testid="start-button"]')
    await page.fill('[data-testid="sp-input"]', '20') // Setpoint bajo ambiente
    
    // En modo chiller, debe alcanzar SP < T_amb
    await page.waitForTimeout(10000)
    const pv = await page.textContent('[data-testid="pv-display"]')
    expect(parseFloat(pv)).toBeLessThan(25)
  })
})
```

## 5. KPIs de Validación Numérica

### 5.1 Métricas de Precisión

#### Modelo de Planta
| KPI | Objetivo | Método de medición |
|-----|----------|-------------------|
| **Error vs analítico (L=0)** | < 0.5% | Comparar con `T_amb + τ·K·u·(1-e^(-t/τ))` |
| **Ganancia estática** | ±1% de `τ·K` | Medir estado estacionario después de 5τ |
| **Tiempo muerto** | ±0.1s de L configurado | Detectar inicio de respuesta |
| **Estabilidad largo plazo** | Sin drift >0.01°C/h | Simulación 2+ horas |

#### Controlador PID
| KPI | Objetivo | Método de medición |
|-----|----------|-------------------|
| **Proporcional** | u_P = Kp·e exacto | Error directo < 0.001% |
| **Integral** | Acumulación exacta | Comparar suma riemann vs discreto |
| **Derivada filtrada** | Reduce ruido >90% | Comparar σ_out vs σ_in |
| **Anti-windup efectividad** | Reduce overshoot >50% | Casos con saturación vs sin |

#### Métricas de Desempeño
| KPI | Objetivo | Método de medición |
|-----|----------|-------------------|
| **Overshoot precisión** | ±2% del teórico | Casos conocidos, simulación vs cálculo |
| **Settling time precisión** | ±5% del esperado | Validar contra criterios estándar |
| **Consistencia métricas** | 100% reproducible | Mismos parámetros → mismos resultados |

### 5.2 Métricas de Performance

#### Temporal
| KPI | Objetivo | Método de medición |
|-----|----------|-------------------|
| **Frecuencia simulación** | 10.0 ± 0.1 Hz | Medir timestamps de TICK |
| **Jitter temporal** | < 5ms RMS | Desviación estándar de intervalos |
| **Drift acumulativo** | < 0.1% en 1h | Error acumulado vs tiempo real |
| **Latencia comandos** | < 100ms | Tiempo SET_* → efecto en TICK |

#### Recursos
| KPI | Objetivo | Método de medición |
|-----|----------|-------------------|
| **Uso memoria** | < 200MB total | Monitoreo continuo durante 2h |
| **CPU usage** | < 15% promedio | Task manager durante operación normal |
| **Memory leaks** | 0 detectados | Perfil de memoria en DevTools |
| **Buffer overflow** | 0 instancias | Logs de error durante stress test |

### 5.3 Casos de Validación Estándar

#### Caso 1: Step Response (L=0)
```yaml
Configuración:
  K: 0.03
  tau: 90
  L: 0
  T_amb: 25
  u: escalón 0→0.5 en t=5s

Resultados esperados:
  Ganancia estática: 2.7°C (τ·K·u)
  Tiempo característico: 90s
  63% valor final en: 90s
  95% valor final en: 270s (3τ)
  
Tolerancias:
  Error absoluto: < 0.1°C
  Error porcentual: < 0.5%
```

#### Caso 2: Time Delay Validation  
```yaml
Configuración:
  K: 0.02
  tau: 60
  L: 3.0
  T_amb: 20
  u: escalón 0→1 en t=10s

Resultados esperados:
  Inicio respuesta: t = 13.0 ± 0.1s
  Ganancia estática: 1.2°C
  Forma: idéntica a L=0 pero desplazada

Tolerancias:
  Delay error: ± 0.1s
  Forma error: < 1% RMS
```

#### Caso 3: PID Tuning Validation
```yaml
Configuración:
  Planta: K=0.025, tau=120, L=2
  PID: Kp=2.5, Ki=0.08, Kd=15
  SP: escalón 25→65°C

Resultados esperados (aproximados):
  Overshoot: 15-25%
  Settling time: 200-350s
  Steady state error: < 1°C
  
Método:
  Comparar vs MATLAB/Simulink
  Tolerancia: ±20% para métricas
```

## 6. Tests de Robustez y Edge Cases

### 6.1 Parámetros Extremos

```typescript
describe('Robustness Tests', () => {
  test('handles extreme parameter values', () => {
    const testCases = [
      { K: 0.001, tau: 1, L: 0 },      // Muy lentos
      { K: 0.1, tau: 600, L: 15 },     // Muy grandes
      { K: -0.1, tau: 1, L: 0 },       // Chiller rápido
      { K: 0.01, tau: 1, L: 0.9 }      // L casi = tau
    ]
    
    testCases.forEach(params => {
      const plant = new PlantModel(params, 0.1)
      
      // Debe inicializar sin error
      expect(() => plant.reset()).not.toThrow()
      
      // Debe poder simular al menos 100 pasos
      for (let i = 0; i < 100; i++) {
        const y = plant.step(0.5, 0)
        expect(y).toBeFinite()
        expect(y).toBeGreaterThan(-100)
        expect(y).toBeLessThan(200)
      }
    })
  })
  
  test('graceful degradation with invalid inputs', () => {
    const pid = new PIDController(2, 0.1, 5, 0.1)
    
    // Inputs inválidos deben clampear, no crash
    expect(() => pid.compute(NaN, 50)).not.toThrow()
    expect(() => pid.compute(Infinity, 50)).not.toThrow()
    expect(() => pid.compute(50, -Infinity)).not.toThrow()
    
    // Resultado debe ser válido
    const output = pid.compute(1e10, 50)
    expect(output.u).toBeFinite()
    expect(output.u).toBeGreaterThanOrEqual(0)
    expect(output.u).toBeLessThanOrEqual(1)
  })
})
```

### 6.2 Stress Tests

```typescript
describe('Stress Tests', () => {
  test('long duration simulation stability', async () => {
    const worker = new SimulationWorker()
    await worker.initialize()
    
    worker.start()
    
    // Simular 30 minutos (18000 ticks)
    let tickCount = 0
    let errors = 0
    
    worker.onMessage = (event) => {
      if (event.type === 'TICK') {
        tickCount++
        
        // Validar cada tick
        const { PV, u } = event.payload
        if (!isFinite(PV) || !isFinite(u)) {
          errors++
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000))
    
    worker.pause()
    
    // Verificaciones
    expect(tickCount).toBeGreaterThan(17000) // ~30min de ticks
    expect(errors).toBe(0) // Sin valores inválidos
  })
  
  test('rapid parameter changes', async () => {
    const worker = new SimulationWorker()
    await worker.initialize()
    worker.start()
    
    // Cambiar parámetros rápidamente
    for (let i = 0; i < 100; i++) {
      worker.postMessage({
        type: 'SET_PID',
        payload: { 
          kp: Math.random() * 5, 
          ki: Math.random() * 0.5, 
          kd: Math.random() * 20 
        }
      })
      
      worker.postMessage({
        type: 'SET_SP',
        payload: { value: 30 + Math.random() * 40 }
      })
      
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Worker debe mantenerse estable
    const finalTick = await getLastTick(worker)
    expect(finalTick.PV).toBeFinite()
    expect(finalTick.u).toBeFinite()
  })
})
```

## 7. Oráculos y Datos de Referencia

### 7.1 Soluciones Analíticas

Para validar el modelo FOPDT sin tiempo muerto (L=0):

```math
x(t) = x(0) \cdot e^{-t/\tau} + \tau K u (1 - e^{-t/\tau})
```

**Casos de prueba específicos**:
- **Escalón unitario**: u=1, x(0)=0 → x(∞) = τK
- **Respuesta a rampa**: u=t → solución conocida con Laplace
- **Respuesta al impulso**: δ(t) → x(t) = Kτe^(-t/τ)/τ = Ke^(-t/τ)

### 7.2 Benchmarks de Literatura

#### Tuning de Ziegler-Nichols
Para validar que nuestros PID se comportan como esperado:

```yaml
Método: Ultimate Gain
Proceso: FOPDT con K=1, τ=10, L=2
Ku_teórico: ~4.8  # Ganancia última crítica
Tu_teórico: ~12.6 s  # Período último

Tuning ZN:
  Kp: 0.6 * Ku = 2.88
  Ki: 2*Kp/Tu = 0.457
  Kd: Kp*Tu/8 = 4.54

Respuesta esperada:
  Overshoot: ~25%
  Settling time: ~50s
```

#### Benchmark IMC (Internal Model Control)
```yaml
Proceso: K=2, τ=5, L=1
Parámetro IMC: λ = L = 1

Tuning IMC:
  Kp: τ/(K*(λ+L)) = 1.25
  Ki: 1/(τ+L) = 0.167
  Kd: τ*L/(2*τ+L) = 0.45

Respuesta esperada:
  Overshoot: <5%
  Settling time: ~20s
```

### 7.3 Datos de Validación Experimental

#### Test Set 1: Hornos Industriales Típicos
```yaml
Horno_Lento:
  K_real: 0.012-0.018 °C/s/%
  tau_real: 150-200 s
  L_real: 3-8 s
  
Respuesta_Experimental:
  SP: 25→80°C
  Overshoot_observado: 12-18%
  ts_observado: 8-12 min
```

#### Test Set 2: Chillers Comerciales
```yaml
Chiller_Compacto:
  K_real: -0.03 a -0.05 °C/s/%
  tau_real: 45-75 s
  L_real: 1-3 s
  
Limitaciones_Reales:
  u_min: 20% (no puede bajar de mínimo)
  u_max: 100%
  slew_rate: 5%/s máximo
```

## 8. Automatización y CI/CD

### 8.1 Pipeline de Tests

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:unit --coverage
      - uses: codecov/codecov-action@v3
        
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test:integration
      
  numerical-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test:numerical
      - name: Upload validation report
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: reports/numerical-validation.html
          
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:e2e
```

### 8.2 Reportes de Validación

```typescript
// scripts/generate-validation-report.ts
export function generateValidationReport() {
  const results = {
    numerical: runNumericalValidation(),
    performance: runPerformanceTests(),
    robustness: runRobustnessTests()
  }
  
  const html = `
    <html>
      <head><title>Validation Report</title></head>
      <body>
        <h1>PID Simulator Validation Report</h1>
        <h2>Numerical Accuracy</h2>
        ${formatNumericalResults(results.numerical)}
        
        <h2>Performance Metrics</h2>
        ${formatPerformanceResults(results.performance)}
        
        <h2>Robustness Tests</h2>
        ${formatRobustnessResults(results.robustness)}
        
        <h2>Plots</h2>
        ${generateValidationPlots()}
      </body>
    </html>
  `
  
  fs.writeFileSync('reports/validation-report.html', html)
}
```

## 9. Criterios de Aceptación de Testing

### 9.1 Para Cada Sprint

**Sprint 1**:
- [ ] Tests unitarios para modelo FOPDT pasan
- [ ] Test de comunicación Worker básico funciona
- [ ] Al menos 1 test E2E de flujo principal

**Sprint 2**:
- [ ] Tests unitarios PID completos y pasando
- [ ] Tests de integración UI ↔ Worker
- [ ] Validación numérica básica implementada

**Sprint 3**:
- [ ] Tests de precisión numérica todos pasando
- [ ] Tests de performance automatizados
- [ ] Suite completa de robustez

**Sprint 4**:
- [ ] Cobertura >= 80% en código crítico
- [ ] CI/CD pipeline completamente funcional
- [ ] Reportes de validación automatizados

### 9.2 Criterios de Release

**MVP (Release 0.1.0)**:
- [ ] Tests unitarios core: 100% pasando
- [ ] Al menos 3 casos de validación numérica
- [ ] 1 test E2E completo funcional

**Beta (Release 0.2.0)**:
- [ ] Suite completa de tests unitarios
- [ ] Validación numérica vs benchmarks
- [ ] Tests de performance automatizados

**Production (Release 1.0.0)**:
- [ ] Cobertura >= 80% total
- [ ] Todos los casos de validación pasando
- [ ] CI/CD pipeline robusto
- [ ] Documentación de testing completa
