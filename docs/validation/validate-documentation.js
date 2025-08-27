#!/usr/bin/env node

/**
 * Script de Validación de Documentación - PID-Simulator
 * 
 * Este script valida la documentación completa del simulador PID,
 * verificando enlaces, formato, consistencia y completitud.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONFIG = {
  docsPath: './docs',
  requiredFiles: [
    'README.md',
    'user-guide/getting-started.md',
    'user-guide/faq.md',
    'user-guide/tutorials/01-basic-pid.md',
    'user-guide/tutorials/02-tuning.md',
    'user-guide/examples/01-horno-industrial.md',
    'technical/architecture.md',
    'technical/api-reference.md',
    'technical/development.md',
    'technical/deployment.md',
    'mathematical/theory/pid.md',
    'mathematical/theory/fopdt.md',
    'mathematical/theory/stability.md',
    'mathematical/validation/analytical-tests.md',
    'mathematical/validation/edge-cases.md',
    'mathematical/validation/numerical-validation.md',
    'mathematical/analysis/metrics.md',
    'mathematical/analysis/optimization.md',
    'mathematical/analysis/performance.md',
    'mathematical/references.md',
    'specifications/functional/requirements.md',
    'specifications/functional/use-cases.md',
    'specifications/functional/user-stories.md',
    'specifications/functional/workflows.md',
    'specifications/functional/acceptance-criteria.md',
    'specifications/non-functional/performance.md',
    'specifications/non-functional/usability.md',
    'specifications/interfaces.md'
  ],
  requiredDirectories: [
    'user-guide',
    'user-guide/tutorials',
    'user-guide/examples',
    'technical',
    'mathematical',
    'mathematical/theory',
    'mathematical/validation',
    'mathematical/analysis',
    'specifications',
    'specifications/functional',
    'specifications/non-functional',
    'validation'
  ],
  mermaidDiagrams: [
    'architecture.md',
    'workflows.md',
    'use-cases.md'
  ]
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utilidades
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSubsection(title) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${title}`, 'bright');
  log(`${'-'.repeat(40)}`, 'blue');
}

// Validadores
class DocumentationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  // Validar estructura de directorios
  validateDirectoryStructure() {
    logSubsection('Validando Estructura de Directorios');
    
    for (const dir of CONFIG.requiredDirectories) {
      const dirPath = path.join(CONFIG.docsPath, dir);
      if (fs.existsSync(dirPath)) {
        log(`✅ ${dir}`, 'green');
        this.success.push(`Directorio ${dir} existe`);
      } else {
        log(`❌ ${dir} - NO EXISTE`, 'red');
        this.errors.push(`Directorio requerido ${dir} no existe`);
      }
    }
  }

  // Validar archivos requeridos
  validateRequiredFiles() {
    logSubsection('Validando Archivos Requeridos');
    
    for (const file of CONFIG.requiredFiles) {
      const filePath = path.join(CONFIG.docsPath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        
        if (stats.size > 0) {
          log(`✅ ${file} (${sizeKB}KB)`, 'green');
          this.success.push(`Archivo ${file} existe y tiene contenido`);
        } else {
          log(`⚠️  ${file} - VACÍO`, 'yellow');
          this.warnings.push(`Archivo ${file} existe pero está vacío`);
        }
      } else {
        log(`❌ ${file} - NO EXISTE`, 'red');
        this.errors.push(`Archivo requerido ${file} no existe`);
      }
    }
  }

  // Validar formato Markdown
  validateMarkdownFormat() {
    logSubsection('Validando Formato Markdown');
    
    for (const file of CONFIG.requiredFiles) {
      const filePath = path.join(CONFIG.docsPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar título principal
        if (!content.match(/^#\s+.+/m)) {
          log(`⚠️  ${file} - Sin título principal`, 'yellow');
          this.warnings.push(`Archivo ${file} no tiene título principal`);
        } else {
          log(`✅ ${file} - Formato correcto`, 'green');
        }
        
        // Verificar enlaces internos
        const internalLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        for (const link of internalLinks) {
          const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match && match[2].startsWith('./') || match[2].startsWith('../')) {
            const linkPath = path.resolve(path.dirname(filePath), match[2]);
            if (!fs.existsSync(linkPath)) {
              log(`❌ ${file} - Enlace roto: ${match[2]}`, 'red');
              this.errors.push(`Enlace roto en ${file}: ${match[2]}`);
            }
          }
        }
      }
    }
  }

  // Validar diagramas Mermaid
  validateMermaidDiagrams() {
    logSubsection('Validando Diagramas Mermaid');
    
    for (const file of CONFIG.mermaidDiagrams) {
      const filePath = path.join(CONFIG.docsPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const mermaidBlocks = content.match(/```mermaid\n([\s\S]*?)\n```/g);
        
        if (mermaidBlocks && mermaidBlocks.length > 0) {
          log(`✅ ${file} - ${mermaidBlocks.length} diagrama(s) Mermaid`, 'green');
          this.success.push(`Archivo ${file} contiene ${mermaidBlocks.length} diagrama(s) Mermaid`);
        } else {
          log(`⚠️  ${file} - Sin diagramas Mermaid`, 'yellow');
          this.warnings.push(`Archivo ${file} no contiene diagramas Mermaid`);
        }
      }
    }
  }

  // Validar consistencia de documentación
  validateConsistency() {
    logSubsection('Validando Consistencia');
    
    const allFiles = this.getAllMarkdownFiles();
    const terms = {
      'PID': 0,
      'FOPDT': 0,
      'simulador': 0,
      'controlador': 0,
      'planta': 0
    };
    
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const term of Object.keys(terms)) {
        const matches = content.match(new RegExp(term, 'gi')) || [];
        terms[term] += matches.length;
      }
    }
    
    log('Frecuencia de términos clave:', 'bright');
    for (const [term, count] of Object.entries(terms)) {
      if (count > 0) {
        log(`  ${term}: ${count} ocurrencias`, 'green');
      } else {
        log(`  ${term}: 0 ocurrencias`, 'yellow');
        this.warnings.push(`Término clave '${term}' no encontrado en la documentación`);
      }
    }
  }

  // Validar completitud de especificaciones
  validateSpecifications() {
    logSubsection('Validando Especificaciones');
    
    const specFiles = [
      'specifications/functional/requirements.md',
      'specifications/functional/use-cases.md',
      'specifications/functional/user-stories.md',
      'specifications/functional/workflows.md',
      'specifications/functional/acceptance-criteria.md',
      'specifications/non-functional/performance.md',
      'specifications/non-functional/usability.md',
      'specifications/interfaces.md'
    ];
    
    for (const file of specFiles) {
      const filePath = path.join(CONFIG.docsPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        
        if (lines > 100) {
          log(`✅ ${file} - ${lines} líneas`, 'green');
          this.success.push(`Especificación ${file} tiene ${lines} líneas`);
        } else {
          log(`⚠️  ${file} - Solo ${lines} líneas`, 'yellow');
          this.warnings.push(`Especificación ${file} parece incompleta (${lines} líneas)`);
        }
      }
    }
  }

  // Validar enlaces externos
  validateExternalLinks() {
    logSubsection('Validando Enlaces Externos');
    
    // Esta validación requeriría una librería como 'axios' para hacer requests HTTP
    // Por ahora solo verificamos que los enlaces tengan formato válido
    log('⚠️  Validación de enlaces externos requiere conexión a internet', 'yellow');
    this.warnings.push('Validación de enlaces externos no implementada');
  }

  // Obtener todos los archivos Markdown
  getAllMarkdownFiles() {
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    walkDir(CONFIG.docsPath);
    return files;
  }

  // Ejecutar todas las validaciones
  runAllValidations() {
    logSection('INICIANDO VALIDACIÓN DE DOCUMENTACIÓN');
    
    this.validateDirectoryStructure();
    this.validateRequiredFiles();
    this.validateMarkdownFormat();
    this.validateMermaidDiagrams();
    this.validateConsistency();
    this.validateSpecifications();
    this.validateExternalLinks();
    
    this.generateReport();
  }

  // Generar reporte final
  generateReport() {
    logSection('REPORTE DE VALIDACIÓN');
    
    log(`\n📊 RESUMEN:`, 'bright');
    log(`  ✅ Éxitos: ${this.success.length}`, 'green');
    log(`  ⚠️  Advertencias: ${this.warnings.length}`, 'yellow');
    log(`  ❌ Errores: ${this.errors.length}`, 'red');
    
    if (this.success.length > 0) {
      logSubsection('Éxitos');
      for (const success of this.success.slice(0, 10)) {
        log(`  ✅ ${success}`, 'green');
      }
      if (this.success.length > 10) {
        log(`  ... y ${this.success.length - 10} más`, 'green');
      }
    }
    
    if (this.warnings.length > 0) {
      logSubsection('Advertencias');
      for (const warning of this.warnings) {
        log(`  ⚠️  ${warning}`, 'yellow');
      }
    }
    
    if (this.errors.length > 0) {
      logSubsection('Errores');
      for (const error of this.errors) {
        log(`  ❌ ${error}`, 'red');
      }
    }
    
    // Estado final
    if (this.errors.length === 0) {
      log(`\n🎉 VALIDACIÓN EXITOSA - Documentación lista para producción`, 'green');
      process.exit(0);
    } else {
      log(`\n⚠️  VALIDACIÓN CON ERRORES - Corregir antes de producción`, 'red');
      process.exit(1);
    }
  }
}

// Función principal
function main() {
  try {
    const validator = new DocumentationValidator();
    validator.runAllValidations();
  } catch (error) {
    log(`❌ Error durante la validación: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = DocumentationValidator;
