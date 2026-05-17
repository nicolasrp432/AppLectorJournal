import React from 'react';
import { Tabs } from 'expo-router';
import { GlassNavbar } from '../../components/ui/GlassNavbar';
import { usePrefsStore } from '../../store/usePrefsStore';

export default function TabLayout() {
  const themeColor = usePrefsStore(s => s.prefs.theme_color);

  return (
    <Tabs
      tabBar={(props) => <GlassNavbar {...props} accentColor={themeColor} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="ruta"     />
      <Tabs.Screen name="progreso" />
      <Tabs.Screen name="libros"   />
      <Tabs.Screen name="tienda"   />
      <Tabs.Screen name="perfil"   />
    </Tabs>
  );
}
