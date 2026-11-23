import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type PermissaoLocalizacao = 'concedida' | 'negada' | 'indisponivel';

/** Tempo máximo esperando a pessoa responder o pedido do navegador. */
const ESPERA_RESPOSTA_MS = 60_000;

/**
 * Pede acesso à localização e responde de forma igual no celular e na web.
 *
 * Na web não usamos Location.requestForegroundPermissionsAsync porque a
 * implementação do expo-location:
 *  - lança erro nos navegadores sem navigator.permissions.query (Safari
 *    antigo), e o toggle simplesmente não ligava, sem aviso nenhum;
 *  - fica esperando para sempre se a pessoa fecha o pedido sem responder
 *    (acontece no Firefox).
 * Aqui pedimos a posição direto ao navegador, que é o que faz o pedido de
 * permissão aparecer, com um limite de espera.
 */
export async function pedirPermissaoLocalizacao(): Promise<PermissaoLocalizacao> {
  if (Platform.OS !== 'web') {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted' ? 'concedida' : 'negada';
    } catch {
      return 'indisponivel';
    }
  }

  // Geolocalização no navegador só existe em HTTPS (ou localhost).
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'indisponivel';
  if (typeof window !== 'undefined' && window.isSecureContext === false) return 'indisponivel';

  return new Promise<PermissaoLocalizacao>((resolve) => {
    let respondeu = false;
    const responder = (valor: PermissaoLocalizacao) => {
      if (respondeu) return;
      respondeu = true;
      clearTimeout(limite);
      resolve(valor);
    };

    const limite = setTimeout(() => responder('negada'), ESPERA_RESPOSTA_MS);

    navigator.geolocation.getCurrentPosition(
      () => responder('concedida'),
      (erro) => {
        // Só PERMISSION_DENIED é recusa. Timeout ou "posição indisponível"
        // significam que a permissão foi dada, mas o GPS demorou: o
        // acompanhamento em tempo real (watchPosition) resolve depois.
        responder(erro.code === erro.PERMISSION_DENIED ? 'negada' : 'concedida');
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 }
    );
  });
}
