// import React, { useState, useEffect, useRef } from 'react';
// import { Camera as ExpoCamera, Camera } from 'expo-camera';
// import * as ImagePicker from 'expo-image-picker';
// import { TouchableOpacity, Text, View } from 'react-native';

// export default function CropScan() {
//   const [hasPermission, setHasPermission] = useState<boolean | null>(null);
//   const cameraRef = useRef<Camera | null>(null);

//   useEffect(() => {
//     (async () => {
//       const { status } = await ExpoCamera.requestCameraPermissionsAsync();
//       setHasPermission(status === 'granted');
//     })();
//   }, []);

//   const takePicture = async () => {
//     if (cameraRef.current) {
//       const photo = await cameraRef.current.takePictureAsync();
//       console.log(photo.uri);
//     }
//   };

//   const pickImage = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.All,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 1,
//     });

//     if (!result.cancelled) {
//       console.log(result.uri);
//     }
//   };

//   if (hasPermission === null) {
//     return <View />;
//   }

//   return (
//     <View>
//       <ExpoCamera ref={cameraRef} type={ExpoCamera.Constants.Type.back}>
//         <TouchableOpacity onPress={takePicture}>
//           <Text>Take Picture</Text>
//         </TouchableOpacity>
//       </ExpoCamera>
//       <TouchableOpacity onPress={pickImage}>
//         <Text>Pick Image</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }


// const styles = StyleSheet.create({})

