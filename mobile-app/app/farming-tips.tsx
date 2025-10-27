import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PostCard from './components/PostCard';

const FarmingTips: React.FC = () => {
  const tips = [
    {
      title: 'Soil Testing Before Planting',
      description: 'Check soil pH and nutrient levels to determine the best crops to plant.',
      image: require('../assets/tips1.jpg'),
    },
    {
      title: 'Smart Watering Techniques',
      description: 'Use drip irrigation to save water and ensure consistent soil moisture.',
      image: require('../assets/tips2.jpg'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Farming Tips</Text>
      {tips.map((item, index) => (
        <PostCard key={index} {...item} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#0D47A1', marginBottom: 20 },
});

export default FarmingTips;
