import React, { useContext, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { updateProfile, signOut } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

import { UserContext } from "../context/UserContext";
import { auth, storage, db } from "../firebaseConfig";

export default function ProfilScreen({ navigation }) {
  const { displayName, refreshDisplayName } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout gagal:", e);
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);

  const initialName = useMemo(() => displayName || "", [displayName]);

  const startEdit = () => {
    setDraftName(initialName);
    setIsEditingName(true);
  };

  const cancelEdit = () => {
    setIsEditingName(false);
    setDraftName("");
    setSaving(false);
  };

  const pickAndUploadPhoto = async () => {
    if (!auth?.currentUser) {
      Alert.alert("Sesi tidak ditemukan", "Silakan login ulang.");
      return;
    }

    try {
      setIsUploadingPhoto(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin diperlukan",
          "Aplikasi membutuhkan akses galeri untuk mengganti foto profil.",
        );
        return;
      }

      let mediaTypes;
      if (ImagePicker?.MediaType?.Images) {
        mediaTypes = ImagePicker.MediaType.Images;
      } else if (ImagePicker?.MediaTypeOptions?.Images) {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      }

      const result = await ImagePicker.launchImageLibraryAsync(
        mediaTypes
          ? { mediaTypes, allowsEditing: true, quality: 0.8 }
          : { allowsEditing: true, quality: 0.8 },
      );

      if (result.canceled) return;

      const { uri } = result.assets?.[0] || {};
      if (!uri) {
        Alert.alert("Gagal", "Tidak ada gambar yang dipilih.");
        return;
      }

      const uid = auth.currentUser.uid;
      const fileRef = ref(storage, `profile_photos/${uid}`);

      // fetch blob dari uri lokal
      const response = await fetch(uri);
      const blob = await response.blob();

      // biar error Storage lebih mudah dilacak
      console.log("profile photo blob:", {
        size: blob?.size,
        type: blob?.type,
        uri,
        uid,
      });

      await uploadBytes(fileRef, blob, {
        // paksa agar tidak jadi contentType kosong
        contentType: blob?.type ? blob.type : "image/jpeg",
      });

      const downloadURL = await getDownloadURL(fileRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });

      // refresh agar photoURL keambil dari auth ter-update
      await auth.currentUser.reload();
      if (refreshDisplayName) await refreshDisplayName();
    } catch (e) {
      console.error("Upload foto profil gagal:", {
        code: e?.code,
        message: e?.message,
        serverResponse: e?.serverResponse,
        customData: e?.customData,
        name: e?.name,
      });
      Alert.alert("Gagal mengubah foto", "Terjadi kesalahan saat upload.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const saveEdit = async () => {
    const newName = draftName.trim();
    if (!newName) {
      Alert.alert("Nama tidak boleh kosong", "Masukkan nama yang valid.");
      return;
    }

    if (!auth?.currentUser) {
      Alert.alert("Sesi tidak ditemukan", "Silakan login ulang.");
      return;
    }

    try {
      setSaving(true);

      // 1) Update Firebase Auth
      await updateProfile(auth.currentUser, { displayName: newName });

      // 2) Update Firestore user profile (agar "database" juga keubah)
      const uid = auth.currentUser.uid;
      await setDoc(
        doc(db, "users", uid),
        {
          displayName: newName,
          name: newName,
        },
        { merge: true },
      );

      await refreshDisplayName?.();

      setIsEditingName(false);
      setDraftName("");
    } catch (e) {
      console.error(e);
      Alert.alert("Gagal menyimpan", "Terjadi kesalahan saat menyimpan nama.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#A04030" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Profil Saya</Text>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="settings-outline" size={24} color="#A04030" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  auth?.currentUser?.photoURL ||
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
              }}
              style={styles.avatar}
            />
          </View>

          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickAndUploadPhoto}
            disabled={isUploadingPhoto}
            activeOpacity={0.8}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color="#A04030" />
            ) : (
              <>
                <Ionicons name="camera" size={18} color="#A04030" />
                <Text style={styles.changePhotoText}>Ganti Foto</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{displayName || ""}</Text>

            <TouchableOpacity style={styles.editButton} onPress={startEdit}>
              <Ionicons name="pencil" size={16} color="#A04030" />
            </TouchableOpacity>
          </View>

          {isEditingName && (
            <View style={styles.editPanel}>
              <Text style={styles.editLabel}>Ubah Nama</Text>
              <View style={styles.editInputWrap}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Masukkan Nama"
                  placeholderTextColor="#A0A0A0"
                  style={styles.editInput}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editActionButton, styles.editCancel]}
                  onPress={cancelEdit}
                  disabled={saving}
                >
                  <Text style={[styles.editActionText, { color: "#A04030" }]}>
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editActionButton, styles.editSave]}
                  onPress={saveEdit}
                  disabled={saving}
                >
                  <Text style={styles.editActionText}>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.profilePhone}>+62 812-3456-7890</Text>
        </View>

        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>PENGATURAN PEMBAYARAN</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconWrapper, { backgroundColor: "#FDBA74" }]}>
              <Ionicons name="business" size={20} color="#C2410C" />
            </View>
            <Text style={styles.menuText}>Rekening Bank & E-Wallet</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>PENGATURAN APLIKASI</Text>
          <TouchableOpacity style={styles.menuItemFirst}>
            <View style={[styles.iconWrapper, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="notifications" size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.menuText}>Notifikasi</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemMiddle}>
            <View style={[styles.iconWrapper, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="help-circle" size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.menuText}>Pusat Bantuan & FAQ</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemLast}>
            <View style={[styles.iconWrapper, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="document-text" size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.menuText}>Syarat & Ketentuan</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#A04030"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  navButton: { padding: 4 },
  navTitle: { fontSize: 20, fontWeight: "bold", color: "#A04030" },
  profileSection: { alignItems: "center", marginTop: 10, marginBottom: 24 },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#A04030",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  changePhotoText: { marginLeft: 8, color: "#A04030", fontWeight: "700" },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  nameRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  profileName: { fontSize: 22, fontWeight: "bold", color: "#0F172A" },
  editButton: {
    marginLeft: 8,
    backgroundColor: "#F1F5F9",
    padding: 4,
    borderRadius: 12,
  },
  editPanel: {
    width: "100%",
    marginTop: 14,
    paddingHorizontal: 20,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  editInputWrap: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    justifyContent: "center",
  },
  editInput: {
    fontSize: 15,
    color: "#000",
    paddingVertical: 0,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  editActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
  },
  editCancel: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#A04030",
  },
  editSave: {
    backgroundColor: "#A04030",
  },
  editActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  profilePhone: { fontSize: 14, color: "#64748B", marginTop: 4 },
  sectionGroup: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 16,
  },
  menuItemFirst: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemMiddle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemLast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: "500", color: "#0F172A" },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#A04030",
  },
  logoutText: { color: "#A04030", fontSize: 16, fontWeight: "bold" },
});
