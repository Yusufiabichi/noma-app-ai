import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome, Feather, FontAwesome5 } from '@expo/vector-icons';

interface UserData {
  name: string;
  email: string;
  scans: number;
  healthy: number;
  issues: number;
}

const ProfileScreen: React.FC = () => {
  const user: UserData = {
    name: 'Yusufia Bichi',
    email: 'yusufia@cc.cc',
    scans: 24,
    healthy: 18,
    issues: 6,
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.scans}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.healthy}</Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.issues}</Text>
            <Text style={styles.statLabel}>Issues</Text>
          </View>
        </View>
      </View>

      {/* Premium Plan */}
      <View style={styles.premiumCard}>
        <View>
          <Text style={styles.premiumTitle}>Premium Plan</Text>
          <Text style={styles.premiumText}>Unlimited scans & advanced features</Text>
        </View>
        <FontAwesome5 name="crown" size={24} color="#fff" />
      </View>

      {/* Account Settings */}
      <TouchableOpacity style={styles.optionCard}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIconContainer}>
            <Feather name="user" size={20} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Account Settings</Text>
            <Text style={styles.optionSubtitle}>Manage your profile</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={22} color="#999" />
      </TouchableOpacity>

      {/* Notifications */}
      <TouchableOpacity style={styles.optionCard}>
        <View style={styles.optionLeft}>
          <View style={styles.optionIconContainer}>
            <Feather name="bell" size={20} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Notifications</Text>
            <Text style={styles.optionSubtitle}>Push notifications & alerts</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={22} color="#999" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginLeft: 10,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
  },
  premiumCard: {
    backgroundColor: '#16A34A',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumText: {
    color: '#fff',
    opacity: 0.9,
    fontSize: 13,
    marginTop: 2,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});

export default ProfileScreen;
