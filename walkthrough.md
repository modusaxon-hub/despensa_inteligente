# Implementación de Planificador Maestro (Excel-Style & Plaza de Mercado)

## 🎯 Objetivo
Transformar el catálogo actual en una cuadrícula comparativa tipo Excel que permita seleccionar cantidades, comparar tiendas dinámicamente y gestionar presupuestos especiales para "Plaza de Mercado" y "Carnicería".

## 📋 Tareas Pendientes
- [ ] **Data Recovery**: Re-importar los 412 productos del CSV a la nueva estructura.
- [ ] **UI Layout**: Convertir la lista en una tabla comparativa con columnas para D1, Olímpica, Megatiendas y un selector especial de "Canal de Compra" (Tienda vs Plaza vs Carnicería).
- [ ] **Presupuesto Especial**: Implementar la lógica del presupuesto asignado para Plaza/Carnicería.
- [ ] **Jerarquía de Visualización**: Priorizar los items de Plaza y Carnicería al principio de la lista.

## 🚶 Walkthrough de la Experiencia
1. **Configuración de Presupuesto Inicial**: Al cargar, el sistema preguntará si planeas ir a la Plaza de Mercado o Carnicería Central y cuánto dinero tienes destinado.
2. **Selección Maestra**: Verás una fila por producto con su selector de cantidad. A la derecha, verás celdas de precios para cada tienda.
3. **Optimización de Canal**: Podrás marcar si ese producto lo comprarás mediante el comparador de tiendas o si "va para la bolsa" del presupuesto de la Plaza.
4. **Resumen de Ahorro**: El presupuesto mostrará cuánto del dinero de Plaza se ha consumido y cuánto estás ahorrando en las tiendas optimizadas.

*Este archivo describe el roadmap acordado para la sesión actual.*
