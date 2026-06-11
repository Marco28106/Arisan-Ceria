import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, StatusBar, TextInput, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export default function GrupScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [dataGrup, setDataGrup] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth?.currentUser?.uid;

    if (!uid) {
      setLoading(false);
      setDataGrup([]);
      return;
    }

    setLoading(true);

    const q = query(collection(db, "grup"), where("ownerId", "==", uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const grupDariFirebase = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDataGrup(grupDariFirebase);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [auth?.currentUser?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const grupTerfilter = dataGrup.filter((grup) => {
    if (!grup.nama) return false;
    return grup.nama.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate("DetailArisan", { grupData: item })}>
      <View style={styles.cardIcon}>
        <Ionicons name="people" size={24} color="#A04030" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.grupName}>{item.nama}</Text>
        <Text style={styles.grupDetails}>{item.anggota} Anggota • {item.iuran}</Text>
      </View>
      <View style={styles.arrowBtn}>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grup Arisan Saya</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Cari nama grup..." placeholderTextColor="#94A3B8" value={searchQuery} onChangeText={setSearchQuery} />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A04030" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <FlatList data={grupTerfilter} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#A04030"]} />} ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="folder-open-outline" size={48} color="#CBD5E1" /><Text style={styles.emptyText}>Belum ada grup arisan.</Text></View>} />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => navigation.navigate("TambahArisan")}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  header: { height: 56, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", margin: 20, paddingHorizontal: 16, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center", marginRight: 14 },
  cardInfo: { flex: 1 },
  grupName: { fontSize: 16, fontWeight: "bold", color: "#0F172A", marginBottom: 4 },
  grupDetails: { fontSize: 13, color: "#64748B" },
  arrowBtn: { padding: 4 },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#94A3B8", marginTop: 10, fontSize: 15 },
  fab: { position: "absolute", bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: "#A04030", justifyContent: "center", alignItems: "center", shadowColor: "#A04030", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});