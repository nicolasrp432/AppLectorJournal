import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: check Supabase session to redirect to (auth)/welcome or (tabs)/ruta
  return <Redirect href="/(auth)/welcome" />;
}
