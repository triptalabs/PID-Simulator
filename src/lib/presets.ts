
import { Preset } from './types';
import { PRESETS } from '../config/app.config';

// Convertir presets de configuración centralizada al formato esperado
export const presets: Preset[] = [
  {
    key: 'horno-lento',
    name: PRESETS.plant.horno_lento.name,
    values: {
      k: PRESETS.plant.horno_lento.K,
      tau: PRESETS.plant.horno_lento.tau,
      l: PRESETS.plant.horno_lento.L,
      t_amb: PRESETS.plant.horno_lento.T_amb
    }
  },
  {
    key: 'horno-medio',
    name: PRESETS.plant.horno_medio.name,
    values: {
      k: PRESETS.plant.horno_medio.K,
      tau: PRESETS.plant.horno_medio.tau,
      l: PRESETS.plant.horno_medio.L,
      t_amb: PRESETS.plant.horno_medio.T_amb
    }
  },
  {
    key: 'chiller-compacto',
    name: PRESETS.plant.chiller_compacto.name,
    values: {
      k: PRESETS.plant.chiller_compacto.K,
      tau: PRESETS.plant.chiller_compacto.tau,
      l: PRESETS.plant.chiller_compacto.L,
      t_amb: PRESETS.plant.chiller_compacto.T_amb
    }
  }
];
