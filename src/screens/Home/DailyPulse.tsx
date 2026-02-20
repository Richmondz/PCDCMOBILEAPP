import { View, StyleSheet, Text } from 'react-native'
import MoodPicker from '../../components/MoodPicker'
import TagChips from '../../components/TagChips'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'
import { useDailyPulse } from '../../store/dailyPulse'
import { tokens } from '../../theme/tokens'
import { useEffect } from 'react';

export default function DailyPulse() {
  const { mood, setMood, tags, toggleTag, note, setNote, saveCheckIn, hasCheckedInToday, checkIfUserHasCheckedIn } = useDailyPulse();

  useEffect(() => {
    checkIfUserHasCheckedIn();
  }, []);

  if (hasCheckedInToday) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>You've checked in today!</Text>
        <Text style={styles.subtitle}>Great job on tracking your mood. Come back tomorrow to check in again.</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.title}>How are you feeling?</Text>
      <View style={styles.wrap}>
        <MoodPicker value={mood} onChange={setMood} />
        <TagChips value={tags} onToggle={toggleTag} />
        <Composer value={note} onChange={setNote} limit={280} placeholder="Add a note (optional)..." />
        <PrimaryButton title="Save Check-in" onPress={saveCheckIn} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16
  },
  wrap: { gap: 16 }
})

