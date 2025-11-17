import { Slot, Tabs } from 'expo-router'
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'
import { Pressable, Text, View, Modal, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState } from 'react'
import { LanguageProvider, useLanguage, Lang } from '../context/LanguageContext';
import {Picker} from '@react-native-picker/picker';


function HeaderLanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const langs: Lang[] = ['english', 'hausa', 'yoruba', 'igbo'];

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.headerButton}>
        <Text style={styles.headerButtonText}>{language.toUpperCase()}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select language</Text>
            <FlatList
              data={langs}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setLanguage(item);
                    setOpen(false);
                  }}
                  style={styles.langRow}
                >
                  <Text style={[styles.langText, item === language && styles.selectedLang]}>
                    {item.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
            />
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeRow}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}




export default function TabsLayout() {
  return (
    <>
    <LanguageProvider initial="english">
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '500',
        },
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          elevation: 10,
          height: 65,
          paddingBottom: 4,
          paddingTop: 8,
          marginBottom: 15,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'NomaApp AI',
          tabBarLabel: 'Crops',
          tabBarIcon: ({ color }) => <FontAwesome5 name="seedling" size={22} color={color} />,
          headerRight: () => (
                <SafeAreaView style={{ flex: 1 }}>
                  <View style={styles.headerBar}>
                    <FontAwesome5 name="globe" size={28} color="#16A34A" />
                    <HeaderLanguageSelector />
                  </View>
                </SafeAreaView>
          ),
        }}
      />
      {/* <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color }) => <FontAwesome name="camera" size={22} color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarLabel: 'Community',
          tabBarIcon: ({ color }) => <MaterialIcons name="forum" size={22} color={color} />,
          
        }}
      />
        {/* <Tabs.Screen
          name="marketplace"
          options={{
            title: 'Market Place',
            tabBarLabel: 'Market Place',
            tabBarIcon: ({ color }) => <FontAwesome5 name="market" size={22} color={color} />,
          }}
        /> */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
    </LanguageProvider>
    </>

  )
}


const styles = StyleSheet.create({
  headerBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    // borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerButton: { padding: 8 },
  headerButtonText: { fontSize: 14, fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalCard: { backgroundColor: 'white', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '50%' },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  langRow: { paddingVertical: 12 },
  langText: { fontSize: 16 },
  selectedLang: { color: '#1a73e8', fontWeight: '700' },
  closeRow: { marginTop: 8, alignItems: 'center', padding: 12 },
  closeText: { color: '#666' },
});

