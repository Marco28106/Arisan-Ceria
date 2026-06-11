import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { UserContext } from "../context/UserContext";

function formatRupiah(angka) {
  if (!angka) return "Rp 0";
  const nomor =
    typeof angka === "string"
      ? parseInt(angka.replace(/[^0-9]/g, ""), 10)
      : angka;
  if (!nomor) return "Rp 0";
  return "Rp " + nomor.valueOf().toLocaleString("id-ID");
}

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [arisanGroups, setArisanGroups] = useState([]);
  const { displayName } = useContext(UserContext);

  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      setArisanGroups([]);
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
        setArisanGroups(grupDariFirebase);
        setLoading(false);
      },
      (error) => {
        console.error("Error mengambil grup:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  const arisanAktif = useMemo(() => {
    // Kamu belum punya field status "aktif"; pakai semua grup sebagai "aktif".
    return arisanGroups;
  }, [arisanGroups]);

  const GrupTeratas = arisanAktif[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.greetingText}>Halo, {displayName || ""}!</Text>
            <Text style={styles.appNameText}>Arisan Ceria</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => {}}>
          <Ionicons name="notifications-outline" size={24} color="#222" />
        </TouchableOpacity>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("TambahArisan")}
        >
          <Ionicons name="add-circle-outline" size={22} color="#A04030" />
          <Text style={styles.quickActionText}>Buat Grup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("Grup")}
        >
          <Ionicons name="people-outline" size={22} color="#A04030" />
          <Text style={styles.quickActionText}>Kelola Grup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => {
            if (!GrupTeratas?.id) return navigation.navigate("Grup");
            navigation.navigate("DetailArisan", { grupData: GrupTeratas });
          }}
        >
          <Ionicons name="dice-outline" size={22} color="#A04030" />
          <Text style={styles.quickActionText}>Kocok</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Ringkasan Arisan</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#A04030"
            style={{ marginTop: 20 }}
          />
        ) : arisanAktif.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
            <Text style={{ color: "#94A3B8", marginTop: 10 }}>
              Belum ada grup arisan.
            </Text>
            <TouchableOpacity
              style={styles.primaryCTA}
              onPress={() => navigation.navigate("TambahArisan")}
            >
              <Text style={styles.primaryCTAText}>Buat Grup Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {arisanAktif.slice(0, 4).map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate("DetailArisan", { grupData: item })
                }
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      Arisan #{idx + 1}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      Anggota: {item.anggota} • {formatRupiah(item.iuran)}
                    </Text>
                  </View>

                  <View style={[styles.badge, styles.badgeLunas]}>
                    <Text style={[styles.badgeText, styles.badgeTextLunas]}>
                      Aktif
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Ionicons name="calendar-outline" size={16} color="#444" />
                  <Text style={styles.cardFooterText}>
                    Jadwal Kocok: <Text style={styles.boldText}>Tgl 15</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.secondaryCTA}
              onPress={() => navigation.navigate("Grup")}
            >
              <Ionicons name="chevron-forward" size={16} color="#A04030" />
              <Text style={styles.secondaryCTAText}>Lihat semua grup</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* FAB: Tombol Tambah */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("TambahArisan")}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 0,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#DDD",
  },
  userInfo: { marginLeft: 12 },
  greetingText: { fontSize: 22, fontWeight: "bold", color: "#A04030" },
  appNameText: { fontSize: 14, color: "#666", marginTop: 2 },
  notificationButton: { padding: 4 },

  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#EAEBF0",
    alignItems: "center",
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#0C1A30",
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0C1A30",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEBF0",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#0C1A30" },
  cardSubtitle: { fontSize: 14, color: "#888", marginTop: 4 },

  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  badgeLunas: { backgroundColor: "#CBEFEE" },
  badgeText: { fontSize: 13, fontWeight: "bold" },
  badgeTextLunas: { color: "#2FA39B" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  cardFooterText: { marginLeft: 8, fontSize: 14, color: "#555" },
  boldText: { fontWeight: "bold", color: "#000" },

  primaryCTA: {
    marginTop: 16,
    backgroundColor: "#A04030",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryCTAText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },

  secondaryCTA: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEBF0",
    marginBottom: 10,
  },
  secondaryCTAText: {
    color: "#A04030",
    fontSize: 14,
    fontWeight: "800",
  },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#A04030",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
});
