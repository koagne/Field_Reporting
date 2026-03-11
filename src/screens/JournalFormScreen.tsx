import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Linking,
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


  // États pour le calendrier
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [showCalendarList, setShowCalendarList] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState<Calendar.PermissionResponse | null>(null);


  // Chargement initial des permissions et calendriers
  const loadCalendars = async () => {
    try {
      const permission = await Calendar.getCalendarPermissionsAsync();
      setCalendarPermission(permission);

      if (permission.granted) {
        const availableCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const writableOnes = availableCalendars.filter(c => c.allowsModifications);
        setCalendars(writableOnes);
        if (writableOnes.length > 0 && !selectedCalendarId) {
          setSelectedCalendarId(writableOnes[0].id);
        }
      }
    } catch (error) {
      console.error("Erreur chargement calendriers:", error);
    }
  };

  useEffect(() => {
    loadCalendars();
  }, []);

  // Demande manuelle de permission
  const handleRequestCalendarPermission = async () => {
    const response = await Calendar.requestCalendarPermissionsAsync();
    setCalendarPermission(response);
    if (response.granted) {
      loadCalendars();
    } else if (!response.canAskAgain) {
      Alert.alert(
        'Accès Calendrier',
        'L\'accès au calendrier est désactivé. Veuillez l\'activer dans les réglages de votre application.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Réglages', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const selectedCalendarName = calendars.find(c => c.id === selectedCalendarId)?.title || 'Aucun sélectionné';

  // 1. Interaction Calendrier
  const addEventToCalendar = async (desc: string, coords: Coordinates) => {
    if (!selectedCalendarId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un calendrier.');
      return;
    }

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setHours(startDate.getHours() + 1);

      await Calendar.createEventAsync(selectedCalendarId, {
        title: 'Nouvelle Entrée Journal',
        notes: desc,
        location: `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`,
        startDate,
        endDate,
        timeZone: 'GMT',
      });

      Alert.alert('Calendrier', 'Événement ajouté avec succès !');
    } catch (error: any) {
      Alert.alert('Erreur Calendrier', error.message);
    }
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

      {/* 3. Choix du Calendrier */}
      <Text style={styles.label}>3. Destination Calendrier</Text>

      {!calendarPermission?.granted ? (
        <TouchableOpacity style={styles.permissionBox} onPress={handleRequestCalendarPermission}>
          <Text style={styles.permissionBoxText}>📁 Autoriser l'accès au calendrier</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={styles.calendarSelector}
            onPress={() => setShowCalendarList(!showCalendarList)}
          >
            <Text style={styles.calendarSelectorText}>📁 {selectedCalendarName}</Text>
            <Text style={styles.changeText}>{showCalendarList ? '[Fermer]' : '[Modifier]'}</Text>
          </TouchableOpacity>

          {showCalendarList && (
            <View style={styles.calendarList}>
              {calendars.length === 0 ? (
                <Text style={styles.noCalendarText}>Aucun calendrier accessible trouvé.</Text>
              ) : (
                calendars.map(cal => (
                  <TouchableOpacity
                    key={cal.id}
                    style={[styles.calendarItem, selectedCalendarId === cal.id && styles.selectedItem]}
                    onPress={() => {
                      setSelectedCalendarId(cal.id);
                      setShowCalendarList(false);
                    }}
                  >
                    <Text style={styles.calendarItemText}>{cal.title} ({cal.source.name})</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </>
      )}
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
  calendarButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  calendarButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  permissionBox: {
    backgroundColor: '#e0f7ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 15,
  },
  permissionBoxText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  calendarSelector: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  calendarSelectorText: {
    color: '#333',
    fontWeight: 'bold',
  },
  changeText: {
    color: '#007AFF',
    marginTop: 5,
    fontSize: 12,
  },
  calendarList: {
    maxHeight: 200,
    overflow: 'scroll',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  calendarItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  calendarItemText: {
    color: '#333',
  },
  noCalendarText: {
    padding: 15,
    color: '#999',
    textAlign: 'center',
  },
  linking: {
    color: 'blue',
    textDecorationLine: 'underline',
    marginTop: 10,
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
