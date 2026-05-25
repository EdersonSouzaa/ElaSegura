import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MarkedZone } from '../components/LeafletMap';

/** Chave de persistência local das áreas marcadas pelo usuário (feat #71). */
export const MARKED_ZONES_KEY = '@elasegura/marked_zones';

/** Lê as áreas marcadas salvas no device. Retorna [] em caso de erro/ausência. */
export async function loadMarkedZones(): Promise<MarkedZone[]> {
  try {
    const raw = await AsyncStorage.getItem(MARKED_ZONES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persiste as áreas marcadas no device. */
export async function saveMarkedZones(zones: MarkedZone[]): Promise<void> {
  try {
    await AsyncStorage.setItem(MARKED_ZONES_KEY, JSON.stringify(zones));
  } catch {
    // ignora — persistência best-effort
  }
}

/**
 * Hook com estado para telas que EDITAM as áreas marcadas (ex.: tela do mapa).
 * Carrega do device ao montar e persiste automaticamente a cada alteração.
 */
export function useMarkedZones() {
  const [markedZones, setMarkedZones] = useState<MarkedZone[]>([]);
  const loadedRef = useRef(false);

  const reload = useCallback(async () => {
    const zones = await loadMarkedZones();
    setMarkedZones(zones);
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!loadedRef.current) return; // evita sobrescrever o que está salvo antes do load inicial
    saveMarkedZones(markedZones);
  }, [markedZones]);

  return { markedZones, setMarkedZones, reload };
}
