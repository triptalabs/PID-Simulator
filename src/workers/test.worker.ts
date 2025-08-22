// Test Worker muy simple para verificar que funciona la carga básica
console.log('Test Worker cargado')

self.onmessage = function(e) {
  console.log('Test Worker recibió:', e.data)
  
  self.postMessage({
    type: 'READY',
    payload: { message: 'Test Worker funcionando!' }
  })
}
