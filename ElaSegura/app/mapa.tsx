import React, { useMemo, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import { getStyles } from '../styles/mapa.styles';


const MAPA_IMG = require('../assets/images/mapa.png');
const LEGENDA_IMG = require('../assets/images/legenda.png');

export default function MapaDemo() {
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);
  const scrollHorizontalRef = useRef<ScrollView>(null);
  const scrollVerticalRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
      
      const mapWidth = 1500; // Largura da imagem no seu styles
      const mapHeight = 1200; // Altura da imagem no seu styles

      const centerX = (mapWidth / 2) - (screenWidth / 2);
      const centerY = (mapHeight / 2) - (screenHeight / 2);

      scrollHorizontalRef.current?.scrollTo({ x: centerX, animated: false });
      scrollVerticalRef.current?.scrollTo({ y: centerY, animated: false });
    }, 100);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mapa de Risco</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Container Principal onde a mágica do 'Absolute' acontece */}
      <View style={styles.mapContainer}>
        
        {/* Mapa Navegável (Ordem Invertida para destravar o Android) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ flex: 1 }}
          ref={scrollHorizontalRef} // Adicione isso
        >
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={{ flex: 1 }}
            ref={scrollVerticalRef} // Adicione isso
          >
            <Image
              source={MAPA_IMG}
              style={styles.mapImage}
              resizeMode="cover"
            />
          </ScrollView>
        </ScrollView>

        {/* Legenda Fixa no Canto Inferior Direito */}
        <View style={styles.legendaContainer}>
          <Image
            source={LEGENDA_IMG}
            style={styles.legendaImage}
            resizeMode="contain"
          />
        </View>

      </View>
    </SafeAreaView>
  );
}
