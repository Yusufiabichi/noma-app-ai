import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Welcome to NomaApp Mobile app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    backgroundColor: 'dodgerblue',
    flex: 1,
  }
})
