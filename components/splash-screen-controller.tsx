import { useAuth } from '@/hooks/use-auth-context'
import { SplashScreen } from 'expo-router'

SplashScreen.preventAutoHideAsync()

export function SplashScreenController() {
  const { isLoading } = useAuth()

  if (!isLoading) {
    SplashScreen.hideAsync()
  }

  return null
}
