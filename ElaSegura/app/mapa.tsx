import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Colors as ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

type RiskLevel = 'safe' | 'medium' | 'danger';

type AreaItem = {
  incidents: number;
  name: string;
  risk: RiskLevel;
};

type OccurrenceItem = {
  bairro: string;
  created_at: string;
  id: number;
  risco: RiskLevel;
  tipo: string;
};

const getRiskConfig = (isDarkMode: boolean) => ({
  safe: {
    bg: isDarkMode ? '#1B2E1D' : '#E8F5E9',
    border: isDarkMode ? '#2D5131' : '#A5D6A7',
    icon: 'checkmark-circle' as const,
    iconColor: '#43A047',
    label: 'Seguro',
    text: isDarkMode ? '#81C784' : '#2E7D32',
  },
  medium: {
    bg: isDarkMode ? '#332B1A' : '#FFF8E1',
    border: isDarkMode ? '#5A4A2D' : '#FFD54F',
    icon: 'warning' as const,
    iconColor: '#FF8F00',
    label: 'Atencao',
    text: isDarkMode ? '#FFD54F' : '#E65100',
  },
  danger: {
    bg: isDarkMode ? '#331A1D' : '#FFEBEE',
    border: isDarkMode ? '#5A2D31' : '#EF9A9A',
    icon: 'alert-circle' as const,
    iconColor: '#E53935',
    label: 'Perigo',
    text: isDarkMode ? '#EF9A9A' : '#B71C1C',
  },
});

const getOccurrenceIcon = (type: string) => {
  const normalized = type.toLowerCase();

  if (normalized.includes('verbal')) {
    return { color: '#FB8C00', icon: 'megaphone-outline' as const };
  }
  if (normalized.includes('fisic')) {
    return { color: '#E53935', icon: 'hand-left-outline' as const };
  }
  if (normalized.includes('perseg')) {
    return { color: '#8E24AA', icon: 'walk-outline' as const };
  }
  if (normalized.includes('ilumin')) {
    return { color: '#3949AB', icon: 'bulb-outline' as const };
  }
  return { color: Colors.pinkBtn, icon: 'alert-outline' as const };
};

const formatRelativeTime = (value: string) => {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((now - date) / 60000));

  if (diffMinutes < 60) {
    return `ha ${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) {
    return `ha ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `ha ${days}d`;
};

export default function MapaScreen() {
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const colors = ThemeColors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);
  const riskConfig = useMemo(() => getRiskConfig(isDarkMode), [isDarkMode]);

  const [activeTab, setActiveTab] = useState<'bairros' | 'ocorrencias'>('ocorrencias');
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [selectedB, setSelectedB] = useState<null | string>(null);
  const [filter, setFilter] = useState('Todos');

  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const data = token
        ? await api.get('/ocorrencias/mapa', token)
        : await api.get('/ocorrencias/mapa');

      setAreas(Array.isArray(data.areas) ? data.areas : []);
      setOccurrences(Array.isArray(data.occurrences) ? data.occurrences : []);
      setError('');
    } catch (loadError) {
      console.error('Erro ao carregar mapa:', loadError);
      setError('Nao foi possivel carregar os dados do mapa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMapData();
    }, [loadMapData])
  );

  const filters = useMemo(() => {
    const types = Array.from(new Set(occurrences.map((o) => o.tipo))).filter(Boolean);
    return ['Todos', ...types];
  }, [occurrences]);

  const totalOcorrencias = useMemo(
    () => areas.reduce((accumulator, area) => accumulator + area.incidents, 0),
    [areas]
  );

  const ocorrenciasFiltradas = useMemo(
    () => occurrences.filter((occurrence) => filter === 'Todos' || occurrence.tipo === filter),
    [filter, occurrences]
  );

  const bairrosFiltrados = useMemo(() => {
    if (filter === 'Todos') {
      return areas;
    }

    const bairrosComTipo = new Set(
      occurrences
        .filter((occurrence) => occurrence.tipo === filter)
        .map((occurrence) => occurrence.bairro)
    );
    return areas.filter((area) => bairrosComTipo.has(area.name));
  }, [areas, filter, occurrences]);

  const handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
        return;
      }
    } catch (error) {
      console.error('Erro ao voltar da tela de mapa:', error);
    }
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Mapa de Seguranca</Text>
          <Text style={styles.headerSub}>Fortaleza · {totalOcorrencias} ocorrencias no mapa</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="location" size={14} color={Colors.pinkBtn} />
          <Text style={styles.headerBadgeText}>Atualizado</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <Image source={require('../assets/images/mapa.png')} style={styles.mapImage} resizeMode="cover" />
        <View style={styles.mapOverlay}>
          <View style={styles.mapYouPin}>
            <View style={styles.mapYouDot} />
            <Text style={styles.mapYouLabel}>Voce</Text>
          </View>
        </View>
        <View style={styles.mapBadgeRow}>
          {Object.entries(riskConfig).map(([key, value]) => (
            <View
              key={key}
              style={[styles.mapBadge, { backgroundColor: value.bg, borderColor: value.border }]}
            >
              <View style={[styles.mapBadgeDot, { backgroundColor: value.iconColor }]} />
              <Text style={[styles.mapBadgeText, { color: value.text }]}>{value.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { color: '#43A047', count: areas.filter((area) => area.risk === 'safe').length, label: 'Seguro' },
          {
            color: '#FF8F00',
            count: areas.filter((area) => area.risk === 'medium').length,
            label: 'Atencao',
          },
          { color: '#E53935', count: areas.filter((area) => area.risk === 'danger').length, label: 'Perigo' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={[styles.statNum, { color: stat.color }]}>{stat.count}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {filters.map((itemFilter) => (
            <TouchableOpacity
              key={itemFilter}
              style={[styles.chip, filter === itemFilter && styles.chipActive]}
              onPress={() => setFilter(itemFilter)}
            >
              <Text style={[styles.chipText, filter === itemFilter && styles.chipTextActive]}>
                {itemFilter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ocorrencias' && styles.tabActive]}
          onPress={() => setActiveTab('ocorrencias')}
        >
          <Text style={[styles.tabText, activeTab === 'ocorrencias' && styles.tabTextActive]}>
            Ocorrencias recentes
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{ocorrenciasFiltradas.length}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bairros' && styles.tabActive]}
          onPress={() => setActiveTab('bairros')}
        >
          <Text style={[styles.tabText, activeTab === 'bairros' && styles.tabTextActive]}>Bairros</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.pinkBtn} />
            <Text style={styles.emptyText}>Carregando dados do mapa...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={48} color="#FF8F00" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <>
            {activeTab === 'bairros' && (
              <View style={styles.grid}>
                {bairrosFiltrados.map((bairro) => {
                  const config = riskConfig[bairro.risk];
                  const selected = selectedB === bairro.name;

                  return (
                    <TouchableOpacity
                      key={bairro.name}
                      style={[
                        styles.bCard,
                        { borderColor: selected ? config.iconColor : config.border },
                        selected && { borderWidth: 2 },
                      ]}
                      onPress={() => setSelectedB(selected ? null : bairro.name)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.bCardTop}>
                        <View style={[styles.bRiskDot, { backgroundColor: config.iconColor }]} />
                        <Text style={styles.bName}>{bairro.name}</Text>
                        {bairro.incidents > 0 && (
                          <View style={[styles.bBadge, { backgroundColor: config.bg }]}>
                            <Text style={[styles.bBadgeText, { color: config.text }]}>{bairro.incidents}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.bRiskTag, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={11} color={config.iconColor} />
                        <Text style={[styles.bRiskLabel, { color: config.text }]}>{config.label}</Text>
                      </View>
                      {selected && (
                        <Text style={[styles.bDetail, { color: config.text }]}>
                          {bairro.incidents === 0
                            ? 'Nenhuma ocorrencia recente'
                            : `${bairro.incidents} ocorrencia${bairro.incidents > 1 ? 's' : ''} encontradas`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {activeTab === 'ocorrencias' && (
              <View style={styles.oList}>
                {ocorrenciasFiltradas.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle" size={48} color="#A5D6A7" />
                    <Text style={styles.emptyText}>Nenhuma ocorrencia encontrada</Text>
                  </View>
                )}
                {ocorrenciasFiltradas.map((occurrence) => {
                  const config = riskConfig[occurrence.risco];
                  const iconConfig = getOccurrenceIcon(occurrence.tipo);
                  return (
                    <View key={occurrence.id} style={styles.oCard}>
                      <View style={[styles.oIconBox, { backgroundColor: `${iconConfig.color}18` }]}>
                        <Ionicons name={iconConfig.icon} size={22} color={iconConfig.color} />
                      </View>
                      <View style={styles.oInfo}>
                        <Text style={styles.oTipo}>{occurrence.tipo}</Text>
                        <View style={styles.oMetaRow}>
                          <Ionicons name="location-outline" size={11} color={colors.secondary} />
                          <Text style={styles.oMeta}>{occurrence.bairro}</Text>
                          <Ionicons
                            name="time-outline"
                            size={11}
                            color={colors.secondary}
                            style={{ marginLeft: 8 }}
                          />
                          <Text style={styles.oMeta}>{formatRelativeTime(occurrence.created_at)}</Text>
                        </View>
                      </View>
                      <View style={[styles.oRiskTag, { backgroundColor: config.bg, borderColor: config.border }]}>
                        <Text style={[styles.oRiskText, { color: config.text }]}>{config.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.reportBtn}
          hitSlop={10}
          onPress={() => router.push('/ocorrencias')}
          activeOpacity={0.85}
        >
          <View style={styles.reportBtnInner}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.reportBtnText}>Reportar ocorrencia neste local</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.updateText}>
          <Ionicons name="refresh" size={11} color={colors.secondary} /> Atualiza quando voce abre a tela
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean, colors: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 15 : 10,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 5,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -4,
      zIndex: 10,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    headerSub: { fontSize: 13, color: colors.secondary, marginTop: 2 },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDarkMode ? '#2D2D2D' : '#FFF0F2',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
    },
    headerBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.pinkBtn },

    mapCard: {
      margin: 16,
      height: 180,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.cardBackground,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    mapImage: { width: '100%', height: '100%', opacity: isDarkMode ? 0.8 : 1 },
    mapOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' },
    mapYouPin: { alignItems: 'center' },
    mapYouDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: Colors.pinkBtn,
      borderWidth: 3,
      borderColor: colors.cardBackground,
      elevation: 4,
    },
    mapYouLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: isDarkMode ? '#FFF' : Colors.pinkD,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginTop: 4,
      overflow: 'hidden',
    },
    mapBadgeRow: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', gap: 6 },
    mapBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
    },
    mapBadgeDot: { width: 7, height: 7, borderRadius: 3.5 },
    mapBadgeText: { fontSize: 10, fontWeight: '700' },

    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 4 },
    statCard: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    statNum: { fontSize: 22, fontWeight: '700' },
    statLabel: { fontSize: 11, color: colors.secondary, marginTop: 2, fontWeight: '500' },

    filtersContainer: {
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      height: 75,
    },
    filtersContent: {
      paddingHorizontal: 12,
      gap: 10,
      flexDirection: 'row',
      alignItems: 'center',
      height: '100%',
    },
    chip: {
      height: 44,
      paddingHorizontal: 20,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDarkMode ? '#2D2D2D' : '#f9f9f9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipActive: { backgroundColor: Colors.pinkM, borderColor: Colors.pinkBtn },
    chipText: { fontSize: 14, color: colors.secondary, fontWeight: '500' },
    chipTextActive: { color: Colors.pinkD, fontWeight: '700' },

    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 10,
      gap: 6,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: Colors.pinkBtn },
    tabText: { fontSize: 13, color: colors.secondary, fontWeight: '500' },
    tabTextActive: { color: Colors.pinkBtn, fontWeight: '700' },
    tabBadge: { backgroundColor: Colors.pinkM, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
    tabBadgeText: { fontSize: 10, color: Colors.pinkD, fontWeight: '700' },

    scroll: { padding: 14, paddingBottom: 32, gap: 12 },

    grid: { gap: 10 },
    bCard: {
      width: '100%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 12,
      gap: 8,
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    bCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bRiskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    bName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
    bBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    bBadgeText: { fontSize: 10, fontWeight: '700' },
    bRiskTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    bRiskLabel: { fontSize: 10, fontWeight: '600' },
    bDetail: { fontSize: 11, marginTop: 2 },

    oList: { gap: 10 },
    oCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 5,
    },
    oIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    oInfo: { flex: 1 },
    oTipo: { fontSize: 14, fontWeight: '700', color: colors.text },
    oMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
    oMeta: { fontSize: 11, color: colors.secondary },
    oRiskTag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    oRiskText: { fontSize: 10, fontWeight: '700' },

    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 14, color: colors.secondary, fontWeight: '500', textAlign: 'center' },

    reportBtn: {
      backgroundColor: Colors.pinkBtn,
      borderRadius: 20,
      padding: 16,
      elevation: 4,
      shadowColor: '#F06292',
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    reportBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    reportBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    updateText: { textAlign: 'center', fontSize: 11, color: colors.secondary, paddingBottom: 4 },
  });
