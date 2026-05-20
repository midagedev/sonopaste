import assert from 'node:assert/strict'
import test from 'node:test'
import { 패리티청크만들기, 데이터청크복원하기 } from '../src/리드솔로몬.js'

function 무작위청크(씨앗: number, 길이: number): Uint8Array {
  const 청크 = new Uint8Array(길이)
  let 상태 = 씨앗 >>> 0
  for (let 순서 = 0; 순서 < 길이; 순서 += 1) {
    상태 = (상태 * 1664525 + 1013904223) >>> 0
    청크[순서] = (상태 >>> 16) & 0xff
  }
  return 청크
}

test('패리티 청크로 소실된 데이터 청크를 복원한다', () => {
  const 데이터수 = 8
  const 패리티수 = 4
  const 청크길이 = 64
  const 데이터청크들 = Array.from({ length: 데이터수 }, (_, 순서) => 무작위청크(순서 + 1, 청크길이))
  const 패리티청크들 = 패리티청크만들기(데이터청크들, 패리티수)
  assert.equal(패리티청크들.length, 패리티수)

  const 받은: (Uint8Array | null)[] = [...데이터청크들, ...패리티청크들]
  받은[1] = null
  받은[4] = null
  받은[6] = null
  받은[데이터수 + 2] = null

  const 복원 = 데이터청크복원하기(받은, 데이터수, 청크길이)
  assert.equal(복원 === null, false)
  if (!복원) return
  for (let 순서 = 0; 순서 < 데이터수; 순서 += 1) {
    assert.deepEqual(복원[순서], 데이터청크들[순서])
  }
})

test('소실이 패리티 수를 넘으면 복원하지 못한다', () => {
  const 데이터수 = 6
  const 패리티수 = 3
  const 청크길이 = 32
  const 데이터청크들 = Array.from({ length: 데이터수 }, (_, 순서) => 무작위청크(순서 + 10, 청크길이))
  const 패리티청크들 = 패리티청크만들기(데이터청크들, 패리티수)

  const 받은: (Uint8Array | null)[] = [...데이터청크들, ...패리티청크들]
  받은[0] = null
  받은[1] = null
  받은[2] = null
  받은[3] = null

  assert.equal(데이터청크복원하기(받은, 데이터수, 청크길이), null)
})

test('데이터 청크가 모두 살아있으면 그대로 반환한다', () => {
  const 데이터수 = 5
  const 청크길이 = 16
  const 데이터청크들 = Array.from({ length: 데이터수 }, (_, 순서) => 무작위청크(순서 + 50, 청크길이))
  const 패리티청크들 = 패리티청크만들기(데이터청크들, 2)

  const 복원 = 데이터청크복원하기([...데이터청크들, ...패리티청크들], 데이터수, 청크길이)
  assert.equal(복원 === null, false)
  if (!복원) return
  for (let 순서 = 0; 순서 < 데이터수; 순서 += 1) {
    assert.deepEqual(복원[순서], 데이터청크들[순서])
  }
})

test('데이터 청크가 하나뿐이어도 패리티로 복원한다', () => {
  const 청크길이 = 64
  const 데이터청크들 = [무작위청크(777, 청크길이)]
  const 패리티청크들 = 패리티청크만들기(데이터청크들, 2)

  const 받은: (Uint8Array | null)[] = [null, 패리티청크들[0], null]
  const 복원 = 데이터청크복원하기(받은, 1, 청크길이)
  assert.equal(복원 === null, false)
  if (!복원) return
  assert.deepEqual(복원[0], 데이터청크들[0])
})
