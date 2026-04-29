import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';

export default function About() {
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];

  const FeatureRow = ({ icon, text }: { icon: any, text: string }) => (
    <View style={styles.featureRow}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-sun-outline" size={60} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>ElaSegura</Text>
          <Text style={[styles.tagline, { color: colors.secondary }]}>Proteção e Liberdade</Text>
        </View>

        <View style={styles.body}>
          <Text style={[styles.missionTitle, { color: colors.primary }]}>Nossa Missão</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            O ElaSegura nasceu para transformar a tecnologia em uma aliada da segurança feminina. 
            Acreditamos que toda mulher tem o direito de transitar com confiança e paz de espírito.
          </Text>

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>O que oferecemos</Text>
          <View style={styles.featuresContainer}>
            <FeatureRow icon="shield-check-outline" text="Monitoramento de rotas seguro" />
            <FeatureRow icon="bell-ring-outline" text="Alertas de áreas de risco" />
            <FeatureRow icon="account-group-outline" text="Rede de apoio instantânea" />
            <FeatureRow icon="heart-pulse" text="Assistência em situações críticas" />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.secondary }]}>Versão 1.0.0</Text>
          <Text style={[styles.madeWith, { color: colors.secondary }]}>Desenvolvido com carinho para você.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(243, 95, 116, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  body: {
    marginBottom: 40,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(156, 151, 172, 0.2)',
    marginVertical: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  version: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  madeWith: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});
