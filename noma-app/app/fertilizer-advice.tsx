import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PostCard from './components/PostCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const FertilizerAdvice: React.FC = () => {
  const posts = [
    {
      title: 'Best Fertilizer for Maize',
      description: 'Use NPK 15:15:15 during planting and urea at knee height for strong growth.',
      image: require('../assets/fertilizer1.jpg'),
    },
    {
      title: 'Organic Compost Benefits',
      description: 'Compost improves soil structure and helps retain water naturally.',
      image: require('../assets/fertilizer2.jpg'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Fertilizer Advice</Text>
        {posts.map((item, index) => (
          <PostCard key={index} {...item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9', padding: 16  },
  header: { fontSize: 22, fontWeight: 'bold', color: '#33691E', marginBottom: 20 },
});

export default FertilizerAdvice;
