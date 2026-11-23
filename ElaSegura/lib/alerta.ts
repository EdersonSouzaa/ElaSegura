import { Alert, Platform } from 'react-native';

/**
 * Aviso simples (título + mensagem + OK) que funciona também na web.
 *
 * No react-native-web, Alert.alert não faz nada: a mensagem simplesmente
 * não aparece. Na web usamos o alert nativo do navegador.
 */
export function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem, [{ text: 'OK' }]);
}
