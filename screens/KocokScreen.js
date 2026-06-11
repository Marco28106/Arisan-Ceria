import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 1. IMPORT FIREBASE
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function KocokScreen({ route, navigation }) {
  // 2. Tangkap juga grupId dari layar sebelumnya
  const { peserta, grupId } = route.params || {};

  const [sedangMengocok, setSedangMengocok] = useState(false);
  const [pemenang, setPemenang] = useState(null);

  const goyangAnim = useRef(new Animated.Value(0)).current;
  const skalaAnim = useRef(new Animated.Value(0)).current;

  // 3. FUNGSI MENYIMPAN PEMENANG KE FIREBASE
  const simpanPemenangKeDatabase = async (pemenangTerpilih) => {
    if (!grupId || !pemenangTerpilih.id) return;

    try {
      const anggotaRef = doc(
        db,
        "grup",
        grupId,
        "anggota",
        pemenangTerpilih.id,
      );
      await updateDoc(anggotaRef, {
        sudahDapat: true, // Menandai bahwa dia sudah dapat arisan
        tanggalDapat: new Date().toISOString(), // Opsional: mencatat tanggal menang
      });
      console.log("Pemenang berhasil dicatat di database!");
    } catch (error) {
      console.error("Error menyimpan pemenang:", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan data pemenang.");
    }
  };

  const mulaiKocokArisan = () => {
    setSedangMengocok(true);
    setPemenang(null);
    skalaAnim.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(goyangAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(goyangAnim, {
          toValue: -1,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(goyangAnim, {
          toValue: 0,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    setTimeout(() => {
      const kandidat =
        peserta && peserta.length > 0
          ? peserta
          : [{ name: "Belum ada anggota lunas", id: null }];
      const hasilAcak = kandidat[Math.floor(Math.random() * kandidat.length)];

      setSedangMengocok(false);
      setPemenang(hasilAcak);
      goyangAnim.stopAnimation();

      Animated.spring(skalaAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();

      // 4. JALANKAN FUNGSI SIMPAN SETELAH ANIMASI MUNCUL
      if (hasilAcak.id) {
        simpanPemenangKeDatabase(hasilAcak);
      }
    }, 3000);
  };

  const rotasiGoyang = goyangAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-15deg", "15deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#A04030" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Arisan Ceria</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#A04030" />
        </TouchableOpacity>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.mainTitle}>Saatnya{"\n"}Mengocok!</Text>
        <Text style={styles.subTitle}>Siapa yang akan beruntung hari ini?</Text>
      </View>

      <View style={styles.lotteryBox}>
        {sedangMengocok ? (
          <View style={styles.centerContent}>
            <Animated.View
              style={[
                styles.bowlCircleDecoration,
                { transform: [{ rotate: rotasiGoyang }] },
              ]}
            >
              <Ionicons name="dice" size={60} color="#D4AF37" />
            </Animated.View>
            <Text style={styles.animationTextAnim}>
              Mengaduk keberuntungan...
            </Text>
          </View>
        ) : pemenang ? (
          <Animated.View
            style={[
              styles.centerContent,
              { transform: [{ scale: skalaAnim }] },
            ]}
          >
            <View
              style={[
                styles.bowlCircleDecoration,
                { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
              ]}
            >
              <Ionicons name="trophy" size={60} color="#F59E0B" />
            </View>
            <Text style={styles.congratsText}>Selamat Kepada!</Text>
            <Text style={styles.winnerName}>{pemenang.name}</Text>
          </Animated.View>
        ) : (
          <View style={styles.centerContent}>
            <View style={styles.bowlCircleDecoration}>
              <Ionicons name="gift" size={60} color="#D4AF37" />
            </View>
            <Text style={styles.animationText}>Siap dikocok?</Text>
            <Text style={styles.animationSubText}>Tekan tombol di bawah</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            sedangMengocok && styles.buttonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={mulaiKocokArisan}
          disabled={sedangMengocok}
        >
          <Ionicons
            name={sedangMengocok ? "sync-outline" : "sparkles-outline"}
            size={20}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryButtonText}>
            {sedangMengocok ? "Sedang Mengocok..." : "Kocok Arisan Sekarang"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Gunakan Stylesheet Anda yang sama persis dari sebelumnya, tidak ada yang berubah di sini)
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
  },
  backButton: { padding: 4 },
  navTitle: { fontSize: 20, fontWeight: "bold", color: "#A04030" },
  notificationButton: { padding: 4 },
  textContainer: { alignItems: "center", marginTop: 30, marginBottom: 25 },
  mainTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#A04030",
    textAlign: "center",
    lineHeight: 44,
  },
  subTitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
  },
  lotteryBox: {
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#D4AF37",
    borderRadius: 24,
    marginHorizontal: 24,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  bowlCircleDecoration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFDF3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F1E5B9",
    marginBottom: 20,
  },
  animationText: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "bold",
    textAlign: "center",
  },
  animationSubText: { fontSize: 14, color: "#94A3B8", marginTop: 6 },
  animationTextAnim: {
    marginTop: 15,
    fontSize: 16,
    color: "#A04030",
    fontWeight: "600",
    fontStyle: "italic",
  },
  congratsText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#A04030",
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: "#F7F8FA",
  },
  primaryButton: {
    backgroundColor: "#A04030",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#A04030",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonDisabled: {
    backgroundColor: "#D9A098",
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
