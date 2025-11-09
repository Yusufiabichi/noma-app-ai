import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PostCard from './components/PostCard';

const PestDiseaseGuide: React.FC = () => {
  const guides = [
    {
      title: 'Identifying Maize Armyworm',
      description: 'Look for chewed leaves and caterpillars on maize shoots. Apply neem spray early.',
      image: require('../assets/pest1.jpg'),
    },
    {
      title: 'Tomato Blight Prevention',
      description: 'Avoid overhead watering and use copper-based fungicide at early signs.',
      image: require('../assets/pest2.webp'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Pest & Disease Guide</Text>
      {guides.map((item, index) => (
        <PostCard key={index} {...item} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF3E0', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#E65100', marginBottom: 20 },
});

export default PestDiseaseGuide;
