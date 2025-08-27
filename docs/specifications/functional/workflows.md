# Flujos de Trabajo - PID-Simulator

## 📋 Resumen

Este documento describe los flujos de trabajo principales del simulador PID, incluyendo diagramas de flujo detallados para los procesos más complejos del sistema.

## 🔄 Flujos de Trabajo Principales

### FW-001: Flujo de Inicialización del Sistema

```mermaid
flowchart TD
    A[Usuario accede a la aplicación] --> B[React App se carga]
    B --> C[SimulationProvider se inicializa]
    C --> D[WorkerManager se crea]
    D --> E[Web Worker se instancia]
    E --> F[Worker inicializa componentes]
    F --> G[FOPDTPlant se crea]
    G --> H[PIDController se crea]
    H --> I[MetricsCalculator se crea]
    I --> J[Worker envía evento READY]
    J --> K[UI actualiza estado a 'ready']
    K --> L[Sistema listo para simulación]
    
    F --> F1{Error en inicialización?}
    F1 -->|Sí| F2[Worker envía ERROR]
    F2 --> F3[UI muestra error]
    F3 --> F4[Usuario puede reintentar]
    F1 -->|No| G
```

### FW-002: Flujo de Ejecución de Simulación

```mermaid
flowchart TD
    A[Usuario presiona Start] --> B[UI envía comando START]
    B --> C[Worker recibe comando]
    C --> D[Worker inicia timer de 100ms]
    D --> E[Timer dispara ciclo de simulación]
    E --> F[PID calcula salida]
    F --> G[Planta simula respuesta]
    G --> H[Ruido se aplica si está habilitado]
    H --> I[Métricas se calculan]
    I --> J[Datos se almacenan en buffer]
    J --> K[Worker envía evento TICK]
    K --> L[UI actualiza gráficas]
    L --> M[UI actualiza métricas]
    M --> N{Simulación pausada?}
    N -->|No| E
    N -->|Sí| O[Timer se detiene]
    O --> P[Sistema en estado 'paused']
```

### FW-003: Flujo de Configuración de Parámetros

```mermaid
flowchart TD
    A[Usuario ajusta parámetro] --> B[UI valida rango]
    B --> C{Parámetro válido?}
    C -->|No| D[UI muestra error]
    D --> E[Usuario corrige valor]
    E --> B
    C -->|Sí| F[UI envía comando al Worker]
    F --> G[Worker recibe comando]
    G --> H{¿Tipo de parámetro?}
    H -->|PID| I[PIDController.updateParameters]
    H -->|Planta| J[FOPDTPlant.updateParameters]
    H -->|Setpoint| K[Worker actualiza SP]
    H -->|Ruido| L[Worker actualiza configuración de ruido]
    I --> M[Worker valida estabilidad]
    J --> N[Worker recalcula discretización]
    K --> O[Worker actualiza setpoint]
    L --> P[Worker regenera PRNG]
    M --> Q[Worker envía confirmación]
    N --> Q
    O --> Q
    P --> Q
    Q --> R[UI actualiza interfaz]
    R --> S{¿Simulación activa?}
    S -->|Sí| T[Cambios se reflejan inmediatamente]
    S -->|No| U[Cambios se aplican al siguiente start]
```

### FW-004: Flujo de Cálculo de Métricas

```mermaid
flowchart TD
    A[Nuevo dato de simulación] --> B[Detectar cambio de setpoint]
    B --> C{¿Cambió el setpoint?}
    C -->|No| D[Continuar monitoreo]
    C -->|Sí| E[Iniciar cálculo de métricas]
    E --> F[Resetear contadores]
    F --> G[Monitorear PV en tiempo real]
    G --> H{¿PV > SP?}
    H -->|Sí| I[Calcular overshoot]
    H -->|No| J[Continuar monitoreo]
    I --> K[Registrar peak time]
    K --> L{¿PV en banda ±5%?}
    L -->|No| G
    L -->|Sí| M[Calcular settling time]
    M --> N[Calcular métricas de error]
    N --> O[Actualizar métricas en UI]
    O --> P[Esperar próximo cambio de setpoint]
    P --> A
```

### FW-005: Flujo de Manejo de Errores

```mermaid
flowchart TD
    A[Error detectado] --> B{¿Severidad del error?}
    B -->|Warning| C[Log warning]
    C --> D[UI muestra notificación]
    D --> E[Sistema continúa operación]
    B -->|Error| F[Log error]
    F --> G[UI muestra error]
    G --> H[Worker envía evento ERROR]
    H --> I[UI actualiza estado]
    I --> J{¿Error recuperable?}
    J -->|Sí| K[Usuario puede corregir]
    J -->|No| L[Sistema se detiene]
    B -->|Critical| M[Log critical error]
    M --> N[Worker se detiene]
    N --> O[UI muestra error crítico]
    O --> P[Sistema requiere reinicio]
    
    K --> Q[Usuario corrige problema]
    Q --> R[Sistema reanuda operación]
    L --> S[Usuario debe reiniciar aplicación]
    P --> T[Usuario recarga página]
```

### FW-006: Flujo de Exportación de Datos

```mermaid
flowchart TD
    A[Usuario solicita exportación] --> B{¿Tipo de exportación?}
    B -->|Ventana| C[Usuario especifica duración]
    B -->|Completo| D[Usar todo el buffer]
    C --> E[Recolectar datos de ventana]
    D --> E
    E --> F{¿Hay datos disponibles?}
    F -->|No| G[Mostrar error: sin datos]
    F -->|Sí| H[Generar metadatos]
    H --> I[Crear encabezados CSV]
    I --> J[Formatear datos]
    J --> K[Crear blob CSV]
    K --> L[Generar nombre de archivo]
    L --> M[Crear enlace de descarga]
    M --> N[Descargar archivo]
    N --> O[Limpiar recursos]
    O --> P[Mostrar confirmación]
```

### FW-007: Flujo de Animaciones de UI

```mermaid
flowchart TD
    A[Usuario interactúa con header] --> B{¿Acción?}
    B -->|Expandir| C[Iniciar animación de expansión]
    B -->|Comprimir| D[Iniciar animación de compresión]
    C --> E[Mostrar overlay de transición]
    D --> E
    E --> F[Animar layout expandido]
    F --> G[Animar layout comprimido]
    G --> H[Actualizar estado de header]
    H --> I[Ocultar overlay]
    I --> J[Permitir nueva interacción]
    
    C --> C1[Mostrar panel de control completo]
    D --> D1[Mostrar panel de control compacto]
    C1 --> F
    D1 --> F
```

### FW-008: Flujo de Atajos de Teclado

```mermaid
flowchart TD
    A[Usuario presiona tecla] --> B{¿Usuario en campo de input?}
    B -->|Sí| C[Ignorar atajo]
    B -->|No| D{¿Tecla presionada?}
    D -->|S| E[Toggle start/pause]
    D -->|R| F[Reset simulación]
    D -->|↑| G[Incrementar setpoint]
    D -->|↓| H[Decrementar setpoint]
    D -->|←| I[Reducir ventana de tiempo]
    D -->|→| J[Aumentar ventana de tiempo]
    
    E --> K{¿Simulación corriendo?}
    K -->|Sí| L[Pausar simulación]
    K -->|No| M[Iniciar simulación]
    L --> N[Actualizar UI]
    M --> N
    
    F --> O[Resetear simulación]
    O --> N
    
    G --> P{¿Setpoint en límite?}
    P -->|No| Q[Incrementar setpoint]
    P -->|Sí| R[Ignorar cambio]
    Q --> N
    R --> N
    
    H --> S{¿Setpoint en límite?}
    S -->|No| T[Decrementar setpoint]
    S -->|Sí| U[Ignorar cambio]
    T --> N
    U --> N
    
    I --> V{¿Ventana en límite?}
    V -->|No| W[Reducir ventana]
    V -->|Sí| X[Ignorar cambio]
    W --> N
    X --> N
    
    J --> Y{¿Ventana en límite?}
    Y -->|No| Z[Aumentar ventana]
    Y -->|Sí| AA[Ignorar cambio]
    Z --> N
    AA --> N
```

## 🔧 Flujos Técnicos Específicos

### FW-009: Flujo de Discretización FOPDT

```mermaid
flowchart TD
    A[Parámetros de planta cambian] --> B{¿Cambió τ o timestep?}
    B -->|No| C[No recalcular]
    B -->|Sí| D[Calcular φ = e^(-Ts/τ)]
    D --> E[Calcular γ = K * (1 - φ)]
    E --> F[Calcular muestras de tiempo muerto]
    F --> G[Redimensionar buffer si es necesario]
    G --> H[Actualizar factores de discretización]
    H --> I[Validar estabilidad numérica]
    I --> J{¿Estable?}
    J -->|No| K[Mostrar advertencia]
    J -->|Sí| L[Discretización actualizada]
    K --> L
```

### FW-010: Flujo de Anti-Windup PID

```mermaid
flowchart TD
    A[PID calcula salida] --> B[Calcular u_raw = P + I + D]
    B --> C[Saturar salida: u = clamp(u_raw, 0, 1)]
    C --> D{¿Salida saturada?}
    D -->|No| E[Retornar salida normal]
    D -->|Sí| F[Calcular error de saturación]
    F --> G[Error = u - u_raw]
    G --> H[Aplicar back-calculation]
    H --> I[Integral += (1/Tt) * Error * Ts]
    I --> J[Retornar salida saturada]
```

## 📊 Diagrama de Estados del Sistema

```mermaid
stateDiagram-v2
    [*] --> Initializing
    Initializing --> Ready: Worker inicializado
    Initializing --> Error: Error crítico
    
    Ready --> Running: Comando START
    Ready --> Error: Error no crítico
    
    Running --> Paused: Comando PAUSE
    Running --> Ready: Comando RESET
    Running --> Error: Error crítico
    
    Paused --> Running: Comando START
    Paused --> Ready: Comando RESET
    Paused --> Error: Error crítico
    
    Error --> Ready: Reset manual
    Error --> [*]: Recarga de página
```

## 🔗 Relaciones entre Flujos

```mermaid
graph TD
    A[FW-001: Inicialización] --> B[FW-002: Ejecución]
    B --> C[FW-004: Métricas]
    B --> D[FW-005: Errores]
    
    E[FW-003: Configuración] --> B
    E --> F[FW-009: Discretización]
    
    G[FW-007: Animaciones] --> H[FW-008: Atajos]
    
    I[FW-006: Exportación] --> B
    
    B --> J[FW-010: Anti-Windup]
```

## 📈 Métricas de Flujo

### Tiempos de Respuesta Objetivo
- **Inicialización**: < 2 segundos
- **Cambio de parámetros**: < 50ms
- **Actualización de gráficas**: < 100ms
- **Cálculo de métricas**: < 10ms
- **Exportación**: < 5 segundos

### Frecuencias de Operación
- **Simulación**: 10 Hz (100ms)
- **Actualización UI**: 10 Hz
- **Cálculo métricas**: On-demand
- **Validación parámetros**: Real-time

### Capacidades de Buffer
- **Datos de simulación**: 100,000 muestras
- **Métricas**: 1,000 muestras
- **Errores**: 100 eventos
- **Performance**: 100 ciclos

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2024  
**Estado**: Implementado y validado
