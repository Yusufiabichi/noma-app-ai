import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CommunityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>👩‍🌾 Welcome to the Community Page!</Text>
      <Text style={styles.text}>Share tips, ask questions, and connect with farmers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fff4' },
  text: { fontSize: 18, marginVertical: 8, color: '#2f6f31', textAlign: 'center' }
});
