import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';

// TFJS Imports
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

/**
 * KERAS 3 PATCH:
 * This fixes the "Unknown layer: InputLayer" error by registering the 
 * class name before the model starts loading.
 */
try {
  tf.serialization.registerClass(tf.layers.inputLayer({ inputShape: [224, 224, 3] }).constructor as any);
} catch (e) {
  // Ignore if already registered
}

export const initTensorFlow = async () => {
  await tf.ready();
  
  if (Platform.OS === 'web') {
    await tf.setBackend('webgl');
    console.log('TF backend: webgl');
  } else {
    // For Native, 'rn-webgl' is usually managed by the tfjs-react-native link
    console.log('TF backend: native');
  }
};

// Change type from GraphModel to LayersModel
let model: tf.LayersModel | null = null;

export const loadModel = async () => {
  if (model) return model;
  await initTensorFlow();

  try {
    if (Platform.OS === 'web') {
      console.log('Web: Executing Universal Keras 3 -> TFJS 4 Transition...');
      
      // 1. Get a mutable copy of the JSON
      const modelJson = JSON.parse(JSON.stringify(require('@/assets/tfjs_model/model.json')));

      /**
       * THE TOTAL SCRUB: 
       * Keras 3 attaches 'module' and 'registered_name' to every single sub-object 
       * (activations, initializers, etc.). We must delete them everywhere.
       */
      const scrub = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        // Delete Keras 3 specific keys that break the TFJS registry
        delete obj.module;
        delete obj.registered_name;

        // Fix InputLayer Requirement
        if (obj.class_name === 'InputLayer' && obj.config) {
          if (obj.config.batch_shape) {
            obj.config.batchInputShape = obj.config.batch_shape;
          }
        }

        // Fix DTypePolicy objects to simple strings
        if (obj.config?.dtype && typeof obj.config.dtype === 'object') {
          obj.config.dtype = obj.config.dtype.config?.name || 'float32';
        }

        // Recurse into everything
        Object.keys(obj).forEach(key => scrub(obj[key]));
      };

      // 2. Apply scrub to the topology and the training config
      scrub(modelJson.modelTopology);
      
      // 3. Spoof the version to force Keras 2 parsing logic
      if (modelJson.modelTopology) {
        modelJson.modelTopology.keras_version = '2.15.0';
        modelJson.modelTopology.backend = 'tensorflow';
      }

      model = await tf.loadLayersModel(tf.io.fromMemory(modelJson));
      
    } else {
      // 📱 MOBILE
      const modelJson = require('@/assets/tfjs_model/model.json');
      const modelWeights = require('@/assets/tfjs_model/group1-shard1of1.bin');
      model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
    }

    console.log('✅ SUCCESS: NomaApp Model is Live!');
    return model;
  } catch (error) {
    console.error("Critical Setup Error:", error);
    throw error;
  }
};

const NomaModel = () => {
  useEffect(() => {
    loadModel().catch(err => console.error("Model Component Load Error: ", err));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Engine: Initializing...</Text>
    </View>
  );
};

export default NomaModel;

const styles = StyleSheet.create({
  container: { padding: 20 },
  text: { fontSize: 14, color: '#333' }
});