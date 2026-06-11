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
import { auth } from "../firebaseConfig";

export default function TambahArisanScreen({ navigation }) {
  const [nama, setNama] = useState("");
  const [iuran, setIuran] = useState("");
  const [anggota, setAnggota] = useState("");
  const [loading, setLoading] = useState(false);

  const simpanGrup = async () => {
    const cleanedIuran = parseInt(iuran.toString().replace(/[^0-9]/g, ""), 10);
    const cleanedAnggota = parseInt(
      anggota.toString().replace(/[^0-9]/g, ""),
      10,
    );

    if (!nama || !iuran || !anggota) {
      Alert.alert("Data Belum Lengkap", "Mohon isi semua kolom yang tersedia.");
      return;
    }

    if (Number.isNaN(cleanedIuran) || cleanedIuran <= 0) {
      Alert.alert(
        "Nominal Tidak Valid",
        "Mohon masukkan nominal iuran yang valid.",
      );
      return;
    }

    if (Number.isNaN(cleanedAnggota) || cleanedAnggota <= 0) {
      Alert.alert(
        "Jumlah Anggota Tidak Valid",
        "Mohon masukkan jumlah anggota yang valid.",
      );
      return;
    }

    if (!auth?.currentUser?.uid) {
      Alert.alert("Login Diperlukan", "Silakan login terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "grup"), {
        nama: nama.trim(),
        iuran: cleanedIuran,
        anggota: cleanedAnggota,
        ownerId: auth.currentUser.uid,
        createdAt: new Date(),
      });

      setLoading(false);
      Alert.alert("Sukses!", "Grup arisan baru berhasil dibuat.");
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      console.error("Error menambah grup: ", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan data.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Grup Baru</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Nama Grup Arisan</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Arisan Keluarga Siregar"
          value={nama}
          onChangeText={setNama}
        />

        <Text style={styles.label}>Nominal Iuran (Per Bulan)</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Rp 100.000"
          value={iuran}
          onChangeText={setIuran}
        />

        <Text style={styles.label}>Jumlah Anggota</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 15"
          keyboardType="numeric"
          value={anggota}
          onChangeText={setAnggota}
        />

        <TouchableOpacity
          style={[styles.simpanBtn, loading && styles.simpanBtnDisabled]}
          activeOpacity={0.8}
          onPress={simpanGrup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.simpanBtnText}>Simpan Grup</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  formContainer: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFF",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    color: "#0F172A",
  },
  simpanBtn: {
    backgroundColor: "#A04030",
    height: 54,
    borderRadius: 12,
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
