import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
const index = () => {
  return (
    <View style={styles.container}>
      <Text>Home Page</Text>
      <Link href="/community">Community</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/marketplace">Market Place</Link>
      <Link href="/products">Products</Link>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    fontSize: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
})