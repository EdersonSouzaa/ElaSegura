import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MULHER_IMAGE = require('../assets/images/mulher.png');

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLogin = () => {
    // Navigate to home
    router.replace('/home');
  };

  const handleRecoverPassword = () => {
    // Logic for recovery (frontend only)
    if (newPassword === confirmNewPassword && newPassword !== '') {
      console.log('Senha alterada com sucesso');
      setIsModalVisible(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      console.log('Senhas não coincidem');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7D2F1" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={MULHER_IMAGE} style={styles.brandImage} resizeMode="contain" />
            <Text style={styles.brandTitle}>ElaSegura</Text>
            <Text style={styles.brandSubtitle}>Sua segurança é importante 💜</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#9C97AC" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#9C97AC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={24} color="#9C97AC" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#9C97AC"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#9C97AC" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.loginButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={styles.footerLink}>Registre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Recuperar Senha (Redefinição Direta) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redefinir Senha</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Digite sua nova senha abaixo para atualizar seu acesso.
            </Text>

            <View style={styles.modalInputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#9C97AC" style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Nova Senha"
                placeholderTextColor="#9C97AC"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <MaterialCommunityIcons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9C97AC" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputContainer}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9C97AC" style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Confirmar Nova Senha"
                placeholderTextColor="#9C97AC"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showNewPassword}
              />
            </View>

            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleRecoverPassword}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Redefinir Senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7D2F1',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF1493',
    marginBottom: 5,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  form: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#F35F74',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#F35F74',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#F35F74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#6A6A75',
    fontSize: 15,
  },
  footerLink: {
    color: '#F35F74',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 30,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalDescription: {
    fontSize: 15,
    color: '#6A6A75',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  modalButton: {
    backgroundColor: '#F35F74',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
