import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import CameraCapture from "../components/CameraCapture";
import * as Calendar from "expo-calendar";
import { Coordinates } from "../types";
import { submitIncident } from "../services/api.service";
import LocalisationMap from "../components/LocalisationMap";

export const JournalFormScreen: React.FC = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);

  // Fonction pour ajouter un événement au calendrier
  const addEventToCalendar = async (
    description: string,
    coords: Coordinates,
  ) => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Impossible d'accéder au calendrier.");
      return;
    }
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );
    const writableCalendar = calendars.find((cal) => cal.allowsModifications);
    if (!writableCalendar) {
      Alert.alert("Erreur", "Aucun calendrier modifiable trouvé.");
      return;
    }
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    await Calendar.createEventAsync(writableCalendar.id, {
      title: "Nouvelle Entrée Journal",
      notes: description,
      location: `Lat: ${coords.latitude}, Lng: ${coords.longitude}`,
      startDate,
      endDate,
      timeZone: "UTC",
    });
    Alert.alert("Succès", "Événement ajouté au calendrier !");
  };

  // Gestion de la soumission
  const handleSubmit = async () => {
    if (!photoUri || !location) {
      Alert.alert(
        "Champs manquants",
        "Veuillez prendre une photo et attendre la localisation.",
      );
      return;
    }
    setLoading(true);
    try {
      const response = await submitIncident({
        photoUri,
        description,
        location,
        timestamp: Date.now(),
      });
      if (response.success) {
        await addEventToCalendar(description, location);
        setPhotoUri(null);
        setDescription("");
        setLocation(null);
      } else {
        Alert.alert("Erreur", response.error || "Erreur inconnue");
      }
    } catch (e: any) {
      Alert.alert("Erreur", e.error || "Erreur lors de la soumission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Signalement</Text>
      <Text style={styles.label}>1. Preuve Photographique</Text>
      <CameraCapture onPhotoTaken={setPhotoUri} />
      {photoUri && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Photo Capturée :</Text>
          <Image
            source={{ uri: photoUri }}
            style={{ width: "100%", height: 200, borderRadius: 10 }}
          />
        </View>
      )}
      <Text style={styles.label}>2. Description de l'événement</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Décris l' événement ici..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.label}>3. Localisation</Text>
      <LocalisationMap onLocationFound={setLocation} />
      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#aaa" }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              (loading || !location) && { backgroundColor: "#aaa" },
            ]}
            onPress={handleSubmit}
            disabled={loading || !location}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sauvegarder</Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  label: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 30,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
