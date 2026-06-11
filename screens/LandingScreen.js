import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      <View style={styles.hero}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1528740561666-dc2479dc08c5?q=80&w=1200&auto=format&fit=crop",
          }}
          style={styles.heroImage}
        />

        <View style={styles.heroOverlay} />
      </View>

      <View style={styles.content}>
        <Text style={styles.brand}>Arisan Ceria</Text>
        <Text style={styles.tagline}>
          Kelola arisan dengan lebih transparan, rapi, dan seru bersama teman &
          keluarga.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#A04030" />
            <Text style={styles.featureText}>Transparan & mudah dipantau</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="people" size={18} color="#A04030" />
            <Text style={styles.featureText}>Buat grup & tambah anggota cepat</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="sparkles" size={18} color="#A04030" />
            <Text style={styles.featureText}>Kocok & riwayat kegiatan otomatis</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Login")}
        >
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
          <Text style={styles.ctaText}>Mulai</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCta}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.secondaryText}>Sudah punya akun? Masuk</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Dengan masuk, kamu setuju untuk menggunakan aplikasi ini sesuai ketentuan
          yang berlaku.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  hero: {
    height: Math.round(width * 0.65),
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(160, 64, 48, 0.15)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    justifyContent: "flex-start",
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: "#A04030",
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginBottom: 18,
  },
  features: {
    backgroundColor: "#F7F7FA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#A04030",
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 6,
  },
  ctaText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryCta: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  secondaryText: {
    color: "#A04030",
    fontWeight: "700",
    fontSize: 14,
  },
  footerNote: {
    marginTop: 18,
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    lineHeight: 16,
  },
});
