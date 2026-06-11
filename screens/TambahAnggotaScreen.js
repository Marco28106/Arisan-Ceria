import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function TambahAnggotaScreen({ route, navigation }) {
  // Menangkap ID grup dari layar sebelumnya
  const { grupId } = route.params || {};

  const [nama, setNama] = useState("");
  const [nomorHp, setNomorHp] = useState(""); // State baru untuk nomor HP
  const [sudahBayar, setSudahBayar] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatKeNomorWA = (nomor) => {
    let bersih = nomor.replace(/[^0-9]/g, ""); // Buang semua karakter non-angka

    if (bersih.startsWith("0")) {
      bersih = "62" + bersih.slice(1); // Ganti "08..." jadi "628..."
    } else if (bersih.startsWith("8")) {
      bersih = "62" + bersih; // Jika langsung ketik "8...", tambahkan "62"
    }

    return bersih;
  };

  const simpanAnggota = async () => {
    if (!grupId) {
      Alert.alert(
        "Grup Tidak Ditemukan",
        "Tidak dapat menambahkan anggota karena grup tidak ditemukan. Kembali dan pilih grup yang valid.",
      );
      return;
    }

    if (!nama) {
      Alert.alert("Data Belum Lengkap", "Mohon isi nama anggota.");
      return;
    }

    if (!nomorHp) {
      Alert.alert(
        "Data Belum Lengkap",
        "Mohon isi nomor HP untuk keperluan pengingat WhatsApp.",
      );
      return;
    }

    setLoading(true);
    // Konversi nomor HP ke format internasional yang valid untuk WhatsApp
    const nomorWAValid = formatKeNomorWA(nomorHp);

    try {
      // Menyimpan data ke sub-koleksi "anggota" di dalam grup yang spesifik
      await addDoc(collection(db, "grup", grupId, "anggota"), {
        nama: nama,
        nomorHp: nomorWAValid, // Menyimpan nomor HP yang sudah diformat ke Firebase
        sudahBayar: sudahBayar,
        sudahDapat: false, // Default awal: belum pernah menang kocokan
        info: "Baru saja ditambahkan",
        createdAt: new Date(),
      });

      setLoading(false);
      Alert.alert("Sukses!", `${nama} berhasil ditambahkan ke grup.`);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      console.error("Error menambah anggota: ", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan data.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Anggota</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form Input */}
      <View style={styles.formContainer}>
        {/* Input Nama */}
        <Text style={styles.label}>Nama Anggota</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Ibu Ratna"
          placeholderTextColor="#94A3B8"
          value={nama}
          onChangeText={setNama}
        />

        {/* Input Nomor HP */}
        <Text style={styles.label}>Nomor WhatsApp</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 08123456789"
          placeholderTextColor="#94A3B8"
          value={nomorHp}
          onChangeText={setNomorHp}
          keyboardType="phone-pad" // Membuka keyboard angka langsung
        />

        {/* Status Pembayaran */}
        <Text style={styles.label}>Status Pembayaran Awal</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusBtn,
              !sudahBayar && styles.statusBtnActiveBelum,
            ]}
            onPress={() => setSudahBayar(false)}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={!sudahBayar ? "#FFF" : "#C62828"}
            />
            <Text
              style={[
                styles.statusText,
                !sudahBayar ? { color: "#FFF" } : { color: "#C62828" },
              ]}
            >
              Belum Bayar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusBtn,
              sudahBayar && styles.statusBtnActiveLunas,
            ]}
            onPress={() => setSudahBayar(true)}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={sudahBayar ? "#FFF" : "#2E7D32"}
            />
            <Text
              style={[
                styles.statusText,
                sudahBayar ? { color: "#FFF" } : { color: "#2E7D32" },
              ]}
            >
              Sudah Lunas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tombol Simpan */}
        <TouchableOpacity
          style={[styles.simpanBtn, loading && styles.simpanBtnDisabled]}
          activeOpacity={0.8}
          onPress={simpanAnggota}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.simpanBtnText}>Simpan Anggota</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0C1A30" },
  formContainer: { padding: 20 },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFF",
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#EAEBF0",
    color: "#0C1A30",
    marginBottom: 4,
  },
  statusContainer: { flexDirection: "row", gap: 12, marginTop: 8 },
  statusBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEBF0",
    backgroundColor: "#FFF",
    gap: 8,
  },
  statusBtnActiveBelum: { backgroundColor: "#C62828", borderColor: "#C62828" },
  statusBtnActiveLunas: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  statusText: { fontSize: 14, fontWeight: "600" },
  simpanBtn: {
    backgroundColor: "#A04030",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    shadowColor: "#A04030",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  simpanBtnDisabled: {
    backgroundColor: "#D9A098",
    shadowOpacity: 0,
    elevation: 0,
  },
  simpanBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
