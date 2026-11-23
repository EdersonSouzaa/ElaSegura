import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { pedirPermissaoLocalizacao } from '../lib/localizacao';

export type Coords = { latitude: number; longitude: number };

type UseLocationResult = {
  coords: Coords | null;
  accuracy: number | null;
  errorMsg: string | null;
  loading: boolean;
};

export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      // Helper próprio em vez do expo-location direto: na web o pedido do
      // expo-location falha em alguns navegadores (ver lib/localizacao.ts).
      if ((await pedirPermissaoLocalizacao()) !== 'concedida') {
        if (!cancelled) {
          setErrorMsg('Permissão de localização negada');
          setLoading(false);
        }
        return;
      }

      const last = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
      if (last && !cancelled) {
        setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
        setAccuracy(last.coords.accuracy ?? null);
        setLoading(false);
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          if (cancelled) return;
          setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setAccuracy(loc.coords.accuracy ?? null);
          setLoading(false);
        }
      );
    })().catch((e) => {
      if (!cancelled) {
        setErrorMsg(e?.message ?? 'Erro ao obter localização');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return { coords, accuracy, errorMsg, loading };
}
