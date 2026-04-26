import React, { useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { styles } from '../styles/ocorrencias.styles';

type OccurrenceType = 'error' | 'warning';

type Occurrence = {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: OccurrenceType;
};

const initialOccurrences: Occurrence[] = [
  { id: 1, title: 'Roubo', desc: 'Pegaram meu celular na esquina', time: '10 Abril, 10:59', type: 'error' },
  { id: 2, title: 'Assédio', desc: 'Assoviaram para mim', time: '15 Abril, 11:30', type: 'error' },
  { id: 3, title: 'Insegurança', desc: 'Rua muito escura e sem policiamento', time: '16 Abril, 20:15', type: 'warning' },
  { id: 4, title: 'Tentativa de Furto', desc: 'Tentaram puxar minha bolsa', time: '18 Abril, 08:45', type: 'error' },
  { id: 5, title: 'Assédio Verbal', desc: 'Comentários ofensivos no ônibus', time: '20 Abril, 14:20', type: 'error' },
  { id: 6, title: 'Suspeita', desc: 'Carro seguindo lentamente', time: '21 Abril, 19:00', type: 'warning' },
];

const occurrenceTypes: { label: string; value: OccurrenceType; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { label: 'Emergência', value: 'error', icon: 'error' },
  { label: 'Atenção', value: 'warning', icon: 'warning' },
];

export default function Ocorrencias() {
  const [occurrences, setOccurrences] = useState(initialOccurrences);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OccurrenceType>('error');

  const canSave = title.trim().length > 0 && description.trim().length > 0;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('error');
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

  const handleRegisterOccurrence = () => {
    if (!canSave) {
      return;
    }

    const newOccurrence: Occurrence = {
      id: Date.now(),
      title: title.trim(),
      desc: description.trim(),
      time: formatOccurrenceTime(),
      type,
    };

    setOccurrences((currentOccurrences) => [newOccurrence, ...currentOccurrences]);
    closeModal();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ocorrências Gerais</Text>
          <Text style={styles.headerSubtitle}>Histórico de alertas na região</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.registerButton}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add-alert" size={22} color="#FFF" />
          <Text style={styles.registerButtonText}>Nova ocorrência</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {occurrences.map((item) => (
          <View key={item.id} style={styles.occurrenceCard}>
            <View style={styles.occurrenceIconBox}>
              <MaterialIcons name={item.type === 'error' ? 'error' : 'warning'} size={30} color="#F35F74" />
            </View>
            <View style={styles.occurrenceInfo}>
              <Text style={styles.occurrenceTitle}>{item.title}</Text>
              <Text style={styles.occurrenceDescription}>{item.desc}</Text>
              <Text style={styles.occurrenceTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registrar ocorrência</Text>
                <Text style={styles.modalSubtitle}>Informe o que aconteceu</Text>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <MaterialIcons name="close" size={26} color="#1A1A1A" />
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
                      color={isActive ? '#FFF' : '#F35F74'}
                    />
                    <Text style={[styles.typeOptionText, isActive && styles.typeOptionTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Título</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Assédio, roubo, suspeita"
              placeholderTextColor="#A39EAE"
              maxLength={40}
            />

            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva a ocorrência"
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
              <Text style={styles.saveButtonText}>Salvar ocorrência</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
