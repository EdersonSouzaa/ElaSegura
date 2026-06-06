import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const NOTES_KEY = '@notepad_notes';
const UNLOCK_TAPS = 5;
const UNLOCK_WINDOW_MS = 3000;

type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

const DEFAULT_NOTES: Note[] = [
  {
    id: '1',
    title: 'Lista de compras',
    body: 'Frutas\nLeite\nPão\nQueijo\nOvos',
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    title: 'Ideias de presente',
    body: 'Livro, perfume, carteira',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export default function Notepad() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY).then(data => {
      if (data) {
        setNotes(JSON.parse(data));
      } else {
        setNotes(DEFAULT_NOTES);
        AsyncStorage.setItem(NOTES_KEY, JSON.stringify(DEFAULT_NOTES));
      }
    });
  }, []);

  const persistNotes = async (updated: Note[]) => {
    setNotes(updated);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  };

  const handleTitleTap = async () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);

    if (tapCount.current >= UNLOCK_TAPS) {
      tapCount.current = 0;
      const token = await AsyncStorage.getItem('userToken');
      router.replace(token ? '/home' : '/login');
      return;
    }

    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, UNLOCK_WINDOW_MS);
  };

  const openNewNote = () => {
    setActiveNote({
      id: Date.now().toString(),
      title: '',
      body: '',
      updatedAt: new Date().toISOString(),
    });
    setView('edit');
  };

  const openNote = (note: Note) => {
    setActiveNote(note);
    setView('edit');
  };

  const saveNote = async () => {
    if (!activeNote) return;
    if (!activeNote.title.trim() && !activeNote.body.trim()) {
      setView('list');
      return;
    }
    const rest = notes.filter(n => n.id !== activeNote.id);
    const saved = { ...activeNote, updatedAt: new Date().toISOString() };
    await persistNotes([saved, ...rest]);
    setView('list');
  };

  const deleteNote = () => {
    if (!activeNote) return;
    Alert.alert('Apagar Nota', 'Tem certeza que deseja apagar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await persistNotes(notes.filter(n => n.id !== activeNote.id));
          setView('list');
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // ── Tela de edição ────────────────────────────────────────────────────────
  if (view === 'edit' && activeNote) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F0EB" />

        <View style={styles.editHeader}>
          <TouchableOpacity onPress={saveNote} style={styles.backBtn} activeOpacity={0.6}>
            <MaterialCommunityIcons name="chevron-left" size={30} color="#F5A623" />
            <Text style={styles.backText}>Notas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteNote} activeOpacity={0.6} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#F5A623" />
          </TouchableOpacity>
        </View>

        <View style={styles.editBody}>
          <TextInput
            style={styles.noteTitle}
            placeholder="Título..."
            placeholderTextColor="#C7C7CC"
            value={activeNote.title}
            onChangeText={text => setActiveNote({ ...activeNote, title: text })}
            maxLength={100}
            returnKeyType="next"
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.noteBody}
            placeholder="Escreva sua nota..."
            placeholderTextColor="#C7C7CC"
            value={activeNote.body}
            onChangeText={text => setActiveNote({ ...activeNote, body: text })}
            multiline
            textAlignVertical="top"
            autoFocus={!activeNote.title}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Lista de notas ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EB" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
          <Text style={styles.headerTitle}>Notas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        contentContainerStyle={notes.length === 0 ? styles.emptyList : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.noteRow} onPress={() => openNote(item)} activeOpacity={0.6}>
            <View style={styles.noteIcon}>
              <MaterialCommunityIcons name="note-text-outline" size={20} color="#F5A623" />
            </View>
            <View style={styles.noteInfo}>
              <Text style={styles.noteRowTitle} numberOfLines={1}>
                {item.title || 'Nova Nota'}
              </Text>
              <View style={styles.noteRowMeta}>
                <Text style={styles.noteRowDate}>{formatDate(item.updatedAt)}</Text>
                <Text style={styles.noteRowPreview} numberOfLines={1}>
                  {'  '}{item.body || 'Sem texto adicional'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="note-outline" size={56} color="#C7C7CC" />
            <Text style={styles.emptyText}>Nenhuma nota</Text>
            <Text style={styles.emptySubtext}>Toque no lápis para adicionar uma nota</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.footerCount}>
          {notes.length} {notes.length === 1 ? 'Nota' : 'Notas'}
        </Text>
        <TouchableOpacity onPress={openNewNote} style={styles.composeBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="square-edit-outline" size={27} color="#F5A623" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0EB',
  },

  // Cabeçalho da lista
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },

  // Lista
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
  },
  noteIcon: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteRowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  noteRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteRowDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  noteRowPreview: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 66,
  },

  // Rodapé
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    backgroundColor: '#F2F0EB',
  },
  footerCount: {
    fontSize: 14,
    color: '#8E8E93',
    position: 'absolute',
  },
  composeBtn: {
    marginLeft: 'auto',
  },

  // Vazio
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 6,
  },

  // Editor
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F2F0EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 17,
    color: '#F5A623',
  },
  editBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginHorizontal: 20,
  },
  noteBody: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    padding: 20,
    lineHeight: 24,
  },
});
