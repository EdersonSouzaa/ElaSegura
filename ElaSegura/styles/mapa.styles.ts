import { StyleSheet, Platform } from 'react-native';

export const getStyles = (isDarkMode: boolean, colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: isDarkMode ? colors.background : '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 10, // Copiado do seu home.styles.ts para manter o padrão
    paddingBottom: 20,
    backgroundColor: isDarkMode ? colors.cardBackground : '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: colors.text,
  },
  backButton: { 
    padding: 5 
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: isDarkMode ? '#1A1A1A' : '#E8EAED', 
  },
  scrollVertical: {
    flex: 1,
  },
  mapImage: {
    width: 1500, 
    height: 1200,
  },
  legendaContainer: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: isDarkMode ? colors.cardBackground : '#FFFFFF', 
    borderRadius: 12,
    padding: 15, 
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  legendaImage: {
    width: 130,   // Estava 90
    height: 170,  // Estava 110
  }
});