# 🏭 Ejemplo 1: Control de Horno Industrial

> **Tiempo estimado**: 10 minutos  
> **Nivel**: Intermedio  
> **Objetivo**: Simular el control de temperatura de un horno industrial

---

## 🎯 Escenario del Problema

### Descripción del Sistema

Imagina que eres un ingeniero de control responsable de un horno industrial que debe mantener una temperatura constante de 150°C para el proceso de curado de materiales.

**Características del horno**:
- **Capacidad**: 1000 litros
- **Potencia**: 50 kW
- **Temperatura ambiente**: 25°C
- **Tiempo de calentamiento**: ~15 minutos
- **Precisión requerida**: ±2°C

### Desafíos del Control

```mermaid
graph TD
    A[Horno Industrial] --> B[Inercia Térmica Alta]
    A --> C[Tiempo Muerto]
    A --> D[Disturbios Externos]
    A --> E[No Linealidad]
    
    B --> F[Respuesta Lenta]
    C --> G[Retardo en Control]
    D --> H[Cambios de Carga]
    E --> I[Comportamiento Variable]
    
    style A fill:#fff3e0
    style F fill:#ffcdd2
    style G fill:#ffcdd2
    style H fill:#ffcdd2
    style I fill:#ffcdd2
```

---

## 🔧 Configuración del Sistema

### Parámetros de la Planta

Basándonos en las características del horno, identificamos:

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **K** | 0.015 | Ganancia térmica (°C/s por % de potencia) |
| **τ** | 180s | Constante de tiempo (inercia térmica) |
| **L** | 5s | Tiempo muerto (retardo de actuación) |
| **T_amb** | 25°C | Temperatura ambiente |

### Modelo FOPDT

```mermaid
graph LR
    A[Señal de Control] --> B[Tiempo Muerto L=5s]
    B --> C[Sistema 1er Orden τ=180s]
    C --> D[Temperatura del Horno]
    D --> E[Sensor de Temperatura]
    E --> F[PV - Process Variable]
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#fff3e0
    style D fill:#e8f5e8
    style E fill:#e8f5e8
    style F fill:#e8f5e8
```

---

## 🎮 Configuración en el Simulador

### Paso 1: Configuración Básica

1. **Seleccionar modo**: Horno
2. **Establecer setpoint**: 150°C
3. **Usar preset**: "Horno lento" (K=0.015, τ=180s, L=5s)

### Paso 2: Configuración del PID

**Configuración inicial recomendada**:

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| **Kp** | 2.0 | Respuesta proporcional moderada |
| **Ki** | 0.1 s⁻¹ | Eliminar error estacionario |
| **Kd** | 10 s | Reducir oscilaciones |

### Paso 3: Configuración de Disturbios

Para simular condiciones reales:
- **Ruido**: Intensidad 0.2 (ruido moderado)
- **Paso de carga**: Activar a los 60s (simular apertura de puerta)

---

## 📊 Análisis de la Respuesta

### Respuesta Esperada

```mermaid
graph LR
    A[Inicio t=0s] --> B[Subida Rápida t=0-30s]
    B --> C[Desaceleración t=30-120s]
    C --> D[Overshoot t=120-180s]
    D --> E[Estabilización t=180-300s]
    E --> F[Regimen Permanente t>300s]
    
    style A fill:#e1f5fe
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#ffcdd2
    style E fill:#e8f5e8
    style F fill:#c8e6c9
```

### Métricas de Rendimiento Objetivo

| Métrica | Valor Objetivo | Justificación |
|---------|----------------|---------------|
| **Overshoot** | < 5% | Evitar daños al material |
| **Tiempo de Establecimiento** | < 300s | Proceso eficiente |
| **Error Estacionario** | < 1°C | Precisión requerida |

---

## 🔧 Proceso de Tuning

### Fase 1: Tuning Inicial

```mermaid
graph TD
    A[Configuración Inicial] --> B[Kp=2.0, Ki=0.1, Kd=10]
    B --> C[Ejecutar Simulación]
    C --> D[Analizar Respuesta]
    D --> E{Overshoot > 5%?}
    E -->|Sí| F[Reducir Kp]
    E -->|No| G{Error Estacionario > 1°C?}
    G -->|Sí| H[Aumentar Ki]
    G -->|No| I[Tuning Completado]
    
    style A fill:#e1f5fe
    style I fill:#c8e6c9
    style F fill:#fff3e0
    style H fill:#fff3e0
```

### Fase 2: Optimización

**Ajustes iterativos**:

1. **Si overshoot > 5%**:
   - Reducir Kp en 10%
   - Aumentar Kd en 10%

2. **Si tiempo de establecimiento > 300s**:
   - Aumentar Kp en 10%
   - Aumentar Ki en 10%

3. **Si error estacionario > 1°C**:
   - Aumentar Ki en 20%

### Fase 3: Validación

**Probar con disturbios**:
- Activar paso de carga a los 60s
- Observar recuperación del sistema
- Verificar que no cause inestabilidad

---

## 📈 Resultados Esperados

### Gráfica PV vs SP

```mermaid
graph TB
    subgraph "Respuesta del Sistema"
        A1[Línea roja: Setpoint 150°C]
        A2[Línea azul: PV - Temperatura real]
        A3[Área sombreada: Banda ±2°C]
    end
    
    subgraph "Características"
        B1[Subida inicial rápida]
        B2[Overshoot < 5%]
        B3[Estabilización en < 300s]
        B4[Error estacionario < 1°C]
    end
    
    style A1 fill:#ffcdd2
    style A2 fill:#e3f2fd
    style B1 fill:#e8f5e8
    style B2 fill:#e8f5e8
    style B3 fill:#e8f5e8
    style B4 fill:#e8f5e8
```

### Gráfica de Salida del PID

```mermaid
graph TB
    subgraph "Señal de Control"
        C1[Línea verde: Salida PID 0-100%]
        C2[Pico inicial alto]
        C3[Reducción gradual]
        C4[Estabilización en ~30%]
    end
    
    subgraph "Comportamiento"
        D1[Respuesta agresiva inicial]
        D2[Reducción por acción integral]
        D3[Estabilización por derivativa]
    end
    
    style C1 fill:#c8e6c9
    style D1 fill:#fff3e0
    style D2 fill:#e8f5e8
    style D3 fill:#e8f5e8
```

---

## 🚨 Análisis de Problemas

### Problema 1: Oscilaciones Excesivas

**Síntomas**:
- Overshoot > 10%
- Oscilaciones persistentes
- Tiempo de establecimiento largo

**Causas**:
- Kp muy alto
- Kd muy bajo
- Ki muy alto

**Solución**:
```mermaid
graph TD
    A[Oscilaciones Excesivas] --> B[Reducir Kp 20%]
    B --> C[Aumentar Kd 20%]
    C --> D[Reducir Ki 10%]
    D --> E[Probar Nueva Configuración]
    
    style A fill:#ffcdd2
    style E fill:#c8e6c9
```

### Problema 2: Respuesta Muy Lenta

**Síntomas**:
- Tiempo de establecimiento > 400s
- Sin overshoot
- Error estacionario alto

**Causas**:
- Kp muy bajo
- Ki muy bajo
- Kd muy alto

**Solución**:
```mermaid
graph TD
    A[Respuesta Muy Lenta] --> B[Aumentar Kp 20%]
    B --> C[Aumentar Ki 20%]
    C --> D[Reducir Kd 10%]
    D --> E[Probar Nueva Configuración]
    
    style A fill:#ffcdd2
    style E fill:#c8e6c9
```

### Problema 3: Error Estacionario

**Síntomas**:
- PV no alcanza el setpoint
- Diferencia constante con objetivo
- Sistema estable pero impreciso

**Causas**:
- Ki muy bajo
- Kp muy bajo
- Modo incorrecto

**Solución**:
```mermaid
graph TD
    A[Error Estacionario] --> B[Aumentar Ki 30%]
    B --> C[Aumentar Kp 10%]
    C --> D[Verificar Modo Horno]
    D --> E[Probar Nueva Configuración]
    
    style A fill:#ffcdd2
    style E fill:#c8e6c9
```

---

## 🎯 Configuración Final Optimizada

### Parámetros Recomendados

Después del proceso de tuning, la configuración óptima es:

| Parámetro | Valor | Comentario |
|-----------|-------|------------|
| **Kp** | 1.8 | Reducido para evitar overshoot |
| **Ki** | 0.12 s⁻¹ | Aumentado para eliminar error |
| **Kd** | 12 s | Aumentado para estabilidad |

### Métricas Finales

| Métrica | Valor Obtenido | Estado |
|---------|----------------|--------|
| **Overshoot** | 3.2% | ✅ Excelente |
| **Tiempo de Establecimiento** | 280s | ✅ Cumple objetivo |
| **Error Estacionario** | 0.5°C | ✅ Excelente |

---

## 🔍 Análisis de Disturbios

### Respuesta al Paso de Carga

Cuando se activa el disturbio a los 60s:

```mermaid
graph LR
    A[Disturbio t=60s] --> B[Caída de Temperatura]
    B --> C[Respuesta del PID]
    C --> D[Recuperación Rápida]
    D --> E[Estabilización]
    
    style A fill:#ffcdd2
    style B fill:#ffcdd2
    style C fill:#fff3e0
    style D fill:#e8f5e8
    style E fill:#c8e6c9
```

**Características de la recuperación**:
- **Tiempo de recuperación**: < 120s
- **Overshoot de recuperación**: < 2%
- **Estabilidad**: Mantenida

---

## 📚 Lecciones Aprendidas

### Principios Clave

1. **Inercia térmica alta** requiere Kd significativo
2. **Tiempo muerto** limita la velocidad de respuesta
3. **Error estacionario** se elimina con Ki apropiado
4. **Overshoot** se controla con Kp y Kd balanceados

### Mejores Prácticas

1. **Empezar conservador**: Ganancias bajas
2. **Ajustar secuencialmente**: P → PI → PID
3. **Validar con disturbios**: Probar robustez
4. **Documentar cambios**: Mantener registro

### Errores Comunes

1. **Kp muy alto**: Oscilaciones inaceptables
2. **Ki muy bajo**: Error estacionario persistente
3. **Kd muy alto**: Respuesta lenta y ruidosa
4. **Ignorar tiempo muerto**: Inestabilidad

---

## 🎯 Próximos Pasos

### Experimentos Adicionales

1. **Probar diferentes setpoints**: 100°C, 200°C
2. **Variar disturbios**: Diferentes amplitudes y tiempos
3. **Cambiar ruido**: Probar robustez del controlador
4. **Optimizar para eficiencia**: Minimizar consumo energético

### Aplicaciones Reales

Esta configuración se puede aplicar a:
- Hornos de curado industrial
- Sistemas de calefacción
- Procesos de secado
- Control de temperatura en reactores

---

## 📋 Checklist de Validación

### Antes de la Implementación

- [ ] **Respuesta estable** sin oscilaciones
- [ ] **Overshoot < 5%** para proteger materiales
- [ ] **Tiempo de establecimiento < 300s** para eficiencia
- [ ] **Error estacionario < 1°C** para precisión
- [ ] **Recuperación de disturbios** < 120s
- [ ] **Robustez ante ruido** verificada

### Documentación

- [ ] **Parámetros finales** registrados
- [ ] **Métricas de rendimiento** documentadas
- [ ] **Proceso de tuning** documentado
- [ ] **Configuración de backup** preparada

---

## 🎉 Conclusión

Este ejemplo demuestra cómo configurar y optimizar un controlador PID para un horno industrial real. Los principios aprendidos se pueden aplicar a cualquier sistema térmico con características similares.

**Puntos clave**:
- ✅ **Tuning sistemático** produce resultados predecibles
- ✅ **Validación con disturbios** asegura robustez
- ✅ **Documentación completa** facilita mantenimiento
- ✅ **Configuración conservadora** evita problemas

**¿Listo para el siguiente ejemplo?** → [Ejemplo 2: Sistema de Enfriamiento](./02-chiller-system.md)
