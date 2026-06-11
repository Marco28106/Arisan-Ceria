import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform, // Keep Platform as it's used
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";

// Import Firebase Auth & fungsi updateProfile
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider, // Tambahkan import ini
  signInWithCredential,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db, firebaseConfig } from "../firebaseConfig"; // pakai firebaseConfig.js (C besar)
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserContext } from "../context/UserContext";

const { height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const { refreshDisplayName } = React.useContext(UserContext);
  // State Form Input
  const [namaLengkap, setNamaLengkap] = useState(""); // State baru untuk nama pengguna
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State Logika App
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const googleWebClientId = firebaseConfig?.webClientId;
  const googleAndroidClientId = firebaseConfig?.androidClientId;
  const googleIosClientId = firebaseConfig?.iosClientId;

  // Google Sign-In Hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId,
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
  });

  // Efek untuk menangani respons dari Google Sign-In
  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true); // Set loading saat proses sign-in Firebase dimulai

      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          // Jika pengguna baru, simpan data ke Firestore
          if (userCredential.additionalUserInfo.isNewUser) {
            await setDoc(
              doc(db, "users", user.uid),
              {
                email: user.email,
                name: user.displayName,
                displayName: user.displayName,
                createdAt: serverTimestamp(),
              },
              { merge: true },
            );
            Alert.alert(
              "Sukses!",
              `Selamat datang ${user.displayName}, akun berhasil dibuat dengan Google!`,
            );
          }
          await refreshDisplayName?.(); // Refresh profil di konteks
          navigation.navigate("Home");
        })
        .catch((error) => {
          Alert.alert(
            "Autentikasi Gagal",
            "Gagal masuk dengan Google. Coba lagi.",
          );
        })
        .finally(() => setLoading(false));
    } else if (response?.type === "cancel") {
      Alert.alert("Login Dibatalkan", "Proses login dengan Google dibatalkan.");
      setLoading(false);
    } else if (response?.type === "error") {
      console.error("Google Auth Error:", response.error);
      Alert.alert("Login Gagal", "Terjadi kesalahan saat login dengan Google.");
      setLoading(false);
    }
  }, [response, refreshDisplayName, navigation]);

  // Fungsi Eksekusi Login / Daftar
  const handleAuth = async () => {
    // Validasi tambahan jika dalam mode Register
    if (isRegister && !namaLengkap) {
      Alert.alert("Data Belum Lengkap", "Mohon isi Nama Lengkap Anda.");
      return;
    }

    if (!email || !password) {
      Alert.alert("Data Belum Lengkap", "Mohon isi Email dan Password Anda.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // 1. PROSES DAFTAR AKUN BARU
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

        // 2. SIMPAN NAMA KE PROFIL FIREBASE AUTH
        await updateProfile(userCredential.user, {
          displayName: namaLengkap.trim(),
        });
        // Pastikan displayName yang terbaca segera ter-refresh
        await userCredential.user.reload();

        // 3) SIMPAN DATA USER (email + nama) KE FIRESTORE
        await setDoc(
          doc(db, "users", userCredential.user.uid),
          {
            email: userCredential.user.email || email.trim(),
            name: namaLengkap.trim(),
            displayName: namaLengkap.trim(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );

        // Refresh juga state di UserContext supaya Home/Profil langsung update
        await refreshDisplayName?.();

        Alert.alert(
          "Sukses!",
          `Selamat datang ${namaLengkap}, akun berhasil dibuat!`,
        );
      } else {
        // PROSES LOGIN AKUN LAMA
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      // Reset form setelah sukses
      setNamaLengkap("");
      setEmail("");
      setPassword("");

      navigation.navigate("Home");
    } catch (error) {
      console.error(error);
      let pesanError = "Terjadi kesalahan. Periksa kembali jaringan Anda.";

      if (error.code === "auth/invalid-email")
        pesanError = "Format email salah.";
      else if (error.code === "auth/user-not-found")
        pesanError = "Email tidak terdaftar.";
      else if (error.code === "auth/wrong-password")
        pesanError = "Password salah.";
      else if (error.code === "auth/email-already-in-use")
        pesanError = "Email sudah digunakan akun lain.";
      else if (error.code === "auth/weak-password")
        pesanError = "Password minimal harus 6 karakter.";

      Alert.alert("Autentikasi Gagal", pesanError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.container}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent
          />

          {/* Bagian Atas: Gambar Ilustrasi */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop",
              }}
              style={styles.image}
            />
          </View>

          {/* Bagian Bawah: Card Konten */}
          <View style={styles.bottomCard}>
            <Text style={styles.title}>Arisan Ceria</Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? "Daftar akun baru sekarang untuk memulai pengelolaan arisan yang transparan."
                : "Kelola arisan seru bersama teman & keluarga dengan transparan dan mudah."}
            </Text>

            {/* FORM INPUT NAMA LENGKAP (Hanya muncul jika mode Register) */}
            {isRegister && (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan Nama Lengkap Anda"
                  placeholderTextColor="#A0A0A0"
                  value={namaLengkap}
                  onChangeText={setNamaLengkap}
                />
              </View>
            )}

            {/* FORM INPUT EMAIL */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Masukkan Email"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* FORM INPUT PASSWORD */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Masukkan Password"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Ionicons
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* TOMBOL UTAMA (LOGIN / REGISTER) */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              activeOpacity={0.8}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRegister ? "✉️ Daftar Sekarang" : "✉️ Masuk dengan Email"}
                </Text>
              )}
            </TouchableOpacity>

            {/* TOMBOL GOOGLE SIGN-IN */}
            <TouchableOpacity
              style={[styles.googleButton, loading && styles.disabledButton]}
              activeOpacity={0.8}
              onPress={() => {
                setLoading(true); // Set loading when starting Google auth flow
                promptAsync();
              }}
              disabled={!request || loading}
            >
              {loading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color="#4285F4"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.googleButtonText}>
                    Masuk dengan Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* TOGGLE PINDAH MODE */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsRegister(!isRegister);
                  setNamaLengkap(""); // Reset nama jika pindah mode
                }}
              >
                <Text style={styles.registerText}>
                  {isRegister ? "Masuk di sini" : "Daftar sekarang"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FA" },
  imageContainer: { height: height * 0.28, width: "100%" }, // Disesuaikan sedikit agar form muat saat keyboard naik
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  bottomCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#A04030",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    width: "100%",
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: "#000" },
  primaryButton: {
    backgroundColor: "#A04030",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  disabledButton: { backgroundColor: "#D9A098" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10, // Sesuaikan jika perlu
    borderWidth: 1,
    borderColor: "#EAEBF0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: { color: "#666666", fontSize: 14 },
  registerText: { color: "#A04030", fontSize: 14, fontWeight: "bold" },
});
