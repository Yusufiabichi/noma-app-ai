import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

import * as tf from '@tensorflow/tfjs';

// Register backends
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-react-native';

import { Platform } from 'react-native';

export const initTensorFlow = async () => {
  await tf.ready();

  if (typeof window === 'undefined') {
    await tf.setBackend('cpu');
    console.log('TF backend: cpu (node)');
    return;
  }

  // 🌐 Browser
  if (Platform.OS === 'web') {
    await tf.setBackend('webgl');
    console.log('TF backend: webgl');
    return;
  }

  // 📱 Android / iOS
  await tf.setBackend('rn-webgl');
  console.log('TF backend: rn-webgl');
};

initTensorFlow();



const model = () => {
  return (
    <View>
      <Text>model</Text>
    </View>
  )
}

export default model

const styles = StyleSheet.create({})