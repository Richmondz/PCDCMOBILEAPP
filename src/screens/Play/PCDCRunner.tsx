import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { PCDC_TRIVIA, TriviaQuestion } from '../../data/pcdcTrivia'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence
} from 'react-native-reanimated'

const TRIVIA_INTERVAL_SEC = 30
const GAME_DURATION_SEC = 30
const COLS = 5
const ROWS = 8
const GRACE_ROADS = 2

type Car = { id: number; col: number; worldRow: number; dir: -1 | 1; cols: number }
function isRoad(worldRow: number) { const r = ((worldRow % 8) + 8) % 8; return [2, 4, 6].includes(r) }
function getBlockedCols(worldRow: number): number[] | null {
  if (!isRoad(worldRow)) return null
  const s = worldRow * 7919 + 31
  if ((s % 3) !== 0) return null
  const blocked: number[] = []
  const arr = [0, 1, 2, 3, 4]
  const n = 2 + ((s >> 3) % 2)
  for (let i = 0; i < n && arr.length > 1; i++) {
    const idx = ((s + i * 47) % 1000 + arr.length) % arr.length
    blocked.push(arr[idx])
    arr.splice(idx, 1)
  }
  return blocked
}
function isBlocked(worldRow: number, col: number): boolean {
  const blocked = getBlockedCols(worldRow)
  return blocked !== null && blocked.includes(col)
}

function getRandomQuestion(): TriviaQuestion {
  return PCDC_TRIVIA[Math.floor(Math.random() * PCDC_TRIVIA.length)]
}

function shuffleOptions(q: TriviaQuestion): { options: string[]; correct: number } {
  const paired = q.options.map((opt, i) => ({ opt, correct: i === q.correct }))
  for (let i = paired.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[paired[i], paired[j]] = [paired[j], paired[i]]
  }
  return { options: paired.map((p) => p.opt), correct: paired.findIndex((p) => p.correct) }
}

function getDifficulty(roadsCrossed: number): 'easy' | 'medium' | 'hard' | 'extreme' {
  if (roadsCrossed < 8) return 'easy'
  if (roadsCrossed < 20) return 'medium'
  if (roadsCrossed < 40) return 'hard'
  return 'extreme'
}

export default function CrossyTrivia() {
  const { width: SW } = Dimensions.get('window')
  const cellSize = Math.min(SW / (COLS + 2), 58)
  const [playing, setPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [roadsCrossed, setRoadsCrossed] = useState(0)
  const [playTime, setPlayTime] = useState(0)
  const [showTrivia, setShowTrivia] = useState(false)
  const [question, setQuestion] = useState<TriviaQuestion | null>(null)
  const [displayQ, setDisplayQ] = useState<{ options: string[]; correct: number } | null>(null)
  const [feedback, setFeedback] = useState<{ wrongIndex: number; correctIndex: number } | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const { session } = useAuth()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const carTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const carIdRef = useRef(0)
  const lastWorldRowRef = useRef(0)
  const charColRef = useRef(2)
  const playerWorldRowRef = useRef(0)

  const [charCol, setCharCol] = useState(2)
  const [playerWorldRow, setPlayerWorldRow] = useState(0)
  const [cars, setCars] = useState<Car[]>([])
  const offset = Math.max(0, playerWorldRow - 3)
  const visibleCars = useMemo(
    () => cars.filter((c) => c.worldRow >= offset && c.worldRow < offset + ROWS),
    [cars, offset]
  )

  const charX = useSharedValue(0)
  const charY = useSharedValue(0)
  const charScale = useSharedValue(1)
  const ctrlScale = useSharedValue(1)
  const cellSizeRef = useRef(cellSize)
  cellSizeRef.current = cellSize

  const diff = getDifficulty(roadsCrossed)
  const carSpeedMs = diff === 'easy' ? 800 : diff === 'medium' ? 620 : diff === 'hard' ? 480 : 360
  const spawnIntervalMs = diff === 'easy' ? 1500 : diff === 'medium' ? 1200 : diff === 'hard' ? 850 : 600

  const startGame = useCallback(() => {
    setPlaying(true)
    setGameOver(false)
    setScore(0)
    setRoadsCrossed(0)
    setPlayTime(0)
    setCharCol(2)
    setPlayerWorldRow(0)
    setCars([])
    carIdRef.current = 0
    lastWorldRowRef.current = 0
    charColRef.current = 2
    playerWorldRowRef.current = 0
    const cs = cellSizeRef.current
    charX.value = 2 * cs
    charY.value = 0
    charScale.value = 1
  }, [])

  useEffect(() => {
    if (!playing) return
    timerRef.current = setInterval(() => setPlayTime((t) => t + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playing])

  useEffect(() => {
    if (!playing || playTime === 0) return
    if (playTime >= GAME_DURATION_SEC) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          const { error } = await supabase.from('minigame_scores').insert({
            user_id: user.id,
            score,
            roads_crossed: roadsCrossed,
            trivia_correct: correctCount
          })
          if (error) console.error('[CrossyTrivia] Save score failed:', error)
        }
      })
      setGameOver(true)
      return
    }
    if (playTime > 0 && playTime % TRIVIA_INTERVAL_SEC === 0) {
      setShowTrivia(true)
      setFeedback(null)
      const q = getRandomQuestion()
      setQuestion(q)
      setDisplayQ(shuffleOptions(q))
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [playing, playTime])

  function handleAnswer(choiceIndex: number) {
    if (!displayQ || feedback) return
    const correct = choiceIndex === displayQ.correct
    if (correct) {
      const newCorrect = correctCount + 1
      setCorrectCount(newCorrect)
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          const { error } = await supabase.from('minigame_scores').insert({
            user_id: user.id,
            score,
            roads_crossed: roadsCrossed,
            trivia_correct: newCorrect
          })
          if (error) console.error('[CrossyTrivia] Save score failed:', error)
        }
      })
      setShowTrivia(false)
      setQuestion(null)
      setDisplayQ(null)
      setFeedback(null)
      timerRef.current = setInterval(() => setPlayTime((t) => t + 1), 1000)
    } else {
      setFeedback({ wrongIndex: choiceIndex, correctIndex: displayQ.correct })
    }
  }

  function loadNextQuestion() {
    setFeedback(null)
    const q = getRandomQuestion()
    setQuestion(q)
    setDisplayQ(shuffleOptions(q))
  }

  const move = useCallback((dcol: number, drow: number) => {
    if (!playing || showTrivia || gameOver) return
    const pc = charColRef.current
    const pw = playerWorldRowRef.current
    let nc = Math.max(0, Math.min(COLS - 1, pc + dcol))
    const nw = drow > 0 ? pw + 1 : drow < 0 ? Math.max(0, pw - 1) : pw
    if (isBlocked(nw, nc)) return
    if (dcol !== 0 && isBlocked(pw, nc)) return
    const cs = cellSizeRef.current
    const newOffset = Math.max(0, nw - 3)
    const viewRow = nw - newOffset
    if (drow > 0) {
      setScore((s) => s + 1)
      const prev = lastWorldRowRef.current
      lastWorldRowRef.current = nw
      let add = 0
      for (let w = prev + 1; w <= nw; w++) { if (isRoad(w)) add++ }
      if (add > 0) setRoadsCrossed((r) => r + add)
    }
    charColRef.current = nc
    playerWorldRowRef.current = nw
    setCharCol(nc)
    setPlayerWorldRow(nw)
    const lateralOnly = dcol !== 0 && drow === 0
    charX.value = withTiming(nc * cs, { duration: lateralOnly ? 35 : 100 })
    charY.value = withTiming(viewRow * cs, { duration: lateralOnly ? 35 : 100 })
    if (!lateralOnly) {
      charScale.value = withSequence(withTiming(1.08, { duration: 50 }), withTiming(1, { duration: 50 }))
    }
  }, [playing, showTrivia, gameOver])

  useEffect(() => {
    if (!playing || showTrivia || gameOver) return
    const moveCars = () => {
      setCars((prev) =>
        prev
          .map((c) => {
            const ncol = c.col + c.dir
            if (c.dir === 1 && ncol >= COLS) return null
            if (c.dir === -1 && ncol + c.cols <= 0) return null
            return { ...c, col: ncol }
          })
          .filter((c): c is Car => c !== null)
      )
    }
    carTimerRef.current = setInterval(moveCars, carSpeedMs)
    return () => { if (carTimerRef.current) clearInterval(carTimerRef.current) }
  }, [playing, showTrivia, gameOver, carSpeedMs])

  useEffect(() => {
    if (!playing || showTrivia || gameOver) return
    const pw = playerWorldRowRef.current
    if (pw < GRACE_ROADS) return
    const hit = cars.some((c) => {
      if (c.worldRow !== pw) return false
      return charCol >= c.col && charCol < c.col + c.cols
    })
    if (hit) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          const { error } = await supabase.from('minigame_scores').insert({
            user_id: user.id,
            score,
            roads_crossed: roadsCrossed,
            trivia_correct: correctCount
          })
          if (error) console.error('[CrossyTrivia] Save score failed:', error)
        }
      })
      setGameOver(true)
    }
  }, [cars, charCol, playerWorldRow, playing, showTrivia, gameOver, score, roadsCrossed, correctCount])

  useEffect(() => {
    if (!playing || showTrivia || gameOver) return
    const spawn = () => {
      setCars((p) => {
        const off = Math.max(0, playerWorldRowRef.current - 3)
        const roadWorldRows: number[] = []
        for (let w = off - 4; w < off + ROWS + 4; w++) if (isRoad(w)) roadWorldRows.push(w)
        const occupied = new Set(p.map((c) => c.worldRow))
        const available = roadWorldRows.filter((w) => !occupied.has(w))
        if (available.length === 0) return p
        const worldRow = available[Math.floor(Math.random() * available.length)]
        const dir = Math.random() > 0.5 ? 1 : -1
        const cols = Math.random() > 0.35 ? 1 : 2
        const col = dir === 1 ? -cols : COLS
        return [...p.filter((c) => c.worldRow >= off - 12)].slice(-16).concat({
          id: ++carIdRef.current, col, worldRow, dir, cols
        })
      })
    }
    const id = setInterval(spawn, spawnIntervalMs)
    return () => clearInterval(id)
  }, [playing, showTrivia, gameOver, spawnIntervalMs])

  const charStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: charX.value },
      { translateY: charY.value },
      { scale: charScale.value }
    ]
  }))

  const CtrlBtn = memo(({ dir, onPress }: { dir: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={24}
      delayPressIn={0}
      style={styles.ctrl}
    >
      <Text style={styles.ctrlText}>{dir}</Text>
    </TouchableOpacity>
  ))

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Crossy Trivia" showBack />

        <View style={styles.gameArea}>
          <View style={styles.scoreBar}>
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            <View style={[styles.diffBadge, diff === 'easy' && styles.diffEasy, diff === 'medium' && styles.diffMed, diff === 'hard' && styles.diffHard, diff === 'extreme' && styles.diffExtreme]}>
              <Text style={styles.diffText}>{diff}</Text>
            </View>
            <View style={styles.scoreRight}>
              <Text style={styles.timerText}>{Math.max(0, GAME_DURATION_SEC - playTime)}s</Text>
              <Text style={styles.correctLabel}>✓ {correctCount}</Text>
            </View>
            <View style={styles.scoreRight}>
              <Text style={styles.correctLabel}>✓ {correctCount}</Text>
            </View>
          </View>

          {!playing ? (
            <View style={styles.startArea}>
              <Text style={styles.gameTitle}>🐔 Crossy Trivia</Text>
              <Text style={styles.gameDesc}>
                Tap ↑↓←→ to move! Avoid cars. Use left/right to navigate around road blocks. Difficulty increases as you progress.
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.85}>
                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.startBtnGrad}>
                  <Text style={styles.startBtnText}>Start</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : gameOver ? (
            <View style={styles.startArea}>
              <Text style={styles.gameTitle}>Game Over</Text>
              <Text style={styles.gameDesc}>
                Score: {score} • Roads: {roadsCrossed} • Trivia: {correctCount}
              </Text>
              {!session && (
                <Text style={styles.signInHint}>Sign in to save your XP to the leaderboard!</Text>
              )}
              <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.85}>
                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.startBtnGrad}>
                  <Text style={styles.startBtnText}>Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.gridWrap]}>
                <View style={[styles.grid, { width: cellSize * COLS, height: cellSize * ROWS }]}>
                  {Array.from({ length: ROWS }).map((_, v) => {
                    const w = offset + v
                    return (
                    <View key={v} style={[styles.row, { height: cellSize }]}>
                      {Array.from({ length: COLS }).map((_, col) => {
                        const blocked = isBlocked(w, col)
                        return (
                        <View key={col} style={styles.cellWrap}>
                          {isRoad(w) ? (
                            <LinearGradient
                              colors={['#4b5563', '#374151', '#1f2937']}
                              style={[styles.cell, styles.roadCell, { width: cellSize, height: cellSize }]}
                            >
                              {col === 0 && <View style={[styles.roadLine, { height: cellSize }]} />}
                              {blocked && (
                                <View style={[styles.roadBlock, { width: cellSize - 4, height: cellSize - 4 }]}>
                                  <Text style={styles.roadBlockText}>🪨</Text>
                                </View>
                              )}
                            </LinearGradient>
                          ) : (
                            <LinearGradient
                              colors={['#22c55e', '#16a34a', '#15803d']}
                              style={[styles.cell, styles.grassCell, { width: cellSize, height: cellSize }]}
                            >
                              <View style={styles.grassDot} />
                            </LinearGradient>
                          )}
                        </View>
                      )})}
                    </View>
                  )})}
                  {visibleCars.map((c) => (
                    <View
                      key={c.id}
                      style={[
                        styles.car,
                        {
                          left: c.col * cellSize + 4,
                          top: (c.worldRow - offset) * cellSize + 4,
                          width: c.cols * cellSize - 8,
                          height: cellSize - 8
                        }
                      ]}
                    >
                      <Text style={styles.carText}>{c.cols > 1 ? '🚙' : '🚗'}</Text>
                    </View>
                  ))}
                  <Animated.View style={[styles.character, { width: cellSize - 8, height: cellSize - 8 }, charStyle]}>
                    <Text style={styles.charText}>🐔</Text>
                  </Animated.View>
                </View>
              </View>
              <View style={styles.controls}>
                <View style={styles.controlRow}>
                  <CtrlBtn dir="↑" onPress={() => move(0, -1)} />
                </View>
                <View style={styles.controlRow}>
                  <CtrlBtn dir="←" onPress={() => move(-1, 0)} />
                  <View style={styles.ctrlPlaceholder} />
                  <CtrlBtn dir="→" onPress={() => move(1, 0)} />
                </View>
                <View style={styles.controlRow}>
                  <CtrlBtn dir="↓" onPress={() => move(0, 1)} />
                </View>
              </View>
            </>
          )}
        </View>

        <Modal visible={showTrivia} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.triviaCard}>
              <Text style={styles.triviaTitle}>⏸️ PCDC Trivia</Text>
              <Text style={styles.triviaQ}>{question?.q}</Text>
              <View style={styles.options}>
                {displayQ?.options.map((opt, i) => {
                  const isWrong = feedback && i === feedback.wrongIndex
                  const isCorrect = feedback && i === feedback.correctIndex
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.optionBtn,
                        isWrong && styles.optionWrong,
                        isCorrect && styles.optionCorrect
                      ]}
                      onPress={() => handleAnswer(i)}
                      activeOpacity={feedback ? 1 : 0.5}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      disabled={!!feedback}
                    >
                      <Text style={[styles.optionText, isWrong && styles.optionTextWrong, isCorrect && styles.optionTextCorrect]}>
                        {opt} {isCorrect && ' ✓'}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              {feedback && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>Correct answer & explanation</Text>
                  <Text style={styles.feedbackCorrect}>
                    ✓ {displayQ?.options[feedback.correctIndex]}
                  </Text>
                  <Text style={styles.feedbackExplanation}>
                    {question?.explanation ?? `The correct answer is: ${displayQ?.options[feedback.correctIndex]}`}
                  </Text>
                  <TouchableOpacity style={styles.nextQuestionBtn} onPress={loadNextQuestion} activeOpacity={0.8}>
                    <Text style={styles.nextQuestionText}>Next Question →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  gameArea: { flex: 1, alignItems: 'center', paddingTop: 12 },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  scoreValue: { fontSize: 24, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  diffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  diffEasy: { backgroundColor: 'rgba(34,197,94,0.3)' },
  diffMed: { backgroundColor: 'rgba(245,158,11,0.3)' },
  diffHard: { backgroundColor: 'rgba(239,68,68,0.3)' },
  diffExtreme: { backgroundColor: 'rgba(139,92,246,0.4)' },
  diffText: { fontSize: 11, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  scoreRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerText: { fontSize: 14, color: '#fbbf24', fontWeight: '700' },
  correctLabel: { fontSize: 14, color: '#34d399', fontWeight: '700' },
  startArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  gameTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 12 },
  gameDesc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  signInHint: { fontSize: 13, color: '#f59e0b', marginBottom: 16, textAlign: 'center', fontWeight: '600' },
  startBtn: { overflow: 'hidden', borderRadius: 16 },
  startBtnGrad: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16 },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  gridWrap: {
    borderRadius: 16,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8
  },
  grid: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cellWrap: {},
  cell: { borderRadius: 4 },
  grassCell: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
  grassDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' },
  roadCell: { borderWidth: 1, borderColor: 'rgba(75,85,99,0.6)' },
  roadLine: { position: 'absolute', left: 0, width: 2, backgroundColor: '#fbbf24', opacity: 0.6 },
  roadBlock: { position: 'absolute', backgroundColor: 'rgba(100,100,100,0.9)', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  roadBlockText: { fontSize: 18 },
  car: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carText: { fontSize: 24 },
  character: {
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charText: { fontSize: 28 },
  controls: { marginTop: 14, marginBottom: 28, gap: 6 },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  ctrl: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(129,140,248,0.8)'
  },
  ctrlPressed: { opacity: 0.7 },
  ctrlPlaceholder: { width: 48, height: 48 },
  ctrlText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 24 },
  triviaCard: { backgroundColor: '#fff', borderRadius: 24, padding: 28, gap: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  triviaTitle: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center' },
  triviaQ: { fontSize: 16, fontWeight: '600', color: '#333', lineHeight: 26 },
  options: { gap: 12 },
  optionBtn: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  optionWrong: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  optionCorrect: { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
  optionText: { fontSize: 15, color: '#111' },
  optionTextWrong: { color: '#b91c1c' },
  optionTextCorrect: { color: '#15803d', fontWeight: '700' },
  feedbackSection: { marginTop: 8, gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  feedbackLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  feedbackCorrect: { fontSize: 16, fontWeight: '700', color: '#15803d' },
  feedbackExplanation: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  nextQuestionBtn: { backgroundColor: '#6366f1', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  nextQuestionText: { fontSize: 16, fontWeight: '700', color: '#fff' }
})
