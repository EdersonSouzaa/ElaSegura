import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getStyles } from '../styles/perfil.styles';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function Perfil() {
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);

  const [userData, setUserData] = useState({ name: '', email: '', profile_picture: null as string | null });
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const savedToken = await AsyncStorage.getItem('userToken');
        if (savedToken) setToken(savedToken);

        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          setUserData({ name: userObj.name, email: userObj.email, profile_picture: userObj.profile_picture || null });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    loadUserData();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setUserData({ ...userData, profile_picture: base64Image });
      
      try {
        await api.put('/user/profile-picture', { profile_picture: base64Image }, token);
        
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          userObj.profile_picture = base64Image;
          await AsyncStorage.setItem('user', JSON.stringify(userObj));
        }
        Alert.alert('Sucesso', 'Foto de perfil atualizada!');
      } catch (error) {
        console.error('Erro ao salvar foto:', error);
        Alert.alert('Erro', 'Não foi possível atualizar a foto.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarBox} activeOpacity={0.8}>
              {userData.profile_picture ? (
                <Image source={{ uri: userData.profile_picture }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              ) : (
                <MaterialIcons name="person" size={50} color="#FFF" />
              )}
            </TouchableOpacity>
            <Text style={styles.userName}>{userData.name || 'Usuária'}</Text>
            <Text style={styles.userEmail}>{userData.email || 'carregando...'}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informações do Perfil</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput 
              style={styles.input}
              placeholder="Digite seu nome..."
              placeholderTextColor={colors.secondary}
              value={userData.name}
              onChangeText={(text) => setUserData({...userData, name: text})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input}
              placeholder="Digite seu e-mail..."
              placeholderTextColor={colors.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={userData.email}
              onChangeText={(text) => setUserData({...userData, email: text})}
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.8}
            disabled={isSaving}
            onPress={async () => {
              if (!userData.name.trim() || !userData.email.trim()) {
                Alert.alert('Aviso', 'Nome e e-mail são obrigatórios.');
                return;
              }
              setIsSaving(true);
              try {
                const updated = await api.put('/user/update', { name: userData.name.trim(), email: userData.email.trim() }, token);
                const savedUser = await AsyncStorage.getItem('user');
                if (savedUser) {
                  const userObj = JSON.parse(savedUser);
                  await AsyncStorage.setItem('user', JSON.stringify({ ...userObj, name: updated.name, email: updated.email }));
                }
                Alert.alert('Sucesso', 'Perfil atualizado!');
              } catch (error: any) {
                Alert.alert('Erro', error.message || 'Não foi possível salvar as alterações.');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.7}
            onPress={async () => {
              await AsyncStorage.multiRemove(['userToken', 'user']);
              router.replace('/login');
            }}
          >
            <MaterialCommunityIcons name="logout" size={24} color={colors.primary} />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
        
        {/* Espaçador para a barra de navegação não cobrir o final da tela */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}