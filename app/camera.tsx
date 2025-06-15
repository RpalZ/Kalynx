import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/use-toast';
import { useRouter } from 'expo-router';

interface Recipe {
  title: string;
  ingredients: string[];
  estimated_cost?: number;
  carbon_impact?: number;
  water_impact?: number;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location access for accurate pricing.',
          [{ text: 'OK' }]
        );
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation(location);
      }
    })();
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (!photo.base64) {
        throw new Error('Failed to capture image');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-recipes-from-fridge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            imageBase64: photo.base64,
            latitude: location?.coords.latitude,
            longitude: location?.coords.longitude
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recipes');
      }

      const data = await response.json();
      console.log('Generated recipes:', data);

      toast({
        title: "Success!",
        description: "Recipes generated based on your ingredients.",
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process image',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logRecipeAsMeal = async (recipe: Recipe) => {
    try {
      console.log('Logging recipe as meal:', recipe);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        console.error('No session found');
        router.replace('/auth');
        return;
      }

      console.log('Sending request to log-meal endpoint');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/log-meal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            mealName: recipe.title,
          }),
        }
      );

      console.log('Response status:', response.status);
      const responseData = await response.text();
      console.log('Response data:', responseData);

      if (response.ok) {
        Alert.alert('Success', 'Recipe logged as meal!');
        router.push('/(tabs)/meals');
      } else {
        console.error('Failed to log meal:', responseData);
        Alert.alert('Error', 'Failed to log recipe as meal: ' + responseData);
      }
    } catch (error) {
      console.error('Error logging recipe:', error);
      Alert.alert('Error', 'Failed to log recipe: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }

  if (!permission.granted) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={cameraRef}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={takePicture}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : 'Take Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 