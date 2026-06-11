import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Linking, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { fetchFeed, fetchNearby, youtubeUrl, type EstablishmentCard } from "./src/api";

export default function App() {
  const [items, setItems] = useState<EstablishmentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"feed" | "nearby">("feed");

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try { setItems(await fetchFeed()); setMode("feed"); } finally { setLoading(false); }
  }, []);

  const loadNearby = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { await loadFeed(); return; }
      const pos = await Location.getCurrentPositionAsync({});
      setItems(await fetchNearby(pos.coords.latitude, pos.coords.longitude));
      setMode("nearby");
    } finally { setLoading(false); }
  }, [loadFeed]);

  useEffect(() => { void loadFeed(); }, [loadFeed]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.h1}>Ostentaculus</Text>
      <View style={styles.tabs}>
        <TouchableOpacity onPress={loadFeed}><Text style={[styles.tab, mode === "feed" && styles.tabActive]}>Curadoria</Text></TouchableOpacity>
        <TouchableOpacity onPress={loadNearby}><Text style={[styles.tab, mode === "nearby" && styles.tabActive]}>Perto de mim</Text></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color="#c8a96e" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.category} · {item.city}, {item.country}</Text>
              {item.youtubeVideoId && (
                <TouchableOpacity onPress={() => Linking.openURL(youtubeUrl(item.youtubeVideoId!))}>
                  <Text style={styles.watch}>▶ Ver mini-documental</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", paddingTop: 60, paddingHorizontal: 16 },
  h1: { color: "#c8a96e", fontSize: 26, fontWeight: "700", marginBottom: 12 },
  tabs: { flexDirection: "row", gap: 20, marginBottom: 12 },
  tab: { color: "#888", fontSize: 16 },
  tabActive: { color: "#fff", borderBottomColor: "#8B1A1A", borderBottomWidth: 2 },
  card: { backgroundColor: "#1b1b1b", borderRadius: 12, padding: 16, marginBottom: 12 },
  name: { color: "#fff", fontSize: 18, fontWeight: "600" },
  meta: { color: "#aaa", marginTop: 4 },
  watch: { color: "#c8a96e", marginTop: 10, fontWeight: "600" },
});
