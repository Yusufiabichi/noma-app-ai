import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

// Register backends
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-react-native';

import { Platform } from 'react-native';

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('bin');

module.exports = config;


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

let model: tf.GraphModel | null = null;

console.log(
  require('../assets/tfjs_model/group1-shard1of1.bin')
);


// export const loadModel = async () => {
//   if (model) return model;

//   await tf.ready();
//   // await tf.setBackend('cpu'); // safest on Android

//   const modelJson = Asset.fromModule(
//     require('../assets/tfjs_model/model.json')
//   );

//   const modelWeights = Asset.fromModule(
//     require('../assets/tfjs_model/group1-shard1of1.bin')
//   );

//   await Promise.all([
//     modelJson.downloadAsync(),
//     modelWeights.downloadAsync(),
//   ]);

//   model = await tf.loadGraphModel(
//     bundleResourceIO(modelJson, modelWeights)
//   );

//   console.log('✅ NomaApp GraphModel loaded');
//   return model;
// };



const nomaModel = () => {
  return (
    <View>
      <Text>model</Text>
    </View>
  )
}

export default nomaModel

const styles = StyleSheet.create({})