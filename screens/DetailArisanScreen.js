import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export default function DetailArisanScreen({ route, navigation }) {
  // Menangkap data grup yang diklik dari layar sebelumnya (GrupScreen)
  const { grupData } = route.params || {};
  const uid = auth?.currentUser?.uid;

  // State untuk menampung data anggota dari Firebase
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pembayaran"); // State untuk melacak tab aktif

  useEffect(() => {
    if (!grupData?.id) return;
    if (!uid) return;

    // Grup lama tanpa ownerId akan dianggap tidak valid (diabaikan)
    if (!grupData?.ownerId || grupData.ownerId !== uid) {
      Alert.alert("Akses Ditolak", "Grup ini bukan milik akun kamu.");
      navigation.goBack();
    }
  }, [grupData, uid, navigation]);

  // Mengambil sub-koleksi "anggota" secara real-time dari Firebase
  useEffect(() => {
    if (!grupData?.id) return;
    if (!uid) return;

    // Pastikan akses lolos sebelum ambil anggota
    if (!grupData?.ownerId || grupData.ownerId !== uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "grup", grupData.id, "anggota"),
      (snapshot) => {
        const dataAnggota = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.nama || "Tanpa Nama",
            nomorHp: data.nomorHp || "", // Mengambil data nomor HP dari Firebase
            status: data.sudahBayar ? "Lunas" : "Belum Bayar",
            sudahDapat: data.sudahDapat || false, // Menangkap status menang kocokan
            nominal: grupData.iuran || 0,
            info: data.info || "Bulan ini",
            avatar:
              data.avatar ||
              `https://ui-avatars.com/api/?name=${data.nama || "A"}&background=random`,
          };
        });

        setAnggota(dataAnggota);
        setLoading(false);
      },
      (error) => {
        console.error("Error mengambil data anggota:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [grupData, uid]);

  // Helper untuk mengubah angka iuran string/number menjadi format Rupiah bersih
  const formatRupiah = (angka) => {
    if (!angka) return "Rp 0";
    const nomor =
      typeof angka === "string"
        ? parseInt(angka.replace(/[^0-9]/g, ""), 10)
        : angka;
    return "Rp " + nomor.valueOf().toLocaleString("id-ID");
  };

  // KALKULATOR TOTAL DANA OTOMATIS
  const hitungTotalDana = () => {
    const jumlahLunas = anggota.filter(
      (item) => item.status === "Lunas",
    ).length;
    const nominalIuran =
      typeof grupData?.iuran === "string"
        ? parseInt(grupData.iuran.replace(/[^0-9]/g, ""), 10) || 0
        : grupData?.iuran || 0;

    return formatRupiah(jumlahLunas * nominalIuran);
  };

  // Fitur Pop-up Konfirmasi Kocok Arisan
  const konfirmasiKocok = () => {
    // FILTER: Hanya ambil anggota yang Lunas DAN Belum Pernah Menang
    const pesertaLunas = anggota.filter(
      (item) => item.status === "Lunas" && !item.sudahDapat,
    );

    if (pesertaLunas.length === 0) {
      Alert.alert(
        "Tidak Bisa Mengocok",
        "Semua anggota lunas sudah mendapatkan arisan, atau belum ada anggota lunas baru bulan ini.",
      );
      return;
    }

    Alert.alert(
      "Mulai Kocok Arisan?",
      `Ada ${pesertaLunas.length} anggota lunas yang siap diundi.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Kocok Sekarang!",
          onPress: () =>
            navigation.navigate("Kocok", {
              peserta: pesertaLunas,
              grupId: grupData.id,
            }),
        },
      ],
    );
  };

  // Fungsi Sekali Tap: Mengubah status pembayaran menjadi Lunas di Firebase
  const tandaiLunas = async (anggotaId) => {
    try {
      const anggotaRef = doc(db, "grup", grupData.id, "anggota", anggotaId);
      await updateDoc(anggotaRef, {
        sudahBayar: true,
        info: "Baru saja",
      });
    } catch (error) {
      console.error("Gagal update status:", error);
      Alert.alert("Error", "Gagal mengubah status pembayaran.");
    }
  };

  // Fitur Pengingat WhatsApp Sungguhan (Direct link ke chat pribadi)
  const handleIngatkan = (item) => {
    const nomorHP = item.nomorHp || "";

    if (!nomorHP) {
      Alert.alert(
        "Nomor Tidak Ditemukan",
        `Anggota bernama ${item.name} tidak memiliki data nomor WhatsApp.`,
      );
      return;
    }

    const pesan = `Halo ${item.name}, mau mengingatkan untuk iuran arisan bulan ini di grup *${grupData?.nama || "Arisan"}* sebesar *${formatRupiah(grupData?.iuran)}* yaa. Terima kasih! 🙏✨`;

    // URL Skema whatsapp://send (Utama) dan https://wa.me/ (Cadangan)
    const urlWhatsApp = `whatsapp://send?phone=${nomorHP}&text=${encodeURIComponent(pesan)}`;
    const urlBackup = `https://wa.me/${nomorHP}?text=${encodeURIComponent(pesan)}`;

    Alert.alert(
      "Kirim Pengingat",
      `Buka WhatsApp untuk mengingatkan ${item.name}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Kirim",
          onPress: async () => {
            try {
              const bisaBuka = await Linking.canOpenURL(urlWhatsApp);
              if (bisaBuka) {
                await Linking.openURL(urlWhatsApp);
              } else {
                await Linking.openURL(urlBackup);
              }
            } catch (error) {
              console.error("Gagal membuka WA:", error);
              Alert.alert("Gagal", "Tidak dapat membuka aplikasi WhatsApp.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* KEPALA HALAMAN */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {grupData?.nama || "Detail Arisan"}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KARTU UTAMA: TOTAL DANA & INFO */}
        <View style={styles.mainCard}>
          <View style={styles.cardRowTop}>
            <View>
              <Text style={styles.labelTotal}>Total Dana Terkumpul</Text>
              <Text style={styles.valueTotal}>{hitungTotalDana()}</Text>
            </View>
            <View style={styles.badgeAnggotaContainer}>
              <Ionicons name="people-outline" size={20} color="#2FA39B" />
              <Text style={styles.textAnggotaCount}>
                {anggota.length} Anggota
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRowBottom}>
            <View>
              <Text style={styles.subLabel}>
                {formatRupiah(grupData?.iuran)}
              </Text>
              <Text style={styles.subTitle}>Setoran/Bulan</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View>
              <Text style={styles.subLabel}>Tanggal 15</Text>
              <Text style={styles.subTitle}>Jadwal Kocok</Text>
            </View>
          </View>

          {/* TOMBOL EMAS: KOCOK PEMENANG */}
          <TouchableOpacity
            style={styles.kocokButton}
            activeOpacity={0.9}
            onPress={konfirmasiKocok}
          >
            <Ionicons
              name="dice-outline"
              size={20}
              color="#000"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.kocokButtonText}>Kocok Pemenang Bulan Ini</Text>
          </TouchableOpacity>
        </View>

        {/* TAB NAVIGATION KECIL */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "pembayaran" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("pembayaran")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pembayaran" && styles.tabTextActive,
              ]}
            >
              Status Pembayaran
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "pemenang" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("pemenang")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pemenang" && styles.tabTextActive,
              ]}
            >
              Pemenang
            </Text>
          </TouchableOpacity>
        </View>

        {/* DAFTAR ANGGOTA */}
        <View style={styles.headerDaftarAnggota}>
          <Text style={styles.sectionTitle}>
            {activeTab === "pembayaran"
              ? "Daftar Anggota Bulan Ini"
              : "Daftar Pemenang Arisan"}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#A04030"
            style={{ marginTop: 20 }}
          />
        ) : (
          anggota
            .filter((item) => {
              if (activeTab === "pemenang") {
                return item.sudahDapat === true;
              }
              return true;
            })
            .map((item) => (
              <View
                key={item.id}
                style={[
                  styles.memberCard,
                  activeTab === "pembayaran" &&
                    item.status === "Belum Bayar" &&
                    styles.memberCardBorderLeft,
                ]}
              >
                <View style={styles.memberLeftSection}>
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={styles.memberName}>{item.name}</Text>
                      {item.sudahDapat && activeTab === "pembayaran" && (
                        <View
                          style={{
                            backgroundColor: "#FEF3C7",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#D97706",
                              fontSize: 10,
                              fontWeight: "bold",
                            }}
                          >
                            🏆 Menang
                          </Text>
                        </View>
                      )}
                    </View>

                    {activeTab === "pembayaran" ? (
                      <View style={styles.statusRow}>
                        <Ionicons
                          name={
                            item.status === "Lunas"
                              ? "checkmark-circle"
                              : "time"
                          }
                          size={16}
                          color={
                            item.status === "Lunas" ? "#2E7D32" : "#C62828"
                          }
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                item.status === "Lunas" ? "#2E7D32" : "#C62828",
                            },
                          ]}
                        >
                          {" "}
                          {item.status}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.statusRow}>
                        <Ionicons name="trophy" size={16} color="#D4AF37" />
                        <Text
                          style={[
                            styles.statusText,
                            { color: "#D4AF37", fontWeight: "bold" },
                          ]}
                        >
                          {" "}
                          Sudah Menang Arisan
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* SISI KANAN KARTU */}
                {activeTab === "pembayaran" ? (
                  item.status === "Lunas" ? (
                    <View style={styles.memberRightSection}>
                      <Text style={styles.nominalText}>
                        {formatRupiah(item.nominal)}
                      </Text>
                      <Text style={styles.timeText}>{item.info}</Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.ingatkanButton,
                          { backgroundColor: "#E8F5E9" },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "Konfirmasi Bayar",
                            `Ubah status ${item.name} menjadi Lunas?`,
                            [
                              { text: "Batal", style: "cancel" },
                              {
                                text: "Ya, Lunas",
                                onPress: () => tandaiLunas(item.id),
                              },
                            ],
                          );
                        }}
                      >
                        <Text
                          style={{
                            color: "#2E7D32",
                            fontSize: 13,
                            fontWeight: "bold",
                          }}
                        >
                          Set Lunas
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.ingatkanButton}
                        activeOpacity={0.7}
                        onPress={() => handleIngatkan(item)}
                      >
                        <Ionicons
                          name="logo-whatsapp"
                          size={14}
                          color="#4A90E2"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.ingatkanText}>Ingatkan</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <View style={styles.memberRightSection}>
                    <Text style={[styles.nominalText, { color: "#2E7D32" }]}>
                      +{formatRupiah(item.nominal)}
                    </Text>
                    <Text style={styles.timeText}>Periode Berhasil</Text>
                  </View>
                )}
              </View>
            ))
        )}

        {/* Fallback Jika List Kosong */}
        {!loading &&
          activeTab === "pemenang" &&
          anggota.filter((i) => i.sudahDapat).length === 0 && (
            <View style={{ alignItems: "center", marginTop: 30 }}>
              <Ionicons name="gift-outline" size={48} color="#94A3B8" />
              <Text
                style={{
                  color: "#64748B",
                  marginTop: 8,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Belum ada pemenang di grup ini.{"\n"}Silakan lakukan kocokan
                pertama!
              </Text>
            </View>
          )}

        {!loading && activeTab === "pembayaran" && anggota.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text style={{ color: "#888" }}>
              Belum ada anggota di grup ini.
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("TambahAnggota", { grupId: grupData.id })
        }
      >
        <Ionicons name="person-add" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backButton: { padding: 4 },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0C1A30",
    textAlign: "center",
    marginHorizontal: 16,
  },
  moreButton: { padding: 4 },
  scrollContent: { padding: 20 },
  mainCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAEBF0",
    marginBottom: 24,
    elevation: 2,
  },
  cardRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelTotal: { fontSize: 14, color: "#666" },
  valueTotal: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#A04030",
    marginTop: 4,
  },
  badgeAnggotaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  textAnggotaCount: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "bold",
    color: "#0C1A30",
  },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 16 },
  cardRowBottom: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  subLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0C1A30",
    textAlign: "center",
  },
  subTitle: { fontSize: 13, color: "#666", marginTop: 4, textAlign: "center" },
  verticalDivider: { width: 1, height: 35, backgroundColor: "#EEE" },
  kocokButton: {
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  kocokButtonText: { fontSize: 16, fontWeight: "bold", color: "#000" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#EEEFF4",
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "#FFF" },
  tabText: { fontSize: 15, color: "#666", fontWeight: "500" },
  tabTextActive: { color: "#A04030", fontWeight: "bold" },
  headerDaftarAnggota: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEBF0",
  },
  memberCardBorderLeft: { borderLeftWidth: 4, borderLeftColor: "#A04030" },
  memberLeftSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEE",
  },
  memberInfo: { marginLeft: 12, flex: 1 },
  memberName: { fontSize: 16, fontWeight: "bold", color: "#0C1A30" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  statusText: { fontSize: 13, fontWeight: "500" },
  memberRightSection: { alignItems: "flex-end" },
  nominalText: { fontSize: 14, fontWeight: "bold", color: "#000" },
  timeText: { fontSize: 11, color: "#888", marginTop: 4 },
  ingatkanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0FA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ingatkanText: { color: "#4A90E2", fontSize: 13, fontWeight: "bold" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#A04030",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#A04030",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
