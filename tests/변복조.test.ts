import assert from 'node:assert/strict'
import test from 'node:test'
import {
  바이트를음악기호로,
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

test('반복 청크 중 하나가 깨져도 CRC가 맞는 반복 청크로 복구한다', async () => {
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

  const 복원 = await 텍스트복구하기(손상프레임)
  assert.equal(복원.텍스트, 텍스트)
  assert.equal(복원.복구.성공청크수, 청크수)
})

test('합성 오디오의 음악 기호를 다시 판정한다', () => {
  const 원본기호들 = Array.from({ length: 48 }, (_, 순서) => 순서 % 16)
  const 복원기호들 = 오디오에서기호복원하기(원본기호들)
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

function 오디오에서기호복원하기(원본기호들: number[]): number[] {
  const 표본결과 = 오디오표본만들기(원본기호들, 표본율)
  const 복원기호들: number[] = []
  let 위치 = Math.floor(표본율 * 프리앰블초)

  for (let 순서 = 0; 순서 < 원본기호들.length; 순서 += 1) {
    const 길이 = Math.round(표본율 * 기호길이초구하기(순서))
    const 창 = 표본결과.표본들.slice(위치, 위치 + 길이)
    복원기호들.push(음악기호찾기(창, 표본율, 순서).기호)
    위치 += 길이
  }

  return 복원기호들
}
