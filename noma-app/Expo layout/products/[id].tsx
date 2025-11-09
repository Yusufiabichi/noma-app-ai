import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

const ProductDetail = () => {
    const {id} = useLocalSearchParams();
    console.log(typeof id);
    const numericId = parseInt(id as string, 10);
    console.log(typeof numericId)
  return (
    <View style={styles.container}>
      <Text>Details about Product with id {id}</Text>
    </View>
  )
}

export default ProductDetail

const styles = StyleSheet.create({
  container: {
    fontSize: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
})