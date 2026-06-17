import { describe, expect, it } from 'vitest'
import { v4 } from '../engine/uuid'
import { capCompoundFollowUps, dedupeFollowUpQuestions } from './followUpDedup'
import type { FollowUpQuestion } from '../types/voice'

describe('followUpDedup', () => {
  it('removes generic portion when decompose exists', () => {
    const questions: FollowUpQuestion[] = [
      {
        id: v4(),
        question: '「麻辣烫」里实际选了哪些？',
        reason: '拆解',
        field: 'components',
        priority: 9,
        followUpType: 'decompose',
        targetFood: '麻辣烫',
      },
      {
        id: v4(),
        question: '主要吃了什么？大概多大份？',
        reason: '笼统',
        field: 'portion',
        priority: 2,
        followUpType: 'portion',
      },
    ]
    const result = dedupeFollowUpQuestions(questions)
    expect(result).toHaveLength(1)
    expect(result[0].followUpType).toBe('decompose')
  })

  it('caps compound dish to decompose + one secondary', () => {
    const questions: FollowUpQuestion[] = [
      {
        id: v4(),
        question: '「麻辣烫」里实际选了哪些？',
        reason: '拆解',
        field: 'components',
        priority: 9,
        followUpType: 'decompose',
        targetFood: '麻辣烫',
      },
      {
        id: v4(),
        question: '汤底喝了多少？',
        reason: '钠',
        field: 'soup',
        priority: 8,
        followUpType: 'detail',
        targetFood: '麻辣烫',
      },
      {
        id: v4(),
        question: '「麻辣烫」吃了多少？',
        reason: '分量',
        field: 'portion',
        priority: 7,
        followUpType: 'portion',
        targetFood: '麻辣烫',
      },
    ]
    const result = capCompoundFollowUps(questions, 2)
    expect(result).toHaveLength(2)
    expect(result[0].followUpType).toBe('decompose')
    expect(result[1].followUpType).toBe('detail')
  })
})
