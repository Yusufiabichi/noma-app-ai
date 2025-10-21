import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'

export default function register() {
  return (
    <View style={styles.container}>
      <Text>register</Text>
            <Link href="./login">Login</Link>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
})