import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import { api } from '../services/api';

const CompartilharScreen = () => {
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];

  const [isLoading, setIsLoading] = useState(false);

  // Captura a posicao atual (web e nativo), seguindo o mesmo padrao do SOS.
  const getCurrentCoords = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const lastKnown = await Location.getLastKnownPositionAsync({});
    let locCoords = lastKnown ? lastKnown.coords : null;
    if (!locCoords) {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      locCoords = loc.coords;
    }
    return locCoords ? { latitude: locCoords.latitude, longitude: locCoords.longitude } : null;
  };

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const coords = await getCurrentCoords();
      if (!coords) {
        Alert.alert(
          'Localização indisponível',
          'Não foi possível obter sua localização. Verifique a permissão de localização e tente novamente.'
        );
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      // O backend registra o compartilhamento e devolve os contatos
      // emergenciais + a mensagem pronta (refs #82).
      let response;
      try {
        response = await api.post('/compartilhamento', coords, token);
      } catch (err: any) {
        Alert.alert(
          'Nenhum contato emergencial',
          'Você não possui contatos emergenciais cadastrados. Adicione contatos e marque-os como emergenciais.'
        );
        return;
      }

      const { contatos, body } = response;

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'SMS indisponível',
          'Este dispositivo não consegue enviar SMS. Tente em um celular com chip ativo.'
        );
        return;
      }

      const phones = contatos.map((c: any) => c.phone);
      const { result } = await SMS.sendSMSAsync(phones, body);

      if (result === 'sent') {
        Alert.alert('Localização compartilhada', 'Sua localização foi enviada por SMS aos seus contatos emergenciais. 💜');
      } else if (result === 'cancelled') {
        Alert.alert('Envio cancelado', 'O SMS não foi enviado.');
      }
      // No Android o resultado e sempre 'unknown' (o app de SMS nao reporta o envio).
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar sua localização. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <MaterialCommunityIcons name="map-marker-radius" size={52} color="#FFFFFF" />
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 12, textAlign: 'center' }}>
          Compartilhar Localização
        </Text>
        <Text style={{ fontSize: 15, color: colors.secondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
          Sua localização atual será enviada por SMS para todos os seus contatos emergenciais, com um link do Google Maps.
        </Text>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            opacity: isLoading ? 0.7 : 1,
          }}
          activeOpacity={0.8}
          onPress={handleShare}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <MaterialIcons name="sms" size={22} color="#FFFFFF" />
          )}
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
            {isLoading ? 'Obtendo localização...' : 'Compartilhar por SMS'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 16, paddingVertical: 12 }}
          activeOpacity={0.7}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={{ color: colors.secondary, fontSize: 15 }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CompartilharScreen;
