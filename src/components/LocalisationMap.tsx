import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Coordinates } from "../types/index";
import {
  getCurrentPositionAsync,
  useForegroundPermissions,
} from "expo-location";
import MapView, { Marker } from "react-native-maps";

interface onLocalisationFound {
  onLocationFound: (coords: Coordinates) => void;
}

const LocalisationMap: React.FC<onLocalisationFound> = ({
  onLocationFound,
}) => {
  const [location, setLocation] = React.useState<Coordinates | null>(null);
  const [permission, requestPermission] = useForegroundPermissions();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const getLocation = async () => {
      if (!permission || permission.status !== "granted") {
        const perm = await requestPermission();
        if (!perm.granted) {
          setErrorMsg("Permission refusée pour accéder à la localisation.");
          return;
        }
      }
      const loc = await getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);
      onLocationFound(coords);
    };
    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <Text>{errorMsg}</Text>
      ) : location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            pinColor="red"
          />
        </MapView>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: 250,
  },
  button: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default LocalisationMap;
