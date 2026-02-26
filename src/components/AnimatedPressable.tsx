import React from 'react'
import { Pressable, PressableProps, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

export default function AnimatedPressable({ children, style, ...props }: PressableProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={style}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 400 })
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 })
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}
