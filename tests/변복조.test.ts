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
  기호비트수,
  기호길이초구하기,
  헤더읽기,
  알에스블록들구하기,
  압축풀기,
  의사잡음,
} from '../src/음악모뎀.js'

const 기호최대값 = (1 << 기호비트수) - 1

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

// 지정한 데이터 청크의 첫 바이트를 뒤집어 CRC가 깨지게 한다.
function 데이터청크손상시키기(프레임: Uint8Array, 본문길이: number, 목표청크: number): void {
  let 위치 = 16
  let 번호 = 0
  for (const 블록 of 알에스블록들구하기(Math.ceil(본문길이 / 청크크기))) {
    for (let 안번호 = 0; 안번호 < 블록.데이터수; 안번호 += 1) {
      const 길이 = Math.min(청크크기, 본문길이 - 번호 * 청크크기)
      if (번호 === 목표청크) {
        프레임[위치] ^= 0xff
        return
      }
      위치 += 길이 + 2
      번호 += 1
    }
    위치 += 블록.패리티수 * (청크크기 + 2)
  }
}

test('데이터 청크가 패리티 한도 안에서 깨져도 RS로 복구된다', async () => {
  const 텍스트 =
    '재즈 화성으로 보내는 Jazzmodem RS 복구 테스트입니다. 패리티 청크로 깨진 데이터 청크를 되살립니다. 한글 경계도 안전합니다.'
  const 프레임 = await 프레임만들기(텍스트)
  const 헤더 = 헤더읽기(Array.from(프레임.바이트.slice(0, 16)))
  assert.equal(헤더.성공, true)
  if (!헤더.성공) return

  const 손상프레임 = new Uint8Array(프레임.바이트)
  데이터청크손상시키기(손상프레임, 헤더.본문길이, 0)
  데이터청크손상시키기(손상프레임, 헤더.본문길이, 1)

  const 복구 = 프레임복구하기(손상프레임)
  assert.equal(복구.성공, true)
  if (!복구.성공) return
  const 원문 = await 압축풀기(복구.본문, 복구.헤더.압축됨)
  assert.equal(new TextDecoder().decode(원문), 텍스트)
})

test('깨진 데이터 청크가 패리티 수를 넘으면 복구하지 못한다', async () => {
  const 텍스트 =
    '재즈 화성으로 보내는 Jazzmodem 테스트 문장입니다. 패리티 한도를 넘기면 복구가 실패하는지 검증하기 위해 본문을 충분히 늘린 한글 문장입니다.'
  const 프레임 = await 프레임만들기(텍스트)
  const 헤더 = 헤더읽기(Array.from(프레임.바이트.slice(0, 16)))
  assert.equal(헤더.성공, true)
  if (!헤더.성공) return

  const 청크수 = Math.ceil(헤더.본문길이 / 청크크기)
  assert.equal(청크수 >= 3, true)
  const 손상프레임 = new Uint8Array(프레임.바이트)
  for (let 청크번호 = 0; 청크번호 < 청크수; 청크번호 += 1) {
    데이터청크손상시키기(손상프레임, 헤더.본문길이, 청크번호)
  }

  const 복구 = 프레임복구하기(손상프레임)
  assert.equal(복구.성공, false)
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

test('합성 오디오의 음악 기호를 4개 성부 전체에서 다시 판정한다', () => {
  // 457은 4096과 서로소라 0~4095 전 구간을 골고루 훑어 4개 성부를 모두 검증한다.
  const 원본기호들 = Array.from({ length: 96 }, (_, 순서) => (순서 * 457 + 13) & 기호최대값)
  const 복원기호들 = 오디오에서기호복원하기(원본기호들)
  assert.deepEqual(복원기호들, 원본기호들)
})

test('작은 음량과 잡음이 섞여도 음악 기호를 다시 판정한다', () => {
  const 원본기호들 = Array.from({ length: 48 }, (_, 순서) => (순서 * 457 + 113) & 기호최대값)
  const 복원기호들 = 오디오에서기호복원하기(원본기호들, { 음량: 0.045, 잡음: 0.0025 })
  assert.deepEqual(복원기호들, 원본기호들)
})

test('리버브와 타이밍 오프셋이 섞여도 짧은 텍스트가 복구된다', async () => {
  const 텍스트 = 'Jazzmodem 음향 채널 회귀 테스트 1234.'
  const 프레임 = await 프레임만들기(텍스트)
  const 원본기호들 = 바이트를음악기호로(프레임.바이트)
  const 복원기호들 = 오디오에서기호복원하기(원본기호들, {
    리버브: true,
    음량: 0.3,
    잡음: 0.005,
    시작오프셋: 600,
  })
  const 복원바이트 = Uint8Array.from(음악기호를바이트로(복원기호들).slice(0, 프레임.바이트.length))
  const 복원 = await 텍스트복구하기(복원바이트)
  assert.equal(복원.텍스트, 텍스트)
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

function 오디오에서기호복원하기(
  원본기호들: number[],
  옵션: { 음량?: number; 잡음?: number; 리버브?: boolean; 시작오프셋?: number } = {},
): number[] {
  let 표본들 = 오디오표본만들기(원본기호들, 표본율).표본들
  if (옵션.리버브) 표본들 = 리버브섞기(표본들)
  const 복원기호들: number[] = []
  let 위치 = Math.floor(표본율 * 프리앰블초) + (옵션.시작오프셋 ?? 0)

  for (let 순서 = 0; 순서 < 원본기호들.length; 순서 += 1) {
    const 길이 = Math.round(표본율 * 기호길이초구하기(순서))
    const 창 = 잡음섞기(표본들.slice(위치, 위치 + 길이), 옵션.음량 ?? 1, 옵션.잡음 ?? 0, 순서)
    복원기호들.push(음악기호찾기(창, 표본율, 순서).기호)
    위치 += 길이
  }

  return 복원기호들
}

function 리버브섞기(표본들: Float32Array): Float32Array {
  const 초들 = [0.011, 0.023, 0.041]
  const 이득들 = [0.35, 0.22, 0.13]
  const 결과 = Float32Array.from(표본들)
  for (let 단계 = 0; 단계 < 초들.length; 단계 += 1) {
    const 지연 = Math.floor(초들[단계] * 표본율)
    for (let 순서 = 지연; 순서 < 결과.length; 순서 += 1) {
      결과[순서] += 표본들[순서 - 지연] * 이득들[단계]
    }
  }
  return 결과
}

function 잡음섞기(표본들: Float32Array, 음량: number, 잡음: number, 씨앗: number): Float32Array {
  if (음량 === 1 && 잡음 === 0) return 표본들
  const 결과 = new Float32Array(표본들.length)
  for (let 순서 = 0; 순서 < 표본들.length; 순서 += 1) {
    결과[순서] = 표본들[순서] * 음량 + 의사잡음(씨앗 + 31, 순서) * 잡음
  }
  return 결과
}
