import assert from 'node:assert/strict'
import test from 'node:test'
import {
  바이트를음악기호로,
  부분프레임읽기,
  프레임복구하기,
  음악기호를바이트로,
  음악기호찾기,
  오디오표본만들기,
  청크크기,
  텍스트복구하기,
  표본율,
  프레임만들기,
  프리앰블초,
  검사합16,
  기호길이초구하기,
  헤더읽기,
  의사잡음,
} from '../src/음악모뎀.js'

test('CRC-16/CCITT-FALSE 기준 벡터를 만족한다', () => {
  const 바이트들 = new TextEncoder().encode('123456789')
  assert.equal(검사합16(바이트들), 0x29b1)
})

test('바이트와 음악 기호는 손실 없이 왕복한다', () => {
  const 바이트들 = Uint8Array.from(Array.from({ length: 256 }, (_, 순서) => 순서))
  const 기호들 = 바이트를음악기호로(바이트들)
  const 복원 = Uint8Array.from(음악기호를바이트로(기호들))
  assert.deepEqual(복원, 바이트들)
})

test('청크가 깨지면 CRC로 실패를 판정한다', async () => {
  const 텍스트 = '재즈 화성으로 보내는 Jazzmodem 테스트 문장입니다.'
  const 프레임 = await 프레임만들기(텍스트)
  const 손상프레임 = new Uint8Array(프레임.바이트)
  const 헤더 = 헤더읽기(Array.from(손상프레임.slice(0, 16)))
  assert.equal(헤더.성공, true)
  if (!헤더.성공) return

  let 위치 = 16
  const 청크수 = Math.ceil(헤더.본문길이 / 청크크기)
  for (let 청크번호 = 0; 청크번호 < 청크수; 청크번호 += 1) {
    const 남은크기 = 헤더.본문길이 - 청크번호 * 청크크기
    const 길이 = Math.min(청크크기, 남은크기)
    손상프레임[위치] ^= 0xff
    위치 += (길이 + 2) * 헤더.반복수
  }

  const 복구 = 프레임복구하기(손상프레임)
  assert.equal(복구.성공, false)
  assert.equal(복구.전체청크수, 청크수)
  assert.equal(복구.성공청크수, 0)
})

test('부분 프레임은 CRC가 맞은 청크부터 읽을 수 있다', async () => {
  const 텍스트 = '청크 단위로 textarea가 채워지는 수신 UX를 검증합니다. 한글 경계도 스트리밍 디코더가 이어받습니다.'
  const 프레임 = await 프레임만들기(텍스트)
  const 헤더 = 헤더읽기(Array.from(프레임.바이트.slice(0, 16)))
  assert.equal(헤더.성공, true)
  if (!헤더.성공) return

  const 첫청크길이 = Math.min(청크크기, 헤더.본문길이) + 2
  const 첫부분 = 부분프레임읽기(프레임.바이트.slice(0, 16 + 첫청크길이))
  assert.equal(첫부분.성공, true)
  assert.equal(첫부분.완료됨, false)
  assert.equal(첫부분.성공청크수, 1)
  assert.deepEqual(첫부분.청크상태들.slice(0, 2), ['성공', '대기'])

  const 전체 = 부분프레임읽기(프레임.바이트)
  assert.equal(전체.성공, true)
  assert.equal(전체.완료됨, true)
  assert.equal(전체.성공청크수, 전체.전체청크수)
})

test('합성 오디오의 음악 기호를 다시 판정한다', () => {
  const 원본기호들 = Array.from({ length: 64 }, (_, 순서) => 순서)
  const 복원기호들 = 오디오에서기호복원하기(원본기호들)
  assert.deepEqual(복원기호들, 원본기호들)
})

test('작은 음량과 잡음이 섞여도 음악 기호를 다시 판정한다', () => {
  const 원본기호들 = Array.from({ length: 32 }, (_, 순서) => (순서 * 11 + 7) & 0b11_1111)
  const 복원기호들 = 오디오에서기호복원하기(원본기호들, { 음량: 0.045, 잡음: 0.0025 })
  assert.deepEqual(복원기호들, 원본기호들)
})

test('짧은 텍스트는 프레임 생성부터 오디오 복조까지 왕복한다', async () => {
  const 텍스트 = 'Jazzmodem'
  const 프레임 = await 프레임만들기(텍스트)
  const 원본기호들 = 바이트를음악기호로(프레임.바이트)
  const 복원기호들 = 오디오에서기호복원하기(원본기호들)
  const 복원바이트 = Uint8Array.from(음악기호를바이트로(복원기호들).slice(0, 프레임.바이트.length))
  const 복원 = await 텍스트복구하기(복원바이트)
  assert.equal(복원.텍스트, 텍스트)
})

function 오디오에서기호복원하기(원본기호들: number[], 옵션: { 음량?: number; 잡음?: number } = {}): number[] {
  const 표본결과 = 오디오표본만들기(원본기호들, 표본율)
  const 복원기호들: number[] = []
  let 위치 = Math.floor(표본율 * 프리앰블초)

  for (let 순서 = 0; 순서 < 원본기호들.length; 순서 += 1) {
    const 길이 = Math.round(표본율 * 기호길이초구하기(순서))
    const 창 = 잡음섞기(표본결과.표본들.slice(위치, 위치 + 길이), 옵션.음량 ?? 1, 옵션.잡음 ?? 0, 순서)
    복원기호들.push(음악기호찾기(창, 표본율, 순서).기호)
    위치 += 길이
  }

  return 복원기호들
}

function 잡음섞기(표본들: Float32Array, 음량: number, 잡음: number, 씨앗: number): Float32Array {
  if (음량 === 1 && 잡음 === 0) return 표본들
  const 결과 = new Float32Array(표본들.length)
  for (let 순서 = 0; 순서 < 표본들.length; 순서 += 1) {
    결과[순서] = 표본들[순서] * 음량 + 의사잡음(씨앗 + 31, 순서) * 잡음
  }
  return 결과
}
