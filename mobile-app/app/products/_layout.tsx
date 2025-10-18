import { Text, View, StyleSheet } from 'react-native'
import { Slot } from 'expo-router'

export default function ProductsLayout(){
    return (
        <View style={styles.container}>
            <Slot/>
            <View style={styles.discounted}>
                <Text style={styles.discountedText}>Discounted products</Text>
            </View>
        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    discounted: {
        backgroundColor: "orange",
        padding: 20,
    },
    discountedText: {
        color: "white",
    },
    footer: {
        backgroundColor: "blue",
        padding: 20,
    },
    footerText: {
        color: "white",
    },

})