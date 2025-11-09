import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Link } from 'expo-router'
const index = () => {
  return (
    <View style={styles.container}>
      <Text>Home Page</Text>
      <Link href="/community">Community</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/marketplace">Market Place</Link>
      <Link href="/products">Products</Link>
      <Link href="/products/best-sellers/playstation" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Playstation</Text>
        </Pressable>
      </Link>
      <Link href="/login">Login</Link>
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
  },
  button: {
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "white"
  },
})