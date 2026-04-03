import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// Importe ta méthode de stockage (SecureStore, AsyncStorage, ou ton AuthContext)

export default function OAuthCallback() {
  // useLocalSearchParams récupère automatiquement les paramètres de l'URL (?token=...&firstname=...)
  const { token, firstname } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      if (token) {
        // 1. Sauvegarde ton token en local pour maintenir la session
        // await SecureStore.setItemAsync('userToken', token as string);
        
        console.log(`Connexion réussie pour ${firstname}. Token: ${token}`);

        // 2. Redirige l'utilisateur vers l'écran principal (remplace '/' par ta vraie route)
        router.replace('/(tabs)/dashboard'); 
      } else {
        // Gestion d'erreur si le token est manquant
        console.error("Aucun token reçu");
        router.replace('/(tabs)/dashboard');
      }
    };

    handleLogin();
  }, [token]);

  // Un écran de chargement temporaire, l'utilisateur ne le verra qu'une fraction de seconde
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Finalisation de la connexion...</Text>
    </View>
  );
}