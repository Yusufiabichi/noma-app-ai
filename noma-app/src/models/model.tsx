import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';

// TFJS Imports
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';

// 1. REMOVED the metro-config code from here. That stays in metro.config.js!

export const initTensorFlow = async () => {
  await tf.ready();
  
  if (Platform.OS === 'web') {
    await tf.setBackend('webgl');
    console.log('TF backend: webgl');
  } else {
    await tf.setBackend('rn-webgl');
    console.log('TF backend: rn-webgl');
  }
};

let model: tf.GraphModel | null = null;

export const loadModel = async () => {
  if (model) return model;
  await initTensorFlow();

  try {
    if (Platform.OS === 'web') {
      console.log('Web: Loading Layers Model from public folder...');
      
      // ✅ FIX: Use loadLayersModel instead of loadGraphModel
      model = await tf.loadLayersModel('@/model/model.json');
      
    } else {
      // 📱 MOBILE
      const modelJson = require('@/assets/tfjs_model/model.json');
      const modelWeights = require('@/assets/tfjs_model/group1-shard1of1.bin');
      
      // ✅ FIX: Use loadLayersModel here as well
      model = await tf.loadLayersModel(
        bundleResourceIO(modelJson, modelWeights)
      );
    }

    console.log('✅ NomaApp LayersModel loaded successfully!');
    return model;
  } catch (error) {
    console.error("Setup Error:", error);
    throw error;
  }
};

const NomaModel = () => {
  useEffect(() => {
    loadModel().catch(err => console.error("Model Load Error: ", err));
  }, []);

  return (
    <View style={styles.container}>
      <Text>TensorFlow Model Status: Ready</Text>
    </View>
  );
};

export default NomaModel;

const styles = StyleSheet.create({
  container: { padding: 20 }
})