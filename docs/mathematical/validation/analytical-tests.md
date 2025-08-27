# Validación Analítica - Casos de Prueba

## 📖 Descripción General

Esta sección contiene casos de prueba analíticos que validan la precisión de la implementación del simulador PID contra soluciones matemáticas exactas. Cada caso de prueba incluye la formulación matemática, la implementación en código, y los criterios de validación.

## 🧮 Caso de Prueba 1: Respuesta al Escalón sin Tiempo Muerto

### Formulación Matemática

**Parámetros del sistema**:
- *τ* = 60s (constante de tiempo)
- *K* = 0.02°C/s (ganancia)
- *L* = 0s (sin tiempo muerto)
- *T_amb* = 25°C (temperatura ambiente)
- *u*(*t*) = 1 (escalón unitario)

**Solución analítica**:
```
T(t) = T_amb + K·τ·(1 - e^(-t/τ))
T(t) = 25 + 0.02·60·(1 - e^(-t/60))
T(t) = 25 + 1.2·(1 - e^(-t/60))
```

### Implementación de Validación

```typescript
describe('FOPDT Analytical Validation - No Dead Time', () => {
  test('step response matches analytical solution', () => {
    const plant = new FOPDTPlant({
      K: 0.02,
      tau: 60,
      L: 0,
      T_amb: 25,
      mode: 'horno'
    })
    
    const timestep = 0.1
    const simulation_time = 300 // 5τ
    
    for (let t = 0; t <= simulation_time; t += timestep) {
      const T_simulated = plant.step(1.0)
      const T_analytical = 25 + 1.2 * (1 - Math.exp(-t/60))
      
      // Error debe ser < 1e-10 para discretización exacta
      expect(Math.abs(T_simulated - T_analytical)).toBeLessThan(1e-10)
    }
  })
  
  test('steady state gain is correct', () => {
    const plant = new FOPDTPlant({
      K: 0.02,
      tau: 60,
      L: 0,
      T_amb: 25,
      mode: 'horno'
    })
    
    // Simular hasta estado estacionario
    for (let t = 0; t <= 600; t += 0.1) {
      plant.step(1.0)
    }
    
    const T_ss = plant.getCurrentTemperature()
    const expected_ss = 25 + 0.02 * 60 // T_amb + K·τ
    
    expect(T_ss).toBeCloseTo(expected_ss, 8)
  })
})
```

### Criterios de Validación

- **Error máximo**: < 1e-10 para cualquier instante
- **Ganancia estática**: Error < 0.01%
- **Constante de tiempo**: Verificar en t = τ (63.2% del valor final)

## 🧮 Caso de Prueba 2: Respuesta al Escalón con Tiempo Muerto

### Formulación Matemática

**Parámetros del sistema**:
- *τ* = 30s (constante de tiempo)
- *K* = 0.01°C/s (ganancia)
- *L* = 10s (tiempo muerto)
- *T_amb* = 20°C (temperatura ambiente)
- *u*(*t*) = 1 (escalón unitario)

**Solución analítica**:
```
T(t) = 20                    para t < 10s
T(t) = 20 + 0.01·30·(1 - e^(-(t-10)/30)) = 20 + 0.3·(1 - e^(-(t-10)/30))   para t ≥ 10s
```

### Implementación de Validación

```typescript
describe('FOPDT Analytical Validation - With Dead Time', () => {
  test('step response with dead time matches analytical solution', () => {
    const plant = new FOPDTPlant({
      K: 0.01,
      tau: 30,
      L: 10,
      T_amb: 20,
      mode: 'horno'
    })
    
    const timestep = 0.1
    const simulation_time = 150 // 5τ después del tiempo muerto
    
    for (let t = 0; t <= simulation_time; t += timestep) {
      const T_simulated = plant.step(1.0)
      
      let T_analytical: number
      if (t < 10) {
        T_analytical = 20
      } else {
        T_analytical = 20 + 0.3 * (1 - Math.exp(-(t-10)/30))
      }
      
      // Error debe ser < 1e-8 (ligeramente mayor por tiempo muerto discreto)
      expect(Math.abs(T_simulated - T_analytical)).toBeLessThan(1e-8)
    }
  })
  
  test('dead time is correctly implemented', () => {
    const plant = new FOPDTPlant({
      K: 0.01,
      tau: 30,
      L: 10,
      T_amb: 20,
      mode: 'horno'
    })
    
    // Antes del tiempo muerto, temperatura debe ser constante
    for (let t = 0; t < 9.9; t += 0.1) {
      const T = plant.step(1.0)
      expect(T).toBeCloseTo(20, 8)
    }
    
    // Después del tiempo muerto, debe comenzar a cambiar
    const T_after_delay = plant.step(1.0)
    expect(T_after_delay).toBeGreaterThan(20)
  })
})
```

## 🧮 Caso de Prueba 3: PID sin Kick Derivativo

### Formulación Matemática

**Escenario**: Cambio brusco de setpoint con derivada filtrada sobre PV

**Condiciones iniciales**:
- SP = 50°C, PV = 50°C (estado estacionario)
- Cambio instantáneo: SP = 80°C, PV = 50°C

**Resultado esperado**:
- Término derivativo = 0 (no hay cambio en PV)
- No kick derivativo en la salida

### Implementación de Validación

```typescript
describe('PID Derivative Filter Validation', () => {
  test('no derivative kick on setpoint change', () => {
    const pid = new PIDController({
      kp: 1.0,
      ki: 0.0,  // Sin integral para aislar efecto derivativo
      kd: 10.0,
      N: 10,
      Tt: 1.0,
      enabled: true
    }, 0.1)
    
    // Estado estacionario inicial
    const output1 = pid.compute(50, 50)
    expect(output1.D_term).toBeCloseTo(0, 3)
    
    // Cambio brusco de setpoint
    const output2 = pid.compute(80, 50)
    
    // Derivada debe ser 0 (no hay cambio en PV)
    expect(output2.D_term).toBeCloseTo(0, 3)
    
    // Solo término proporcional debe contribuir
    expect(output2.P_term).toBeCloseTo(30, 3) // Kp * (80-50)
    expect(output2.I_term).toBeCloseTo(0, 3)
  })
  
  test('derivative responds to PV changes, not SP changes', () => {
    const pid = new PIDController({
      kp: 0.0,  // Sin proporcional para aislar derivativo
      ki: 0.0,
      kd: 5.0,
      N: 10,
      Tt: 1.0,
      enabled: true
    }, 0.1)
    
    // Estado estacionario
    pid.compute(50, 50)
    
    // Cambio en PV (no en SP)
    const output = pid.compute(50, 55)
    
    // Derivada debe responder al cambio en PV
    expect(output.D_term).not.toBeCloseTo(0, 3)
    expect(output.D_term).toBeCloseTo(-5.0 * (55-50) / 0.1 * 0.1, 1) // Aproximado por filtro
  })
})
```

## 🧮 Caso de Prueba 4: Anti-windup por Back-calculation

### Formulación Matemática

**Escenario**: Sistema con saturación de salida y error persistente

**Condiciones**:
- Planta lenta (τ = 180s)
- PID con Ki alto (0.1 s⁻¹)
- SP = 100°C (alto setpoint)
- Capacidad limitada de la planta

**Resultado esperado**:
- Sin anti-windup: Overshoot excesivo (>50%)
- Con anti-windup: Overshoot controlado (<30%)

### Implementación de Validación

```typescript
describe('PID Anti-windup Validation', () => {
  test('back-calculation prevents excessive overshoot', () => {
    const plant = new FOPDTPlant({
      K: 0.005,  // Planta lenta
      tau: 180,
      L: 5,
      T_amb: 25,
      mode: 'horno'
    }, 0.1)
    
    const pid = new PIDController({
      kp: 1.0,
      ki: 0.1,   // Ki alto para causar windup
      kd: 0.0,   // Sin derivativo para simplificar
      N: 10,
      Tt: 10.0,  // Tiempo de tracking
      enabled: true
    }, 0.1)
    
    let max_PV = 25
    let overshoot = 0
    
    // Simular respuesta saturada
    for (let t = 0; t <= 1000; t += 0.1) {
      const output = pid.compute(100, plant.getCurrentTemperature())
      const PV = plant.step(output.u)
      
      max_PV = Math.max(max_PV, PV)
    }
    
    overshoot = (max_PV - 100) / 100 * 100
    
    // Con anti-windup, overshoot debe ser controlado
    expect(overshoot).toBeLessThan(30)
    
    // Verificar que el integrador no se satura indefinidamente
    const final_state = pid.getState()
    expect(Math.abs(final_state.integral)).toBeLessThan(100)
  })
  
  test('tracking time affects anti-windup performance', () => {
    const plant = new FOPDTPlant({
      K: 0.005,
      tau: 180,
      L: 5,
      T_amb: 25,
      mode: 'horno'
    }, 0.1)
    
    // Comparar diferentes tiempos de tracking
    const tracking_times = [1.0, 5.0, 20.0]
    const overshoots: number[] = []
    
    for (const Tt of tracking_times) {
      const pid = new PIDController({
        kp: 1.0,
        ki: 0.1,
        kd: 0.0,
        N: 10,
        Tt: Tt,
        enabled: true
      }, 0.1)
      
      let max_PV = 25
      
      for (let t = 0; t <= 500; t += 0.1) {
        const output = pid.compute(100, plant.getCurrentTemperature())
        const PV = plant.step(output.u)
        max_PV = Math.max(max_PV, PV)
      }
      
      overshoots.push((max_PV - 100) / 100 * 100)
    }
    
    // Tiempos de tracking más pequeños deben dar mejor control
    expect(overshoots[0]).toBeLessThan(overshoots[2])
  })
})
```

## 🧮 Caso de Prueba 5: Métricas de Rendimiento

### Formulación Matemática

**Escenario**: Respuesta al escalón con overshoot conocido

**Parámetros**:
- Sistema de segundo orden subamortiguado
- Frecuencia natural ω_n = 1 rad/s
- Factor de amortiguamiento ζ = 0.5
- Overshoot teórico: OS% = e^(-πζ/√(1-ζ²)) × 100% = 16.3%

### Implementación de Validación

```typescript
describe('Metrics Calculation Validation', () => {
  test('overshoot calculation is accurate', () => {
    const metrics = new MetricsCalculator({
      sp_change_threshold: 1.0,
      settling_threshold: 2.0,
      settling_window: 1.0,
      max_calculation_time: 60.0
    })
    
    // Simular respuesta de segundo orden
    const zeta = 0.5
    const wn = 1.0
    const theoretical_overshoot = Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta*zeta)) * 100
    
    for (let t = 0; t <= 20; t += 0.1) {
      // Respuesta de segundo orden subamortiguado
      const response = 1 - Math.exp(-zeta * wn * t) * 
        (Math.cos(wn * Math.sqrt(1 - zeta*zeta) * t) + 
         zeta / Math.sqrt(1 - zeta*zeta) * 
         Math.sin(wn * Math.sqrt(1 - zeta*zeta) * t))
      
      metrics.processSample(t, 1.0, response)
    }
    
    const result = metrics.getMetrics()
    
    // Overshoot calculado debe estar cerca del teórico
    expect(Math.abs(result.overshoot - theoretical_overshoot)).toBeLessThan(1.0)
  })
  
  test('settling time calculation with known response', () => {
    const metrics = new MetricsCalculator({
      sp_change_threshold: 1.0,
      settling_threshold: 5.0, // 5% banda
      settling_window: 0.5,
      max_calculation_time: 60.0
    })
    
    // Respuesta exponencial simple: T(t) = 1 - e^(-t/τ)
    const tau = 2.0
    const settling_time_theoretical = -tau * Math.log(0.05) // 5% banda
    
    for (let t = 0; t <= 20; t += 0.1) {
      const response = 1 - Math.exp(-t/tau)
      metrics.processSample(t, 1.0, response)
    }
    
    const result = metrics.getMetrics()
    
    // Tiempo de establecimiento calculado debe estar cerca del teórico
    expect(Math.abs(result.settling_time - settling_time_theoretical)).toBeLessThan(0.5)
  })
})
```

## 🧮 Caso de Prueba 6: Estabilidad Numérica

### Formulación Matemática

**Escenario**: Simulación de larga duración con parámetros extremos

**Condiciones**:
- τ muy pequeño (0.1s) vs T_s = 0.1s
- τ muy grande (1000s) vs T_s = 0.1s
- Simulación de 8+ horas continuas

### Implementación de Validación

```typescript
describe('Numerical Stability Validation', () => {
  test('stability with very small time constant', () => {
    const plant = new FOPDTPlant({
      K: 1.0,
      tau: 0.1,  // τ = T_s
      L: 0,
      T_amb: 25,
      mode: 'horno'
    }, 0.1)
    
    // Simular por 1 hora
    for (let t = 0; t <= 3600; t += 0.1) {
      const T = plant.step(1.0)
      
      // Verificar que no hay NaN o infinitos
      expect(T).toBeFinite()
      expect(T).toBeGreaterThan(0)
      expect(T).toBeLessThan(1000)
    }
  })
  
  test('stability with very large time constant', () => {
    const plant = new FOPDTPlant({
      K: 0.001,
      tau: 1000,  // τ >> T_s
      L: 0,
      T_amb: 25,
      mode: 'horno'
    }, 0.1)
    
    // Simular por 2 horas
    for (let t = 0; t <= 7200; t += 0.1) {
      const T = plant.step(1.0)
      
      // Verificar estabilidad numérica
      expect(T).toBeFinite()
      expect(T).toBeGreaterThan(20)
      expect(T).toBeLessThan(30)
    }
  })
  
  test('no drift in long simulations', () => {
    const plant = new FOPDTPlant({
      K: 0.01,
      tau: 60,
      L: 5,
      T_amb: 25,
      mode: 'horno'
    }, 0.1)
    
    const pid = new PIDController({
      kp: 1.0,
      ki: 0.1,
      kd: 5.0,
      N: 10,
      Tt: 10.0,
      enabled: true
    }, 0.1)
    
    // Simular por 4 horas
    for (let t = 0; t <= 14400; t += 0.1) {
      const output = pid.compute(50, plant.getCurrentTemperature())
      const T = plant.step(output.u)
      
      // Verificar que no hay drift
      expect(T).toBeFinite()
      expect(Math.abs(T - 50)).toBeLessThan(10) // Debe mantenerse cerca del SP
    }
  })
})
```

## 📊 Criterios de Aceptación

### Precisión Numérica

| Caso de Prueba | Error Máximo | Criterio |
|----------------|--------------|----------|
| FOPDT sin tiempo muerto | 1e-10 | Discretización exacta |
| FOPDT con tiempo muerto | 1e-8 | Tiempo muerto discreto |
| PID sin kick derivativo | 1e-6 | Precisión de punto flotante |
| Anti-windup | < 30% overshoot | Control de saturación |
| Métricas | < 1% error | Cálculo de rendimiento |
| Estabilidad | 8+ horas | Sin drift o inestabilidad |

### Performance

- **Tiempo de ejecución**: < 1ms por paso de simulación
- **Uso de memoria**: < 1MB para simulaciones de 1 hora
- **Precisión**: Mantener precisión numérica por 8+ horas

## 🔗 Referencias

1. **Franklin, G.F., et al.** "Digital Control of Dynamic Systems" - Capítulos 3 y 4
2. **Åström, K.J.** "Computer-Controlled Systems" - Sección 2.3
3. **ADR-0001**: Discretización exacta vs Euler
4. **ADR-0002**: Derivada filtrada y anti-windup

---

**Implementación**: `tests/fopdt.validation.test.ts`, `tests/pid.antiwindup.test.ts`  
**Validación**: Ejecutar con `pnpm test`  
**Última actualización**: Enero 2024
