import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { getStyles } from '../styles/home.styles';

const MAPA_IMAGE = require('../assets/images/mapa.png');
const CONTATOS_IMAGE = require('../assets/images/contatos.png');
const ALERTA_IMAGE = require('../assets/images/alerta.png');
const AREAS_IMAGE = require('../assets/images/areas.png');
const HOME_RECENT_CLEAR_KEY = 'homeRecentClearedAt';

type HomeOccurrence = {
  created_at: string;
  description: null | string;
  id: number;
  location: null | string;
  title: string;
  user_name: string;
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const Home = () => {
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [recentOccurrences, setRecentOccurrences] = useState<HomeOccurrence[]>([]);
  const [recentOccurrencesError, setRecentOccurrencesError] = useState('');
  const [loadingRecentOccurrences, setLoadingRecentOccurrences] = useState(true);
  const [recentClearedAt, setRecentClearedAt] = useState<null | string>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (!savedUser) {
          return;
        }

        const user = JSON.parse(savedUser);
        const firstName = user.name.split(' ')[0];
        setUserName(firstName);
      } catch (error) {
        console.error('Erro ao carregar nome:', error);
      }
    };

    loadUserName();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permissao para notificacoes negada');
      }
    })();
  }, []);

  const loadRecentOccurrences = useCallback(async () => {
    try {
      setLoadingRecentOccurrences(true);
      const clearedAt = await AsyncStorage.getItem(HOME_RECENT_CLEAR_KEY);
      setRecentClearedAt(clearedAt);

      const token = await AsyncStorage.getItem('userToken');
      const data = token
        ? await api.get('/ocorrencias/recentes', token)
        : await api.get('/ocorrencias/recentes');
      const allOccurrences = Array.isArray(data) ? data : [];
      const filteredOccurrences = clearedAt
        ? allOccurrences.filter(
            (item) => new Date(item.created_at).getTime() > new Date(clearedAt).getTime()
          )
        : allOccurrences;

      setRecentOccurrences(filteredOccurrences);
      setRecentOccurrencesError('');
    } catch (error) {
      console.error('Erro ao carregar ocorrencias recentes:', error);
      setRecentOccurrencesError('Nao foi possivel carregar as ocorrencias recentes.');
    } finally {
      setLoadingRecentOccurrences(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentOccurrences();
    }, [loadRecentOccurrences])
  );

  const formatOccurrenceTime = (value: string) =>
    new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
    });

  const visibleOccurrences = recentOccurrences.slice(0, 2);

  const clearRecentOccurrences = async () => {
    const performClear = async () => {
      const now = new Date().toISOString();
      setRecentClearedAt(now);
      setRecentOccurrences([]);
      setModalVisible(false);
      try {
        await AsyncStorage.setItem(HOME_RECENT_CLEAR_KEY, now);
      } catch (storageError) {
        console.error('Erro ao salvar limpeza local das ocorrencias:', storageError);
      }
    };

    if (Platform.OS === 'web') {
      await performClear();
      return;
    }

    Alert.alert(
      'Limpar ocorrencias recentes?',
      'As ocorrencias atuais sairao da Home e voltarao apenas quando novas forem registradas.',
      [
        { style: 'cancel', text: 'Cancelar' },
        {
          style: 'destructive',
          text: 'Limpar',
          onPress: () => {
            void performClear();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? colors.cardBackground : '#FFF'}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <Text style={styles.headerGreeting}>Ola, {userName || 'Usuaria'} 👋</Text>
              <Text style={styles.headerStatus}>Voce esta segura aqui 💜</Text>
            </View>

            <TouchableOpacity
              style={styles.headerAvatar}
              onPress={() => router.push('/perfil')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity activeOpacity={0.9} style={styles.mapCard}>
            <Image source={MAPA_IMAGE} style={styles.mapImage} resizeMode="cover" />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Acesso rapido</Text>
          <View style={styles.quickAccessGrid}>
            <QuickAccessCard
              styles={styles}
              icon={<MaterialCommunityIcons name="file-alert-outline" size={28} color={colors.primary} />}
              label="Ocorrencias"
              onPress={() => router.push('/ocorrencias')}
            />

            <QuickAccessCard
              styles={styles}
              icon={
                <Image
                  source={CONTATOS_IMAGE}
                  style={[styles.quickAccessIconImage, { tintColor: colors.primary }]}
                  resizeMode="contain"
                />
              }
              label="Contatos SOS"
              onPress={() => router.push('/contatos')}
            />

            <QuickAccessCard
              styles={styles}
              icon={
                <Image
                  source={ALERTA_IMAGE}
                  style={[styles.quickAccessIconImage, { tintColor: colors.primary }]}
                  resizeMode="contain"
                />
              }
              label="Alertas Recentes"
              onPress={() => router.push('/alertas' as any)}
            />

            <QuickAccessCard
              styles={styles}
              icon={
                <Image
                  source={AREAS_IMAGE}
                  style={[styles.quickAccessIconImage, { tintColor: colors.primary }]}
                  resizeMode="contain"
                />
              }
              label="Areas de risco"
              onPress={() => router.push('/mapa' as any)}
            />
          </View>

          <View style={styles.sosWrapper}>
            <TouchableOpacity
              style={styles.sosButton}
              activeOpacity={0.8}
              onPress={() => router.push('/sos' as any)}
            >
              <MaterialCommunityIcons name="shield-alert" size={45} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.recentSectionHeader}>
            <Text style={styles.sectionTitle}>Ocorrencias Recentes</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity hitSlop={8} onPress={clearRecentOccurrences}>
                <Text style={{ color: colors.secondary, fontWeight: '600' }}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Ver todas ❯</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loadingRecentOccurrences ? (
            <View style={styles.loadingOccurrencesContainer}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingOccurrencesText}>Carregando ocorrencias...</Text>
            </View>
          ) : recentOccurrencesError ? (
            <View style={styles.emptyOccurrencesCard}>
              <Text style={styles.emptyOccurrencesTitle}>Nao foi possivel carregar</Text>
              <Text style={styles.emptyOccurrencesText}>{recentOccurrencesError}</Text>
            </View>
          ) : recentOccurrences.length === 0 && recentClearedAt ? (
            <View style={styles.emptyOccurrencesCard}>
              <Text style={styles.emptyOccurrencesTitle}>Lista limpa na Home</Text>
              <Text style={styles.emptyOccurrencesText}>
                Novas ocorrencias aparecerao aqui automaticamente.
              </Text>
            </View>
          ) : recentOccurrences.length === 0 ? (
            <View style={styles.emptyOccurrencesCard}>
              <Text style={styles.emptyOccurrencesTitle}>Nenhuma ocorrencia recente</Text>
              <Text style={styles.emptyOccurrencesText}>
                Assim que novas ocorrencias forem registradas, elas aparecerao aqui.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 15 }}>
              {visibleOccurrences.map((item) => (
                <OccurrenceCard
                  key={item.id}
                  styles={styles}
                  colors={colors}
                  title={item.title}
                  description={item.description || item.location || 'Ocorrencia registrada'}
                  time={formatOccurrenceTime(item.created_at)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem
          active
          icon={<MaterialIcons name="home" size={28} color={colors.primary} />}
          label="Inicio"
          styles={styles}
        />
        <NavItem
          icon={<MaterialCommunityIcons name="alert-outline" size={28} color={colors.secondary} />}
          label="Ocorrencias"
          onPress={() => router.push('/ocorrencias')}
          styles={styles}
        />
        <NavItem
          icon={<MaterialCommunityIcons name="account-plus-outline" size={28} color={colors.secondary} />}
          label="Contatos"
          onPress={() => router.push('/contatos')}
          styles={styles}
        />
        <NavItem
          icon={<MaterialCommunityIcons name="bell-outline" size={28} color={colors.secondary} />}
          label="Alertas"
          onPress={() => router.push('/alertas' as any)}
          styles={styles}
        />
        <NavItem
          icon={<MaterialCommunityIcons name="account-circle-outline" size={28} color={colors.secondary} />}
          label="Perfil"
          onPress={() => router.push('/perfil')}
          styles={styles}
        />
        <NavItem
          icon={<MaterialCommunityIcons name="cog-outline" size={28} color={colors.secondary} />}
          label="Ajustes"
          onPress={() => router.push('/settings')}
          styles={styles}
        />
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.sectionTitle}>Ultimas Ocorrencias</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingRecentOccurrences ? (
                <View style={styles.loadingOccurrencesContainer}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.loadingOccurrencesText}>Carregando ocorrencias...</Text>
                </View>
              ) : recentOccurrences.length === 0 ? (
                <View style={styles.emptyOccurrencesCard}>
                  <Text style={styles.emptyOccurrencesTitle}>Nenhuma ocorrencia recente</Text>
                  <Text style={styles.emptyOccurrencesText}>
                    Nenhum item foi encontrado para exibir no momento.
                  </Text>
                </View>
              ) : (
                recentOccurrences.map((item) => (
                  <View key={item.id} style={styles.occurrenceCard}>
                    <View style={styles.occurrenceIconBox}>
                      <MaterialIcons name="error" size={30} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.occurrenceTitle}>{item.title}</Text>
                      <Text style={styles.occurrenceDescription}>
                        {item.description || item.location || 'Ocorrencia registrada'}
                      </Text>
                      <Text style={styles.occurrenceTime}>{formatOccurrenceTime(item.created_at)}</Text>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const QuickAccessCard = ({ icon, label, onPress, styles }: any) => (
  <TouchableOpacity style={styles.quickAccessCard} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.quickAccessIconBox}>{icon}</View>
    <Text style={styles.quickAccessLabel}>{label}</Text>
  </TouchableOpacity>
);

const OccurrenceCard = ({ title, description, time, styles, colors }: any) => (
  <View style={styles.occurrenceCard}>
    <View style={styles.occurrenceIconBox}>
      <MaterialCommunityIcons name="alert-circle" size={30} color={colors.primary} />
    </View>
    <View style={styles.occurrenceInfo}>
      <Text style={styles.occurrenceTitle}>{title}</Text>
      <Text style={styles.occurrenceDescription}>{description}</Text>
      <View style={styles.occurrenceTimeRow}>
        <MaterialCommunityIcons name="clock-outline" size={12} color={colors.secondary} />
        <Text style={styles.occurrenceTime}>{time}</Text>
      </View>
    </View>
  </View>
);

const NavItem = ({ active, icon, label, onPress, styles }: any) => (
  <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={onPress}>
    <View style={active ? styles.navIconActive : undefined}>{icon}</View>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

export default Home;
