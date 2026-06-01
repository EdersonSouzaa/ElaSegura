import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { getStyles } from '../styles/ocorrencias.styles';

type OccurrenceType = 'error' | 'warning';
type TabType = 'gerais' | 'proximas';

type Occurrence = {
  desc: string;
  distance: number;
  id: number;
  location: string;
  time: string;
  title: string;
  type: OccurrenceType;
};

type BackendOccurrence = {
  created_at: string;
  description: null | string;
  id: number;
  location: null | string;
  title: string;
};

const occurrenceTypes: { label: string; value: OccurrenceType; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { label: 'Emergencia', value: 'error', icon: 'error' },
  { label: 'Atencao', value: 'warning', icon: 'warning' },
];

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getOccurrenceType = (title: string, description: null | string): OccurrenceType => {
  const normalized = normalizeText(`${title} ${description ?? ''}`);
  const warningWords = ['atencao', 'suspeita', 'inseguranca', 'iluminacao'];

  return warningWords.some((word) => normalized.includes(word)) ? 'warning' : 'error';
};

const formatOccurrenceTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data nao informada';
  }

  return date
    .toLocaleString('pt-BR', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'long',
    })
    .replace(' de ', ' ');
};

const mapBackendOccurrence = (item: BackendOccurrence): Occurrence => ({
  desc: item.description || 'Sem descricao informada',
  distance: 0,
  id: Number(item.id),
  location: item.location?.trim() || 'Local nao informado',
  time: formatOccurrenceTime(item.created_at),
  title: item.title || 'Ocorrencia',
  type: getOccurrenceType(item.title || '', item.description),
});

const getStoredToken = async () => {
  const savedToken = await AsyncStorage.getItem('userToken');

  if (savedToken) {
    return savedToken;
  }

  const savedUser = await AsyncStorage.getItem('user');
  const savedPassword = await AsyncStorage.getItem('userPassword');

  if (!savedUser || !savedPassword) {
    return null;
  }

  const user = JSON.parse(savedUser);
  if (!user?.email) {
    return null;
  }

  const response = await api.post('/auth/login', {
    email: user.email,
    password: savedPassword,
  });

  if (!response.token) {
    return null;
  }

  await AsyncStorage.setItem('userToken', response.token);
  if (response.user) {
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
  }

  return response.token;
};

export default function Ocorrencias() {
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);

  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('proximas');
  const [radiusFilter, setRadiusFilter] = useState(1000);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OccurrenceType>('error');
  const [loadingOccurrences, setLoadingOccurrences] = useState(true);
  const [savingOccurrence, setSavingOccurrence] = useState(false);
  const [loadError, setLoadError] = useState('');

  const canSave =
    title.trim().length > 0 &&
    location.trim().length > 0 &&
    description.trim().length > 0 &&
    !savingOccurrence;

  const loadOccurrences = useCallback(async () => {
    try {
      setLoadingOccurrences(true);
      const token = await getStoredToken();

      if (!token) {
        setOccurrences([]);
        setLoadError('Entre na sua conta para ver e registrar ocorrencias.');
        return;
      }

      const data = await api.get('/ocorrencias', token);
      const backendOccurrences = Array.isArray(data) ? data : [];

      setOccurrences(backendOccurrences.map(mapBackendOccurrence));
      setLoadError('');
    } catch (error) {
      console.error('Erro ao carregar ocorrencias:', error);
      setLoadError('Nao foi possivel carregar as ocorrencias.');
    } finally {
      setLoadingOccurrences(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOccurrences();
    }, [loadOccurrences])
  );

  const filteredOccurrences = useMemo(() => {
    if (activeTab === 'gerais') {
      return occurrences;
    }

    return [...occurrences]
      .filter((item) => item.distance <= radiusFilter)
      .sort((a, b) => a.distance - b.distance);
  }, [activeTab, occurrences, radiusFilter]);

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setType('error');
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleRegisterOccurrence = async () => {
    if (!canSave) {
      return;
    }

    try {
      setSavingOccurrence(true);
      const token = await getStoredToken();

      if (!token) {
        Alert.alert('Login necessario', 'Entre na sua conta para registrar uma ocorrencia.');
        return;
      }

      await api.post(
        '/ocorrencias',
        {
          description: description.trim(),
          location: location.trim(),
          title: title.trim(),
        },
        token
      );

      await loadOccurrences();
      setActiveTab('gerais');
      closeModal();
    } catch (error: any) {
      console.error('Erro ao registrar ocorrencia:', error);
      Alert.alert('Erro', error.message || 'Nao foi possivel registrar a ocorrencia.');
    } finally {
      setSavingOccurrence(false);
    }
  };

  const FilterChip = ({ label, value }: { label: string; value: number }) => (
    <TouchableOpacity
      style={[styles.filterChip, radiusFilter === value && styles.activeFilterChip]}
      onPress={() => setRadiusFilter(value)}
    >
      <Text style={[styles.filterChipText, radiusFilter === value && styles.activeFilterChipText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Ocorrencias</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'proximas' ? 'Alertas perto de voce' : 'Historico da regiao'}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'proximas' && styles.activeTab]}
          onPress={() => setActiveTab('proximas')}
        >
          <Text style={[styles.tabText, activeTab === 'proximas' && styles.activeTabText]}>
            Proximas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'gerais' && styles.activeTab]}
          onPress={() => setActiveTab('gerais')}
        >
          <Text style={[styles.tabText, activeTab === 'gerais' && styles.activeTabText]}>
            Gerais
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'proximas' && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Raio de busca</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            <FilterChip label="500m" value={500} />
            <FilterChip label="1km" value={1000} />
            <FilterChip label="2km" value={2000} />
            <FilterChip label="5km" value={5000} />
          </ScrollView>
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.registerButton}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add-alert" size={22} color="#FFF" />
          <Text style={styles.registerButtonText}>Nova ocorrencia</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {loadingOccurrences ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.emptyText}>Carregando ocorrencias...</Text>
          </View>
        ) : filteredOccurrences.length > 0 ? (
          filteredOccurrences.map((item) => (
            <View key={item.id} style={styles.occurrenceCard}>
              <View style={styles.occurrenceIconBox}>
                <MaterialIcons
                  name={item.type === 'error' ? 'error' : 'warning'}
                  size={30}
                  color={colors.primary}
                />
              </View>

              <View style={styles.occurrenceInfo}>
                <View style={styles.occurrenceTopRow}>
                  <Text style={styles.occurrenceTitle}>{item.title}</Text>
                  <Text style={styles.occurrenceDate}>{item.time.split(',')[0]}</Text>
                </View>

                <Text style={styles.occurrenceDescription} numberOfLines={2}>
                  {item.desc}
                </Text>
                <Text style={styles.occurrenceTime}>{item.time}</Text>

                <View style={styles.distanceBadge}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={styles.distanceText}>{item.location}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="map-marker-off-outline"
              size={60}
              color={isDarkMode ? '#333' : '#EFEFEF'}
            />
            <Text style={styles.emptyText}>
              {loadError || 'Nenhuma ocorrencia neste raio.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registrar ocorrencia</Text>
                <Text style={styles.modalSubtitle}>Informe o que aconteceu</Text>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <MaterialIcons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Tipo</Text>
            <View style={styles.typeSelector}>
              {occurrenceTypes.map((item) => {
                const isActive = item.value === type;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.typeOption, isActive && styles.typeOptionActive]}
                    activeOpacity={0.8}
                    onPress={() => setType(item.value)}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={isActive ? '#FFF' : colors.primary}
                    />
                    <Text style={[styles.typeOptionText, isActive && styles.typeOptionTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Titulo</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Assedio, roubo, suspeita"
              placeholderTextColor="#A39EAE"
              maxLength={40}
            />

            <Text style={styles.inputLabel}>Bairro/local</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Centro, Meireles, Aldeota"
              placeholderTextColor="#A39EAE"
              maxLength={60}
            />

            <Text style={styles.inputLabel}>Descricao</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva a ocorrencia"
              placeholderTextColor="#A39EAE"
              multiline
              textAlignVertical="top"
              maxLength={160}
            />

            <TouchableOpacity
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleRegisterOccurrence}
              disabled={!canSave}
            >
              {savingOccurrence ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <MaterialIcons name="check-circle" size={22} color="#FFF" />
              )}
              <Text style={styles.saveButtonText}>
                {savingOccurrence ? 'Salvando...' : 'Salvar ocorrencia'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
