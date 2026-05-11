import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Agent {
  id: string;
  name: string;
  title: string;
  region: string;
  availability: "online" | "offline";
  expertise: string;
  rating: number;
  responseTime: string;
  image?: any;
}

const agents: Agent[] = [
  {
    id: "1",
    name: "Dr. Amina Bello",
    title: "Senior Agronomist",
    region: "Northern Nigeria",
    availability: "online",
    expertise: "Crop nutrition, disease diagnosis, soil health",
    rating: 4.9,
    responseTime: "5 min",
    image: require("../../assets/6.jpg"),
  },
  {
    id: "2",
    name: "Mr. Ibrahim Musa",
    title: "Extension Agent",
    region: "Kano State",
    availability: "online",
    expertise: "Pest control, irrigation advice, field visits",
    rating: 4.7,
    responseTime: "8 min",
    image: require("../../assets/2.jpg"),
  },
  {
    id: "3",
    name: "Mrs. Zainab Abdullahi",
    title: "Crop Protection Specialist",
    region: "Kaduna",
    availability: "offline",
    expertise: "Fertilizer planning, resistant varieties, pest scouting",
    rating: 4.8,
    responseTime: "20 min",
    image: require("../../assets/avatar.jpg"),
  },
];

export default function CommunityForumScreen() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const renderHeader = () => (
    <>
      <View style={styles.pageHeader}>
        <Text style={styles.title}>Connect with a real agronomist</Text>
        <Text style={styles.subtitle}>
          The AI result confidence was low, so we’ve routed you to trusted
          experts for a clearer recommendation.
        </Text>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="alert-circle-outline" size={24} color="#1F6E8C" />
        <View style={styles.infoTextWrap}>
          <Text style={styles.infoTitle}>Low confidence detected</Text>
          <Text style={styles.infoDescription}>
            Chat with an agronomist or extension agent to verify the result and
            get practical next steps.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Available agents</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.agentCard}
            activeOpacity={0.92}
            onPress={() => setSelectedAgent(item)}
          >
            <View style={styles.agentAccent} />
            <View style={styles.agentRow}>
              <Image source={item.image} style={styles.agentAvatar} />
              <View style={styles.agentMeta}>
                <Text style={styles.agentName}>{item.name}</Text>
                <Text style={styles.agentTitle}>{item.title}</Text>
                <Text style={styles.agentRegion}>{item.region}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.availability === "online"
                    ? styles.statusActive
                    : styles.statusOffline,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    item.availability === "online"
                      ? styles.statusDotActive
                      : styles.statusDotOffline,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    item.availability === "online"
                      ? styles.statusTextActive
                      : styles.statusTextOffline,
                  ]}
                >
                  {item.availability === "online" ? "Active" : "Offline"}
                </Text>
              </View>
            </View>

            <View style={styles.agentInfoRow}>
              <View style={styles.agentInfoBlock}>
                <Text style={styles.infoLabel}>Expertise</Text>
                <Text style={styles.infoValue}>{item.expertise}</Text>
              </View>
              <View style={styles.agentInfoBlock}>
                <Text style={styles.infoLabel}>Response</Text>
                <Text style={styles.infoValue}>{item.responseTime}</Text>
              </View>
              <View style={styles.agentInfoBlock}>
                <Text style={styles.infoLabel}>Rating</Text>
                <Text style={styles.infoValue}>{item.rating.toFixed(1)} ★</Text>
              </View>
            </View>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={
                  item.availability === "online"
                    ? styles.primaryButton
                    : styles.secondaryButton
                }
                onPress={() => setSelectedAgent(item)}
              >
                <Text
                  style={
                    item.availability === "online"
                      ? styles.primaryButtonText
                      : styles.secondaryButtonText
                  }
                >
                  {item.availability === "online" ? "Start chat" : "Request callback"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selectedAgent} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAgent?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedAgent(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{selectedAgent?.title}</Text>
            <View style={styles.modalStatusRow}>
              <View
                style={[
                  styles.statusBadge,
                  selectedAgent?.availability === "online"
                    ? styles.statusActive
                    : styles.statusOffline,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    selectedAgent?.availability === "online"
                      ? styles.statusDotActive
                      : styles.statusDotOffline,
                  ]}
                />
                <Text
                  style={
                    selectedAgent?.availability === "online"
                      ? styles.statusTextActive
                      : styles.statusTextOffline
                  }
                >
                  {selectedAgent?.availability === "online" ? "Active now" : "Offline"}
                </Text>
              </View>
              <Text style={styles.modalResponse}>Avg reply {selectedAgent?.responseTime}</Text>
            </View>

            <Text style={styles.modalSectionTitle}>Why chat with this agent?</Text>
            <Text style={styles.modalBody}>
              This expert can verify unclear AI results, recommend the best next
              steps for your farm, and share practical advice on disease control,
              soil health, or fertilizer planning.
            </Text>

            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Connect now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setSelectedAgent(null)}
            >
              <Text style={styles.modalCancelText}>Choose another expert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF7F4",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pageHeader: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#16A34A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#475058",
    lineHeight: 22,
  },
  infoBanner: {
    backgroundColor: "#DFF3F0",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  infoTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#122C27",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: "#35645A",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#122C27",
    marginBottom: 16,
  },
  listHeader: {
    paddingBottom: 16,
  },
  listContent: {
    paddingBottom: 28,
  },
  agentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6EEEB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  agentAccent: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16A34A",
    marginBottom: 12,
  },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  agentAvatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    marginRight: 14,
  },
  agentMeta: {
    flex: 1,
  },
  agentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#122C27",
  },
  agentTitle: {
    fontSize: 12,
    color: "#556A67",
    marginTop: 2,
  },
  agentRegion: {
    fontSize: 11,
    color: "#7C8B88",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusActive: {
    backgroundColor: "#E5F8F1",
  },
  statusOffline: {
    backgroundColor: "#F3F3F5",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: "#17A663",
  },
  statusDotOffline: {
    backgroundColor: "#8A8D94",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextActive: {
    color: "#13775A",
  },
  statusTextOffline: {
    color: "#5A5B69",
  },
  agentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEF2F1",
    paddingTop: 14,
  },
  agentInfoBlock: {
    width: "30%",
  },
  infoLabel: {
    fontSize: 11,
    color: "#7F918E",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    color: "#183C35",
    lineHeight: 18,
  },
  cardActionRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 112,
    alignItems: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#C3C8CA",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButtonText: {
    color: "#4E5B5A",
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  modalHandle: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#122C27",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#556A67",
    marginBottom: 14,
  },
  modalStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalResponse: {
    fontSize: 13,
    color: "#5A6562",
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16322F",
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: "#4E5B5A",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: "#138A69",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalCancelButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  modalCancelText: {
    color: "#4E5B5A",
    fontSize: 14,
    fontWeight: "700",
  },
});
