
import { Preset } from './types';

export const presets: Preset[] = [
  {
    key: 'horno-lento',
    name: 'Horno lento',
    values: {
      k: 0.015,
      tau: 180,
      l: 5,
      t_amb: 25
    }
  },
  {
    key: 'horno-medio',
    name: 'Horno medio',
    values: {
      k: 0.03,
      tau: 90,
      l: 3,
      t_amb: 25
    }
  },
  {
    key: 'chiller-compacto',
    name: 'Chiller compacto',
    values: {
      k: 0.04,
      tau: 60,
      l: 2,
      t_amb: 25
    }
  }
];
