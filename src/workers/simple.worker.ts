/**
 * Worker de prueba simplificado para diagnosticar problemas
 */

// Mensaje de prueba simple
self.addEventListener('message', (event) => {
  console.log('Worker recibió mensaje:', event.data)
  
  // Responder inmediatamente con un evento READY
  self.postMessage({
    id: 'test',
    type: 'READY', 
    timestamp: performance.now(),
    payload: {
      version: '1.0.0-test',
      capabilities: ['test'],
      limits: {
        max_timestep: 1.0,
        min_timestep: 0.01,
        max_buffer_size: 1000
      }
    }
  })
})

console.log('Worker simple cargado correctamente')
