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
    bottom: 30,
    right: 20,
    backgroundColor: isDarkMode ? 'rgba(26, 26, 26, 0.85)' : 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 22, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
  legendaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendaItemInactive: {
    opacity: 0.4,
  },
  legendaColorBox: {
    width: 22,
    height: 22,
    borderRadius: 11, // Circular for a modern look
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  legendaItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  }
});