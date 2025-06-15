import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';

interface Location {
  latitude: number;
  longitude: number;
}

export function FridgeCamera() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Request location permission when component mounts
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Location access denied. Prices will be based on default rates.');
          toast({
            title: "Location Access",
            description: "Please enable location access for accurate pricing.",
            variant: "destructive"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          resolve(base64String.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      // Call the Edge Function with location data
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recipes-from-fridge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            imageBase64: base64,
            latitude: location?.latitude,
            longitude: location?.longitude
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recipes');
      }

      const data = await response.json();
      console.log('Generated recipes:', data);

      // Show success toast
      toast({
        title: "Success!",
        description: "Recipes generated based on your ingredients.",
      });

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to process image',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <Camera className="w-6 h-6 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Scan Your Fridge</h2>
      </div>
      
      {locationError && (
        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          {locationError}
        </p>
      )}

      <div className="relative">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          ref={fileInputRef}
          className="hidden"
          disabled={isLoading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-md text-white font-medium
            ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isLoading ? 'Processing...' : 'Take Photo'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {location && (
        <p className="text-sm text-gray-600">
          Location detected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
} 