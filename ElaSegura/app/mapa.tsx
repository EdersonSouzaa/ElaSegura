import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import { getStyles } from '../styles/mapa.styles';
<<<<<<< HEAD
import AsyncStorage from '@react-native-async-storage/async-storage';
=======
import { useLocation } from '../hooks/use-location';
import { useMarkedZones } from '../hooks/use-marked-zones';
import {
  LeafletMap,
  type RiskZone,
  type IncidentMarker,
  type ZoneLevel,
  type LatLngBounds,
} from '../components/LeafletMap';
>>>>>>> 825f13121a140c02c90bd695a3f4b1dbd851285a
import { api } from '../services/api';

const FORTALEZA_BOUNDS: LatLngBounds = [
  [-3.9, -38.65],
  [-3.65, -38.35],
];
const FORTALEZA_CENTER: [number, number] = [-3.766, -38.483];

/** Raio (em metros) das áreas marcadas pelo usuário (feat #71). */
const MARK_RADIUS = 250;

const SAMPLE_RISK_ZONES: RiskZone[] = [
  { id: 1, lat: -3.771, lng: -38.479, radius: 800, level: 'safe', label: 'Área segura' },
  { id: 2, lat: -3.754, lng: -38.490, radius: 1000, level: 'safe', label: 'Área segura' },
  { id: 3, lat: -3.760, lng: -38.470, radius: 600, level: 'alert', label: 'Atenção' },
  { id: 4, lat: -3.768, lng: -38.500, radius: 900, level: 'danger', label: 'Área de perigo' },
];

const ZONES: { level: ZoneLevel; label: string; color: string }[] = [
  { level: 'safe', label: 'Seguras', color: '#34C759' },
  { level: 'alert', label: 'Alerta', color: '#FFCC00' },
  { level: 'danger', label: 'Perigo', color: '#FF3B30' },
];

export default function MapaScreen() {
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);

<<<<<<< HEAD
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const webViewRef = useRef<WebView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
=======
  const { coords, errorMsg, loading } = useLocation();
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [sharing, setSharing] = useState(false);
  const mapRef = useRef<{ recenter: () => void }>(null);
>>>>>>> 825f13121a140c02c90bd695a3f4b1dbd851285a

  // feat #71 — marcação de áreas: cor "armada" na legenda + áreas marcadas (persistidas no device)
  const [markColor, setMarkColor] = useState<ZoneLevel | null>(null);
  const { markedZones, setMarkedZones } = useMarkedZones();

  const selectMarkColor = (level: ZoneLevel) => {
    setMarkColor((prev) => (prev === level ? null : level));
  };

<<<<<<< HEAD
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
=======
  // Toque no mapa em modo de marcação: adiciona uma área da cor armada
  const handleMapPress = (lat: number, lng: number) => {
    if (!markColor) return;
    setMarkedZones((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        lat,
        lng,
        level: markColor,
        radius: MARK_RADIUS,
      },
    ]);
  };

  // Toque numa área marcada (fora do modo de marcação): oferece remover
  const handleMarkPress = (id: string) => {
    if (markColor) return; // marcando: não remove
    Alert.alert('Remover marcação', 'Deseja remover esta área marcada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => setMarkedZones((prev) => prev.filter((z) => z.id !== id)),
      },
    ]);
>>>>>>> 825f13121a140c02c90bd695a3f4b1dbd851285a
  };

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    (async () => {
      try {
<<<<<<< HEAD
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
=======
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;
        const data = await api.get(
          `/ocorrencias/proximas?lat=${coords.latitude}&lng=${coords.longitude}&radius=5000`,
          token
>>>>>>> 825f13121a140c02c90bd695a3f4b1dbd851285a
        );
        if (cancelled || !Array.isArray(data)) return;
        setIncidents(
          data
            .filter((o: any) => o.latitude != null && o.longitude != null)
            .map((o: any) => ({
              id: o.id,
              lat: Number(o.latitude),
              lng: Number(o.longitude),
              type: o.type === 'warning' ? 'warning' : 'error',
              title: o.title,
            }))
        );
      } catch {
        // silent — sem conexão ainda mostra mapa
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords?.latitude, coords?.longitude]);

<<<<<<< HEAD
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
=======
  const shareLocation = async () => {
    if (!coords) {
      Alert.alert('Localização', 'Aguardando GPS...');
      return;
    }
    setSharing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Atenção', 'Faça login para compartilhar sua localização.');
        return;
      }
      const locationStr = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      const res = await api.post('/sos', { location: locationStr }, token);
      const num = res?.contatosEmergencia?.length ?? 0;
      Alert.alert(
        'Localização compartilhada',
        num > 0
          ? `Sua localização foi enviada para ${num} contato(s) de emergência.`
          : 'SOS registrado, mas você não tem contatos emergenciais cadastrados.'
      );
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível compartilhar a localização.');
    } finally {
      setSharing(false);
    }
  };
>>>>>>> 825f13121a140c02c90bd695a3f4b1dbd851285a

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mapa de Risco</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.mapContainer}>
        <LeafletMap
          ref={mapRef}
          userCoords={coords}
          riskZones={SAMPLE_RISK_ZONES}
          incidents={incidents}
          showIncidents
          markedZones={markedZones}
          drawColor={markColor}
          onMapPress={handleMapPress}
          onMarkPress={handleMarkPress}
          maxBounds={FORTALEZA_BOUNDS}
          initialCenter={FORTALEZA_CENTER}
          initialZoom={14}
          isDarkMode={isDarkMode}
        />

        {/* Status overlay (loading / error) */}
        {(loading || errorMsg) && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: errorMsg ? 'rgba(255,59,48,0.92)' : 'rgba(0,122,255,0.92)' },
            ]}
          >
            {loading && !errorMsg ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialCommunityIcons name="alert-circle" size={18} color="#FFF" />
            )}
            <Text style={styles.statusText}>{errorMsg ?? 'Obtendo localização...'}</Text>
          </View>
        )}

        {/* Dica do modo de marcação (feat #71) */}
        {markColor && (
          <View style={[styles.statusBanner, { backgroundColor: 'rgba(156,39,176,0.95)' }]}>
            <MaterialCommunityIcons name="map-marker-plus" size={18} color="#FFF" />
            <Text style={styles.statusText}>
              Toque no mapa para marcar uma área. Toque na cor de novo para sair.
            </Text>
          </View>
        )}

        {/* Legenda (toque numa cor para marcar áreas no mapa — feat #71) */}
        <View style={styles.legendaContainer}>
          <Text style={styles.legendaTitle}>Marcar área</Text>
          {ZONES.map((z, i) => {
            const selected = markColor === z.level;
            const inactive = markColor !== null && !selected;
            const isLast = i === ZONES.length - 1;
            return (
              <TouchableOpacity
                key={z.level}
                style={[
                  styles.legendaItem,
                  isLast && { marginBottom: 0 },
                  inactive && styles.legendaItemInactive,
                ]}
                onPress={() => selectMarkColor(z.level)}
                activeOpacity={0.7}
              >
                <View style={[styles.legendaColorBox, { backgroundColor: z.color }]} />
                <Text style={styles.legendaItemText}>{z.label}</Text>
                {selected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color={z.color}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FABs: recenter + share location */}
        <View style={styles.fabColumn}>
          <TouchableOpacity style={styles.fab} onPress={() => mapRef.current?.recenter()}>
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.primary ?? '#4285F4'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, styles.fabPrimary]} onPress={shareLocation} disabled={sharing}>
            {sharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
