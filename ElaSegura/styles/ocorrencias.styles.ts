import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7D2F1', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 70 : 80,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6A6A75',
    marginTop: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Espaço para não colar no fundo
  },
  occurrenceCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  occurrenceIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF0F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  occurrenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  occurrenceDescription: {
    fontSize: 13,
    color: '#6A6A75',
    marginTop: 2,
  },
  occurrenceTime: {
    fontSize: 11,
    color: '#9C97AC',
    marginTop: 6,
  },
  addButton: {
    backgroundColor: '#F35F74',
    marginHorizontal: 20,
    borderRadius: 25,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#F35F74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Novos Estilos
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  activeTab: {
    backgroundColor: '#F35F74',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C97AC',
  },
  activeTabText: {
    color: '#FFF',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  activeFilterChip: {
    backgroundColor: '#FDEEF1',
    borderColor: '#F35F74',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6A6A75',
  },
  activeFilterChipText: {
    color: '#F35F74',
    fontWeight: 'bold',
  },
  distanceBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F35F74',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#9C97AC',
    marginTop: 10,
  },
});