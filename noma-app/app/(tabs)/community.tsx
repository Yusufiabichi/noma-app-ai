import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Post {
  id: string;
  name: string;
  role: string;
  time: string;
  title: string;
  description: string;
  likes: number;
  comments: number;
  type: "question" | "discussion";
  image?: any;
}

const posts: Post[] = [
  {
    id: "1",
    name: "Mahadi Yusuf",
    role: "Farmer",
    time: "2 hours ago",
    title: "Help! My tomato leaves are turning yellow",
    description:
      "I noticed my tomato plants have yellow leaves starting from the bottom...",
    likes: 12,
    comments: 8,
    type: "question",
    image: require("../../assets/6.jpg"),
  },
  {
    id: "2",
    name: "Aliyu Ishaq",
    role: "Expert",
    time: "4 hours ago",
    title: "Best organic pest control methods for corn",
    description:
      "I want to share some effective organic methods I have been using...",
    likes: 24,
    comments: 15,
    type: "discussion",
  },
  {
    id: "3",
    name: "Mariyatu Hayatu",
    role: "Farmer",
    time: "6 hours ago",
    title: "When is the best time to harvest wheat?",
    description:
      "My wheat crop is approaching maturity and I want to make sure...",
    likes: 18,
    comments: 12,
    type: "question",
    image: require("../../assets/2.jpg"),
  },
];

export default function CommunityForumScreen() {
  const [activeTab, setActiveTab] = useState<"All Posts" | "Questions" | "Discussions">("All Posts");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const filteredPosts =
    activeTab === "All Posts"
      ? posts
      : posts.filter((post) => post.type === activeTab.toLowerCase());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Ionicons name="arrow-back" size={22} color="#000" />
        <Text style={styles.headerTitle}>Community Forum</Text>
        <Ionicons name="add" size={24} color="#000" />
      </View> */}

      {/* Tabs */}
      <View style={styles.tabs}>
        {["All Posts", "Questions", "Discussions"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as typeof activeTab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      {/* <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>127</Text>
          <Text style={styles.statLabel}>Total Posts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>89</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>38</Text>
          <Text style={styles.statLabel}>Discussions</Text>
        </View>
      </View> */}

      {/* Posts */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("../../assets/avatar.jpg")}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.role}>
                  {item.role} • {item.time}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>

            {item.image && (
              <Image source={item.image} style={styles.postImage} />
            )}

            <View style={styles.footer}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Text>❤️ {item.likes}</Text>
                <Text>💬 {item.comments}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor:
                        item.type === "question" ? "#FFE7C2" : "#E6D9FF",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        item.type === "question" ? "#E6A047" : "#7B5DD6",
                      fontSize: 12,
                    }}
                  >
                    {item.type}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPost(item)}>
                  <Text style={styles.viewPost}>View Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating + Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={!!selectedPost} animationType="slide" transparent>
        {selectedPost && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Forum Post</Text>
                  <TouchableOpacity onPress={() => setSelectedPost(null)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <Image
                    source={require("../../assets/avatar.jpg")}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={styles.name}>{selectedPost.name}</Text>
                    <Text style={styles.role}>
                      {selectedPost.role} • {selectedPost.time}
                    </Text>
                  </View>
                </View>

                <Text style={styles.title}>{selectedPost.title}</Text>
                <Text style={styles.desc}>
                  My wheat crop is approaching maturity and I want to make sure
                  I harvest at the optimal time. What signs should I look for to
                  determine the perfect harvest timing?
                </Text>

                {selectedPost.image && (
                  <Image
                    source={selectedPost.image}
                    style={[styles.postImage, { marginTop: 10 }]}
                  />
                )}

                <Text style={styles.recentReplies}>Recent Replies</Text>
                <View style={styles.replyBox}>
                  <Text style={styles.replyName}>
                    Dr. Amanda Foster <Text style={styles.expertTag}>Expert</Text>
                  </Text>
                  <Text style={styles.replyTime}>5 hours ago</Text>
                  <Text style={styles.replyText}>
                    Look for the grain moisture content to be around 13–15%.
                    Wheat heads should be golden and grains firm when pressed
                    with a fingernail.
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.replyButton}>
                    <Text style={{ color: "#fff" }}>Reply to Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareButton}>
                    <Text>Share Post</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5FBF7", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "600" },
  tabs: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#E5E5E5" },
  activeTab: { backgroundColor: "#00A86B" },
  tabText: { color: "#000", fontWeight: "500" },
  activeTabText: { color: "#fff" },
  stats: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  statBox: { backgroundColor: "#fff", padding: 15, borderRadius: 12, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#555" },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  name: { fontWeight: "600", fontSize: 15 },
  role: { color: "#666" },
  title: { fontWeight: "700", marginTop: 5 },
  desc: { color: "#555", marginVertical: 5 },
  postImage: { width: "100%", height: 180, borderRadius: 12, marginVertical: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { borderRadius: 12, paddingVertical: 2, paddingHorizontal: 8, marginRight: 10 },
  viewPost: { color: "#16A34A", fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#16A34A",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center" },
  modalContent: { backgroundColor: "#fff", margin: 20, borderRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  recentReplies: { marginTop: 20, fontWeight: "700", fontSize: 16 },
  replyBox: { backgroundColor: "#F7F7F7", borderRadius: 12, padding: 12, marginTop: 10 },
  replyName: { fontWeight: "600" },
  expertTag: { color: "#7B5DD6", fontSize: 12 },
  replyTime: { color: "#888", fontSize: 12 },
  replyText: { marginTop: 5, color: "#333" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  replyButton: { backgroundColor: "#16A34A", padding: 12, borderRadius: 10, width: "48%", alignItems: "center" },
  shareButton: { borderColor: "#ccc", borderWidth: 1, padding: 12, borderRadius: 10, width: "48%", alignItems: "center" },
});
