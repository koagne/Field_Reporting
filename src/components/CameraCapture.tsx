import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

interface CameraCaptureProps {
  onPhotoTaken: (uri: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoTaken }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    const response = await requestPermission();
    if (!response.granted) {
      alert("Permission to access camera is required!");
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (photo) {
        setPhotoUri(photo.uri);
        onPhotoTaken(photo.uri);
      }
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    onPhotoTaken("");
  };

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white", textAlign: "center", marginBottom: 20 }}>
          Camera permission is required to take photos.
        </Text>
        <Button title="Request Permission" onPress={handleRequestPermission} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <TouchableOpacity style={styles.button} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Reprendre</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <CameraView ref={cameraRef} style={styles.camera} />
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>Prendre une photo</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: "black",
    borderRadius: 10,
    overflow: "hidden",
  },
  camera: {
    width: "100%",
    height: "80%",
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 10,
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
export default CameraCapture;
