import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import { useAuth } from '@/hooks/use-auth-context'
import { Link, Stack } from 'expo-router'
import React from 'react'
import { StyleSheet, View, Text } from 'react-native'

export default function LoginScreen() {
  const { session } = useAuth()
  console.log('Session in LoginScreen:', session)

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <View style={styles.container}>
        <GoogleSignInButton />
        <Link href="/" replace={true} style={styles.link}>
          <Text>Try to navigate to home screen!</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
})
