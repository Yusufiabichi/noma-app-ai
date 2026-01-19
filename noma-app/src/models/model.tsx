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
    // 1. Get the JSON. In React Native, 'require' returns the object directly.
    // We deep-clone it so we can safely mutate it.
    let modelJson = JSON.parse(JSON.stringify(require('@/assets/tfjs_model/model.json')));

    /**
     * THE KERAS 3 -> TFJS BRIDGE SCRUB
     */
    const scrub = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      // FIX 1: Layer Class Mapping (The "Conv2D" fix)
      // FIX 1: Enhanced Layer Class Mapping
      const layerMap: { [key: string]: string } = {
        'Conv2D': 'Conv2D',      // Try keeping uppercase first, if fails change to 'conv2d'
        'Dense': 'Dense',
        'Flatten': 'Flatten',
        'MaxPooling2D': 'MaxPooling2D',
        'Dropout': 'Dropout',
        'BatchNormalization': 'BatchNormalization',
        'InputLayer': 'InputLayer', // TFJS standard is often Capitalized for this specific layer
        'Functional': 'Model'
      };

      // Check if capitalization is the issue
      if (obj.class_name === 'inputLayer') {
        obj.class_name = 'InputLayer'; 
      } else if (obj.class_name && layerMap[obj.class_name]) {
        obj.class_name = layerMap[obj.class_name];
      }

      // FIX 2: Keras 3 Registry Metadata
      // Delete keys that break the TFJS layer registry
      delete obj.module;
      delete obj.registered_name;

      // FIX 3: InputLayer batch_shape -> batchInputShape
      // FIX 3: Robust InputLayer handling
      if (obj.class_name?.toLowerCase() === 'inputlayer' && obj.config) {
        obj.class_name = 'InputLayer'; // Standardize to Capitalized
        if (obj.config.batch_shape) {
          obj.config.batchInputShape = obj.config.batch_shape;
        }
      }

      // FIX 4: DType Policy objects
      if (obj.config?.dtype && typeof obj.config.dtype === 'object') {
        obj.config.dtype = obj.config.dtype.config?.name || 'float32';
      }

      // Recurse into all properties
      Object.keys(obj).forEach(key => scrub(obj[key]));
    };

    // Apply the scrub to the entire topology
    scrub(modelJson.modelTopology);

    // Spoof metadata to force Keras 2 legacy parsing logic inside TFJS
    if (modelJson.modelTopology) {
      modelJson.modelTopology.keras_version = '2.15.0';
      modelJson.modelTopology.backend = 'tensorflow';
    }

    if (Platform.OS === 'web') {
      console.log('Web: Loading scrubbed Keras 3 model...');
      model = await tf.loadLayersModel(tf.io.fromMemory(modelJson));
    } else {
      // 📱 MOBILE: React Native bundleResourceIO
      console.log('Mobile: Loading scrubbed Keras 3 model via bundleResourceIO...');
      const modelWeights = require('@/assets/tfjs_model/group1-shard1of1.bin');
      
      // bundleResourceIO expects (JSON Object, Weight Shard(s))
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