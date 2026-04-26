import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SuccessPopupProps {
  visible: boolean;
  /** Função chamada quando o usuário clica em "Continuar" */
  onContinue: () => void;
}

export const SuccessPopup = ({ visible, onContinue }: SuccessPopupProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="check-circle" size={70} color="#F35F74" />
          </View>
          <Text style={styles.title}>Sucesso!</Text>
          <Text style={styles.message}>Conta cadastrada com sucesso!</Text>
          
          <TouchableOpacity style={styles.button} onPress={onContinue} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fundo escuro semi-transparente
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    paddingVertical: 35,
    paddingHorizontal: 25,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: '#FFF0F2',
    padding: 15,
    borderRadius: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: '#6A6A75',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#F35F74',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
