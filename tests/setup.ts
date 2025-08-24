// Vitest setup para entorno jsdom
// Mock básico de Web Worker para permitir pruebas del WorkerManager

class MockWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null
  onerror: ((this: Worker, ev: ErrorEvent) => any) | null = null

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    // no-op para compatibilidad
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    // no-op
  }

  postMessage(_message?: any, _transfer?: any) {
    // En tests de contrato probaremos el worker real con new URL(...) vía Vite.
    // Este mock previene fallos cuando alguna parte del código crea Worker sin URL bundle-safe.
  }

  terminate() {
    // no-op
  }
}

// Solo definir si no existe (por si el entorno la provee)
if (typeof (globalThis as any).Worker === 'undefined') {
  ;(globalThis as any).Worker = MockWorker as unknown as typeof Worker
}

// Polyfills menores
if (typeof (globalThis as any).performance === 'undefined') {
  ;(globalThis as any).performance = { now: () => Date.now() }
}


