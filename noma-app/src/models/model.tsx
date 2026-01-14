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
      console.log('Web: Applying Universal Keras 3 Metadata Strip...');
      
      // 1. Get a fresh, mutable copy of the JSON
      const modelJson = JSON.parse(JSON.stringify(require('@/assets/tfjs_model/model.json')));

      // 2. Identify where the layers live (Sequential vs Functional)
      const modelConfig = modelJson.modelTopology?.model_config;
      const layers = modelConfig?.config?.layers || modelConfig?.layers;

      if (Array.isArray(layers)) {
        layers.forEach((layer: any) => {
          // Remove the keys that confuse TFJS's registry
          delete layer.module;
          delete layer.registered_name;

          if (layer.config) {
            delete layer.config.module;
            delete layer.config.registered_name;

            // Fix InputLayer Shape
            if (layer.class_name === 'InputLayer' && layer.config.batch_shape) {
              layer.config.batchInputShape = layer.config.batch_shape;
            }

            // Fix Keras 3 DTypePolicy objects (convert to string)
            if (typeof layer.config.dtype === 'object') {
              layer.config.dtype = layer.config.dtype.config?.name || 'float32';
            }
          }
        });
      }

      // 3. Load the patched model
      model = await tf.loadLayersModel(tf.io.fromMemory(modelJson));
      
    } else {
      // 📱 MOBILE
      const modelJson = require('@/assets/tfjs_model/model.json');
      const modelWeights = require('@/assets/tfjs_model/group1-shard1of1.bin');
      model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
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