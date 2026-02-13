import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '../../../theme/tokens'
import { supabase } from '../../../lib/supabase'
import Composer from '../../../components/Composer'
import { PrimaryButton } from '../../../components/Buttons'
import TagChips from '../../../components/TagChips'
import MoodPicker from '../../../components/MoodPicker'
import { useDailyPulse } from '../../../store/dailyPulse'

export default function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [grade, setGrade] = useState('')
  const { mood, setMood, tags, toggleTag, note, setNote, saveCheckIn } = useDailyPulse()
  const [cohorts, setCohorts] = useState<{id:string;name:string}[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  useEffect(() => { (async () => {
    const { data } = await supabase.from('cohorts').select('id,name').eq('active', true)
    setCohorts((data as any[]) || [])
  })() }, [])

  async function acceptGuidelines() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('guidelines_acceptance').upsert({ user_id: user.id })
  }
  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({ id: user.id, role: 'teen', nickname, grade })
  }
  async function requestCohort() {
    if (!selectedCohort) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('membership_requests').insert({ cohort_id: selectedCohort, user_id: user.id })
  }
  async function finish() {
    await saveCheckIn()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
  }

  return (
    <View style={styles.wrap}>
      {step === 0 && (
        <View style={styles.step}>
          <Text style={styles.title}>Welcome to Teen Club</Text>
          <Text style={styles.body}>Purpose and safety-first rules</Text>
          <PrimaryButton title="I agree" onPress={() => { acceptGuidelines(); setStep(1) }} />
        </View>
      )}
      {step === 1 && (
        <View style={styles.step}>
          <Text style={styles.title}>Create your profile</Text>
          <Composer value={nickname} onChange={setNickname} limit={50} />
          <Composer value={grade} onChange={setGrade} limit={10} />
          <PrimaryButton title="Next" onPress={() => { saveProfile(); setStep(2) }} />
        </View>
      )}
      {step === 2 && (
        <View style={styles.step}>
          <Text style={styles.title}>Choose interests</Text>
          <TagChips value={tags} onToggle={toggleTag} />
          <PrimaryButton title="Next" onPress={() => setStep(3)} />
        </View>
      )}
      {step === 3 && (
        <View style={styles.step}>
          <Text style={styles.title}>Pick a cohort</Text>
          {cohorts.map(c => (
            <TouchableOpacity key={c.id} style={[styles.cohort, selectedCohort === c.id && styles.active]} onPress={() => setSelectedCohort(c.id)}>
              <Text>{c.name}</Text>
            </TouchableOpacity>
          ))}
          <PrimaryButton title="Request" onPress={() => { requestCohort(); setStep(4) }} />
        </View>
      )}
      {step === 4 && (
        <View style={styles.step}>
          <Text style={styles.title}>Do your first check-in</Text>
          <MoodPicker value={mood} onChange={setMood} />
          <Composer value={note} onChange={setNote} limit={200} />
          <PrimaryButton title="Finish" onPress={finish} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s16 },
  step: { gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  body: { fontSize: tokens.typography.body },
  cohort: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.button, padding: tokens.spacing.s12 },
  active: { backgroundColor: '#DBEAFE' }
})

