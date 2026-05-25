import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, StatusBar, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import { getStyles } from '../styles/mapa.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function MapaDemo() {
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);

  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const webViewRef = useRef<WebView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const toggleZone = (zone: string) => {
    setActiveZone((prev) => (prev === zone ? null : zone));
  };

  const isInactive = (zone: string) => activeZone !== null && activeZone !== zone;

  const sendOccurrencesToWebView = (occs: any[]) => {
    const jsCode = `
      (function() {
        if (typeof window.addOccurrenceMarkers === 'function') {
          window.addOccurrenceMarkers(${JSON.stringify(occs)});
        }
      })();
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  const fetchNearbyOccurrences = async (lat: number, lng: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const data = await api.get(`/ocorrencias/proximas?lat=${lat}&lng=${lng}&radius=5000`, token);
      setOccurrences(data);
      sendOccurrencesToWebView(data);
    } catch (error) {
      console.error('Erro ao buscar ocorrências próximas:', error);
    }
  };

  // Função para enviar a localização do usuário para o WebView
  const sendLocationToWebView = (latitude: number, longitude: number) => {
    const jsCode = `
      (function() {
        if (typeof window.updateUserLocation === 'function') {
          window.updateUserLocation(${latitude}, ${longitude});
        }
      })();
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  // Solicita permissão e inicia o rastreamento de localização em tempo real
  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        // Solicita permissão de localização
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setLocationError(true);
            setLocationLoading(false);
          }
          Alert.alert(
            'Permissão de Localização',
            'É necessário permitir o acesso à localização para exibir sua posição em tempo real no mapa.'
          );
          return;
        }

        // Obtém a localização de forma rápida tentando primeiro a última conhecida
        const lastKnown = await Location.getLastKnownPositionAsync({});
        let initialCoords = lastKnown ? lastKnown.coords : null;

        if (!initialCoords) {
          const initialLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          initialCoords = initialLocation.coords;
        }

        if (initialCoords && isMounted) {
          const { latitude, longitude } = initialCoords;
          setUserLocation({ latitude, longitude });
          setLocationLoading(false);
          // Envia a localização inicial para o WebView
          sendLocationToWebView(latitude, longitude);
          fetchNearbyOccurrences(latitude, longitude);
        }

        // Inicia o rastreamento em tempo real
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Atualiza a cada 5 segundos
            distanceInterval: 10, // Ou a cada 10 metros de deslocamento
          },
          (location) => {
            if (isMounted) {
              const { latitude, longitude } = location.coords;
              setUserLocation({ latitude, longitude });
              sendLocationToWebView(latitude, longitude);
            }
          }
        );
      } catch (error) {
        console.error('Erro ao obter localização:', error);
        if (isMounted) {
          setLocationError(true);
          setLocationLoading(false);
        }
        Alert.alert('Erro', 'Não foi possível obter sua localização. Verifique se o GPS está ativado.');
      }
    };

    startLocationTracking();

    // Limpa o rastreamento ao desmontar o componente
    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { padding: 0; margin: 0; background-color: #E8EAED; }
            html, body, #map { height: 100%; width: 100%; }
            .leaflet-control-attribution { display: none !important; }

            /* Animação do marcador de localização do usuário */
            @keyframes userPulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.6); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }

            .user-location-marker {
                width: 24px;
                height: 24px;
                background-color: #007AFF;
                border: 3px solid #FFFFFF;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 122, 255, 0.5);
            }

            .user-location-pulse {
                width: 24px;
                height: 24px;
                background-color: rgba(0, 122, 255, 0.3);
                border-radius: 50%;
                animation: userPulse 2s ease-in-out infinite;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var bounds = [
                [-3.900, -38.650],
                [-3.650, -38.350]
            ];

            var map = L.map('map', {
                zoomControl: false,
                maxBounds: bounds,
                maxBoundsViscosity: 1.0,
                minZoom: 14
            }).setView([-3.766, -38.483], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);

            var activeFilter = "${activeZone || 'all'}";

            // Zonas Seguras (Verde)
            if (activeFilter === 'all' || activeFilter === 'seguras') {
                L.circle([-3.771, -38.479], { color: 'rgba(0, 255, 0, 0.8)', fillColor: 'rgba(0, 255, 0, 0.4)', fillOpacity: 1, radius: 800 }).addTo(map);
                L.circle([-3.754, -38.490], { color: 'rgba(0, 255, 0, 0.8)', fillColor: 'rgba(0, 255, 0, 0.4)', fillOpacity: 1, radius: 1000 }).addTo(map);
            }

            // Zonas de Alerta (Amarelo)
            if (activeFilter === 'all' || activeFilter === 'alerta') {
                L.circle([-3.760, -38.470], { color: 'rgba(255, 204, 0, 0.8)', fillColor: 'rgba(255, 204, 0, 0.4)', fillOpacity: 1, radius: 600 }).addTo(map);
            }

            // Zonas de Perigo (Vermelho)
            if (activeFilter === 'all' || activeFilter === 'perigo') {
                L.circle([-3.768, -38.500], { color: 'rgba(255, 59, 48, 0.8)', fillColor: 'rgba(255, 59, 48, 0.4)', fillOpacity: 1, radius: 900 }).addTo(map);
            }

            // --- Localização do Usuário em Tempo Real ---
            var userMarker = null;
            var userPulseMarker = null;

            // Função chamada pelo React Native para atualizar a localização do usuário
            window.updateUserLocation = function(lat, lng) {
                var userLatLng = [lat, lng];

                // Remove marcadores anteriores
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                if (userPulseMarker) {
                    map.removeLayer(userPulseMarker);
                }

                // Cria ícone personalizado para o marcador do usuário
                var userIcon = L.divIcon({
                    className: 'user-location-div-icon',
                    html: '<div class="user-location-pulse"></div><div class="user-location-marker"></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Adiciona marcador de pulso (efeito visual)
                userPulseMarker = L.marker(userLatLng, { icon: userIcon }).addTo(map);

                // Adiciona marcador principal
                userMarker = L.marker(userLatLng, {
                    icon: L.divIcon({
                        className: 'user-location-div-icon',
                        html: '<div style="width:14px;height:14px;background:#007AFF;border:3px solid #FFF;border-radius:50%;box-shadow:0 2px 8px rgba(0,122,255,0.6);"></div>',
                        iconSize: [14, 14],
                        iconAnchor: [7, 7]
                    })
                }).addTo(map);

                // Centraliza o mapa na localização do usuário
                map.panTo(userLatLng);
            };

            // Marcadores de ocorrências
            var occurrenceMarkers = [];

            window.addOccurrenceMarkers = function(occurrences) {
              occurrenceMarkers.forEach(function(m) { map.removeLayer(m); });
              occurrenceMarkers = [];

              occurrences.forEach(function(occ) {
                if (!occ.latitude || !occ.longitude) return;

                var color = occ.type === 'error' ? '#FF3B30' : '#FFCC00';
                var textColor = occ.type === 'error' ? 'white' : '#333';
                var icon = L.divIcon({
                  className: '',
                  html: '<div style="width:32px;height:32px;background:' + color + ';border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:' + textColor + ';font-weight:bold;font-size:17px;">!</div>',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16]
                });

                var marker = L.marker([occ.latitude, occ.longitude], { icon: icon })
                  .addTo(map)
                  .bindPopup('<b>' + occ.title + '</b><br><small>' + (occ.description || '') + '</small>');

                occurrenceMarkers.push(marker);
              });
            };

            // Recebe mensagens do React Native
            window.addEventListener('message', function(event) {
                try {
                    var data = JSON.parse(event.data);
                    if (data.type === 'location' && data.latitude && data.longitude) {
                        window.updateUserLocation(data.latitude, data.longitude);
                    }
                } catch (e) {
                    console.error('Erro ao processar mensagem:', e);
                }
            });
        </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mapa de Risco</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Container Principal */}
      <View style={styles.mapContainer}>

        {/* Mapa com Localização em Tempo Real */}
        <WebView
          ref={webViewRef}
          source={{ html: leafletHTML }}
          style={StyleSheet.absoluteFillObject}
          scrollEnabled={false}
          bounces={false}
          onMessage={(event) => {
            // Processa mensagens recebidas do WebView se necessário
            console.log('Mensagem do WebView:', event.nativeEvent.data);
          }}
        />

        {/* Indicador de carregamento de localização */}
        {locationLoading && (
          <View style={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(0, 122, 255, 0.9)',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <MaterialCommunityIcons name="loading" size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
              Obtendo localização...
            </Text>
          </View>
        )}

        {/* Indicador de erro de localização */}
        {locationError && !locationLoading && (
          <View style={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(255, 59, 48, 0.9)',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <MaterialCommunityIcons name="alert-circle" size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
              Localização indisponível
            </Text>
          </View>
        )}

        {/* Legenda Selecionável no Canto Inferior Direito */}
        <View style={styles.legendaContainer}>
          <Text style={styles.legendaTitle}>Zonas</Text>

          <TouchableOpacity
            style={[styles.legendaItem, isInactive('seguras') && styles.legendaItemInactive]}
            onPress={() => toggleZone('seguras')}
            activeOpacity={0.7}
          >
            <View style={[styles.legendaColorBox, { backgroundColor: '#34C759' }]} />
            <Text style={styles.legendaItemText}>Seguras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legendaItem, isInactive('alerta') && styles.legendaItemInactive]}
            onPress={() => toggleZone('alerta')}
            activeOpacity={0.7}
          >
            <View style={[styles.legendaColorBox, { backgroundColor: '#FFCC00' }]} />
            <Text style={styles.legendaItemText}>Alerta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legendaItem, { marginBottom: 0 }, isInactive('perigo') && styles.legendaItemInactive]}
            onPress={() => toggleZone('perigo')}
            activeOpacity={0.7}
          >
            <View style={[styles.legendaColorBox, { backgroundColor: '#FF3B30' }]} />
            <Text style={styles.legendaItemText}>Perigo</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
