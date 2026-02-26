import React, { useEffect } from 'react'
import { ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { tokens } from '../theme/tokens'

interface FadeInViewProps {
  children: React.ReactNode
  style?: ViewStyle
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'none'
}

export default function FadeInView({ children, style, delay = 0, duration = 400, direction = 'up' }: FadeInViewProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(direction === 'up' ? 12 : direction === 'down' ? -12 : 0)

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration })
      translateY.value = withSpring(0, { damping: 18, stiffness: 120 })
    }, delay)
    return () => clearTimeout(timer)
  }, [delay, duration])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }))

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
}
