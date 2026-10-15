import type { Mode, Scenario } from '../engine/types';
import { v } from './helpers';

/** Escenarios ficticios (§3 y §4). No describen la situación actual de los países. */
export const SCENARIOS: Scenario[] = [
  { id: 'arg', mode: 'macro', name: 'Argentina', stats: v(50, 45, 50, 50), context: 'Fondos ajustados y presión sobre el costo de vida.', colors: ['#74acdf', '#f4f1e6', '#f6b40e'], emblem: 'sun' },
  { id: 'usa', mode: 'macro', name: 'Estados Unidos', stats: v(60, 45, 50, 45), context: 'Alta actividad y prioridades distributivas en tensión.', colors: ['#3c3b6e', '#f4f1e6', '#b22234'], emblem: 'star' },
  { id: 'bra', mode: 'macro', name: 'Brasil', stats: v(55, 50, 45, 50), context: 'Oportunidades productivas y demanda de servicios.', colors: ['#009c3b', '#ffdf00', '#002776'], emblem: 'globe' },
  { id: 'rus', mode: 'macro', name: 'Rusia', stats: v(50, 55, 45, 45), context: 'Recursos disponibles y desafíos de diversificación.', colors: ['#f4f1e6', '#0039a6', '#d52b1e'], emblem: 'tower' },
  { id: 'esp', mode: 'macro', name: 'España', stats: v(50, 50, 55, 50), context: 'Servicios consolidados y búsqueda de mayor actividad.', colors: ['#aa151b', '#f1bf00', '#aa151b'], emblem: 'castle' },

  { id: 'panaderia', mode: 'micro', name: 'Panadería', stats: v(50, 55, 50, 50), context: 'Harina, horno, panes, mostrador y panaderos.', colors: ['#c8873a', '#f3dfb5', '#7a4a22'], emblem: 'bread',
    vocab: { insumo: 'la harina', maquina: 'el horno', producto: 'panes y facturas', local: 'la panadería' } },
  { id: 'heladeria', mode: 'micro', name: 'Heladería', stats: v(50, 55, 50, 55), context: 'Leche, freezer, helados y atención al público.', colors: ['#f2a7b8', '#fff6e8', '#7ac2c9'], emblem: 'icecream',
    vocab: { insumo: 'la leche', maquina: 'el freezer', producto: 'helados', local: 'la heladería' } },
  { id: 'traduccion', mode: 'micro', name: 'Agencia de traducción', stats: v(55, 45, 55, 55), context: 'Licencias, computadoras, entregas y traductores.', colors: ['#4a6b8c', '#eef0f2', '#c9a46a'], emblem: 'quill',
    vocab: { insumo: 'las licencias de software', maquina: 'la computadora principal', producto: 'traducciones', local: 'la oficina de la agencia' } },
  { id: 'ceramica', mode: 'micro', name: 'Taller de cerámica', stats: v(50, 45, 55, 60), context: 'Arcilla, horno, piezas y artesanos.', colors: ['#b5603a', '#efe0cc', '#5a6b4a'], emblem: 'vase',
    vocab: { insumo: 'la arcilla', maquina: 'el horno de cerámica', producto: 'piezas de cerámica', local: 'el taller' } },
  { id: 'reparacion', mode: 'micro', name: 'Taller de reparación', stats: v(55, 50, 50, 50), context: 'Repuestos, herramientas, trabajos y técnicos.', colors: ['#5a6b7a', '#e6e2d8', '#d98c2a'], emblem: 'gear',
    vocab: { insumo: 'los repuestos', maquina: 'el banco de herramientas', producto: 'reparaciones', local: 'el taller' } },
];

export const scenariosFor = (mode: Mode) => SCENARIOS.filter((s) => s.mode === mode);
export const scenarioById = (id: string) => {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Escenario desconocido: ${id}`);
  return s;
};
