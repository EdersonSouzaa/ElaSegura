
import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type EmergencyNumber = {
  label: string;
  number: string;
  icon: IconName;
  color: string;
  primary?: boolean;
};

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  { label: 'Central de Atendimento à Mulher', number: '180', icon: 'human-female', color: '#9C27B0', primary: true },
  { label: 'Polícia Militar', number: '190', icon: 'police-badge', color: '#1565C0' },
  { label: 'Polícia Federal', number: '194', icon: 'shield-star', color: '#2E7D32' },
  { label: 'SAMU', number: '192', icon: 'ambulance', color: '#C62828' },
  { label: 'Bombeiros', number: '193', icon: 'fire-truck', color: '#EF6C00' },
];

// Número discado quando a usuária aciona a ação direta (one-tap).
export const DEFAULT_EMERGENCY_NUMBER =
  EMERGENCY_NUMBERS.find((n) => n.primary) ?? EMERGENCY_NUMBERS[0];
