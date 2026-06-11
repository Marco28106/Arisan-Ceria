import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export default function RiwayatScreen() {
  const [tabAktif, setTabAktif] = useState("Semua"); // "Semua" | "BulanIni"
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);

  // ambil grup dulu, lalu join anggota yang sudahDapat == true
  const itemsByGroupIdRef = useRef({});
  useEffect(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      setRiwayat([]);
      setLoading(false);
      return;
    }

    const unsubsAnggota = [];
    let unsubGrup = null;

    const formatRupiah = (angka) => {
      if (!angka && angka !== 0) return "Rp 0";
      const nomor =
        typeof angka === "string"
          ? parseInt(angka.replace(/[^0-9]/g, ""), 10)
          : angka;
      const val = Number.isFinite(nomor) ? nomor : 0;
      return "Rp " + val.toLocaleString("id-ID");
    };

    const formatTanggal = (tanggalValue) => {
      try {
        if (!tanggalValue) return "-";
        if (typeof tanggalValue?.toDate === "function") {
          return tanggalValue.toDate().toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        }
        const d =
          tanggalValue instanceof Date ? tanggalValue : new Date(tanggalValue);
        if (Number.isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      } catch {
        return "-";
      }
    };

    const toInitials = (name) => {
      const parts = (name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
      const initials = parts
        .map((p) => p[0])
        .join("")
        .toUpperCase();
      return initials || "NA";
    };

    const parseTanggalForMonthKey = (tanggalValue) => {
      try {
        if (!tanggalValue) return "";
        if (typeof tanggalValue?.toDate === "function") {
          const d = tanggalValue.toDate();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0",
          )}`;
        }
        const d =
          tanggalValue instanceof Date ? tanggalValue : new Date(tanggalValue);
        if (Number.isNaN(d.getTime())) return "";
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0",
        )}`;
      } catch {
        return "";
      }
    };

    const rebuild = () => {
      const all = Object.values(itemsByGroupIdRef.current).flat();
      all.sort((a, b) => {
        const ad = a.tanggalRaw?.toDate
          ? a.tanggalRaw.toDate()
          : new Date(a.tanggalRaw);
        const bd = b.tanggalRaw?.toDate
          ? b.tanggalRaw.toDate()
          : new Date(b.tanggalRaw);
        const at = Number.isNaN(ad?.getTime?.()) ? 0 : ad.getTime();
        const bt = Number.isNaN(bd?.getTime?.()) ? 0 : bd.getTime();
        return bt - at;
      });
      setRiwayat(all);
    };

    setLoading(true);
    itemsByGroupIdRef.current = {};

    const groupQuery = query(
      collection(db, "grup"),
      where("ownerId", "==", uid),
    );
    unsubGrup = onSnapshot(groupQuery, (snapshot) => {
      const grupList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // unsubscribe listener anggota lama
      while (unsubsAnggota.length) {
        const u = unsubsAnggota.pop();
        try {
          u?.();
        } catch {}
      }

      if (!grupList.length) {
        itemsByGroupIdRef.current = {};
        setRiwayat([]);
        setLoading(false);
        return;
      }

      let pending = grupList.length;

      grupList.forEach((grup) => {
        const anggotaQ = query(
          collection(db, "grup", grup.id, "anggota"),
          where("sudahDapat", "==", true),
        );

        const unsub = onSnapshot(
          anggotaQ,
          (anggotaSnap) => {
            const nominalIuran = grup?.iuran || 0;

            const thisGrupItems = anggotaSnap.docs.map((docSnap) => {
              const data = docSnap.data() || {};
              const tanggalDapat = data.tanggalDapat;

              const base =
                typeof nominalIuran === "string"
                  ? parseInt(nominalIuran.replace(/[^0-9]/g, ""), 10) || 0
                  : nominalIuran || 0;

              return {
                id: `${grup.id}_${docSnap.id}`,
                grup: grup?.nama || "Tanpa Grup",
                pemenang: data.nama || "Tanpa Nama",
                avatar: data.avatar || "",
                initials: toInitials(data.nama),
                tanggalRaw: tanggalDapat,
                tanggal: formatTanggal(tanggalDapat),
                hadiah: formatRupiah(base),
                verified: true,
                monthKey: parseTanggalForMonthKey(tanggalDapat),
              };
            });

            itemsByGroupIdRef.current[grup.id] = thisGrupItems;
            rebuild();

            pending = Math.max(0, pending - 1);
            if (pending === 0) setLoading(false);
          },
          (err) => {
            console.error("Error mengambil anggota riwayat:", err);
            pending = Math.max(0, pending - 1);
            if (pending === 0) setLoading(false);
          },
        );

        unsubsAnggota.push(unsub);
      });
    });

    return () => {
      try {
        unsubGrup?.();
      } catch {}
      unsubsAnggota.forEach((u) => {
        try {
          u?.();
        } catch {}
      });
    };
  }, []);

  const riwayatTerfilter = useMemo(() => {
    if (tabAktif !== "BulanIni") return riwayat;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return riwayat.filter((x) => x.monthKey === monthKey);
  }, [riwayat, tabAktif]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.dateText}>{item.tanggal}</Text>
        <Ionicons name="checkmark-circle" size={18} color="#A04030" />
      </View>

      <Text style={styles.grupTitle}>{item.grup}</Text>

      <View style={styles.pemenangBox}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarPemenang} />
        ) : (
          <View style={styles.initialsAvatar}>
            <Text style={styles.initialsText}>{item.initials}</Text>
          </View>
        )}
        <Text style={styles.pemenangLabel}>
          Pemenang: <Text style={styles.pemenangName}>{item.pemenang}</Text>
        </Text>
      </View>

      <View style={styles.cardBottomRow}>
        <Text style={styles.totalHadiahLabel}>Total Hadiah</Text>
        <Text style={styles.totalHadiahValue}>{item.hadiah}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop",
            }}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerTitle}>Riwayat Arisan</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            tabAktif === "Semua" && styles.tabButtonActive,
          ]}
          onPress={() => setTabAktif("Semua")}
        >
          <Text
            style={[
              styles.tabText,
              tabAktif === "Semua" && styles.tabTextActive,
            ]}
          >
            Semua Grup
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            tabAktif === "BulanIni" && styles.tabButtonActive,
          ]}
          onPress={() => setTabAktif("BulanIni")}
        >
          <Text
            style={[
              styles.tabText,
              tabAktif === "BulanIni" && styles.tabTextActive,
            ]}
          >
            Bulan Ini
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#A04030" />
          <Text style={{ marginTop: 12, color: "#64748B" }}>
            Memuat riwayat...
          </Text>
        </View>
      ) : (
        <FlatList
          data={riwayatTerfilter}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 30 }}>
              <Ionicons name="gift-outline" size={48} color="#CBD5E1" />
              <Text
                style={{ marginTop: 10, color: "#94A3B8", textAlign: "center" }}
              >
                Belum ada pemenang arisan.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#9E3F2E" },
  bellButton: { padding: 4 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: { backgroundColor: "#A04030" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  tabTextActive: { color: "#FFF" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderHorizontalWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: { fontSize: 13, color: "#64748B" },
  grupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 12,
  },
  pemenangBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  avatarPemenang: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  initialsAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initialsText: { fontSize: 12, fontWeight: "bold", color: "#1E40AF" },
  pemenangLabel: { fontSize: 14, color: "#475569" },
  pemenangName: { fontWeight: "bold", color: "#0F172A" },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  totalHadiahLabel: { fontSize: 13, color: "#64748B" },
  totalHadiahValue: { fontSize: 18, fontWeight: "bold", color: "#A04030" },
});
