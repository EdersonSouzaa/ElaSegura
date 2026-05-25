import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { api } from '../services/api';
import {
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
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/ocorrencias.styles';

type OccurrenceType = 'error' | 'warning';
type TabType = 'gerais' | 'proximas';

type Occurrence = {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: OccurrenceType;
  distance: number;
};

const initialOccurrences: Occurrence[] = [];

const occurrenceTypes: { label: string; value: OccurrenceType; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { label: 'Emergencia', value: 'error', icon: 'error' },
  { label: 'Atencao', value: 'warning', icon: 'warning' },
];

export default function Ocorrencias() {
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);

  const [occurrences, setOccurrences] = useState(initialOccurrences);
  const userIdRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('proximas');
  const [radiusFilter, setRadiusFilter] = useState(1000);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OccurrenceType>('error');
  const [distance, setDistance] = useState<number>(500);
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        let activeUserId: number | null = null;
        if (savedUser) {
          const user = JSON.parse(savedUser);
          activeUserId = user.id;
          userIdRef.current = user.id;
        }
        
        const key = activeUserId ? `@occurrences_data_${activeUserId}` : '@occurrences_data';
        const storedData = await AsyncStorage.getItem(key);
        if (storedData) {
          setOccurrences(JSON.parse(storedData));
        } else {
          setOccurrences([]);
        }
      } catch (e) {
        console.error('Failed to load occurrences', e);
      }
    };
    loadData();
  }, []);

  const saveOccurrences = async (newOccurrences: Occurrence[], activeUserId?: number | null) => {
    try {
      const idToUse = activeUserId !== undefined ? activeUserId : userIdRef.current;
      const key = idToUse ? `@occurrences_data_${idToUse}` : '@occurrences_data';
      await AsyncStorage.setItem(key, JSON.stringify(newOccurrences));
    } catch (e) {
      console.error('Failed to save occurrences', e);
    }
  };

  const canSave = title.trim().length > 0 && description.trim().length > 0;

const filteredOccurrences = useMemo(() => {
    let result = [...occurrences];

    if (activeTab === 'proximas') {
      result = result
        .filter((item) => item.distance === radiusFilter)
        .sort((a, b) => a.distance - b.distance);
    }

    if (activeTab === 'gerais' && categoryFilter !== 'Todos') {
      const normalize = (str: string) => 
        str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const termo = normalize(categoryFilter);
      
      result = result.filter((item) => {
        return normalize(item.title).includes(termo) || normalize(item.desc).includes(termo);
      });
    }

    return result;
  }, [activeTab, occurrences, radiusFilter, categoryFilter]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('error');
    setDistance(500);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const formatOccurrenceTime = () => {
    const now = new Date();
    const date = now
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
      .replace(' de ', ' ');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `${date}, ${time}`;
  };

  const handleRegisterOccurrence = async () => {
    if (!canSave) return;

    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        const loc = lastKnown ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
    } catch {}

    const newOccurrence: Occurrence = {
      id: Date.now(),
      title: title.trim(),
      desc: description.trim(),
      time: formatOccurrenceTime(),
      type,
      distance,
    };

    const updatedOccurrences = [newOccurrence, ...occurrences];
    setOccurrences(updatedOccurrences);
    saveOccurrences(updatedOccurrences);

    AsyncStorage.getItem('userToken').then(token => {
      if (!token) return;
      api.post('/ocorrencias', {
        title: title.trim(),
        description: description.trim(),
        type,
        latitude: lat,
        longitude: lng,
      }, token).catch(err => console.error('Erro ao salvar ocorrência na API:', err));
    });

    setCategoryFilter('Todos');
    setActiveTab('gerais');
    closeModal();
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

      {activeTab === 'gerais' && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {['Todos', 'Assédio', 'Roubo', 'Suspeita'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, categoryFilter === cat && styles.activeFilterChip]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.filterChipText, categoryFilter === cat && styles.activeFilterChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
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
        {filteredOccurrences.length > 0 ? (
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
                    name="map-marker-distance"
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={styles.distanceText}>
                    {item.distance >= 1000
                      ? `${(item.distance / 1000).toFixed(1)}km`
                      : `${item.distance}m`}{' '}
                    de distancia
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={50}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma ocorrência encontrada</Text>
            <Text style={styles.emptyText}>
              Nenhum alerta bate com o seu filtro atual.
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

            <Text style={styles.inputLabel}>Distancia estimada</Text>
            <View style={{ marginBottom: 16 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {[
                  { label: '500m', value: 500 },
                  { label: '1km', value: 1000 },
                  { label: '2km', value: 2000 },
                  { label: '5km', value: 5000 },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.filterChip, distance === item.value && styles.activeFilterChip]}
                    onPress={() => setDistance(item.value)}
                  >
                    <Text style={[styles.filterChipText, distance === item.value && styles.activeFilterChipText]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
              <MaterialIcons name="check-circle" size={22} color="#FFF" />
              <Text style={styles.saveButtonText}>Salvar ocorrencia</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
