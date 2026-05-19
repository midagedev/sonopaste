export type 압축결과 = {
  바이트: Uint8Array
  압축됨: boolean
}

export type 헤더오류키 = '프레임없음' | '미지원프레임' | '헤더오류' | '길이오류'

export type 헤더결과 =
  | {
      성공: true
      본문길이: number
      압축됨: boolean
      반복수: number
    }
  | {
      성공: false
      이유: string
    }

export type 프레임복구결과 =
  | {
      성공: true
      본문: Uint8Array
      헤더: Extract<헤더결과, { 성공: true }>
      청크상태들: 청크상태[]
      성공청크수: number
      전체청크수: number
    }
  | {
      성공: false
      이유: string
      청크상태들: 청크상태[]
      성공청크수: number
      전체청크수: number
    }

export type 청크상태 = '대기' | '성공' | '실패'

type 코드진행마디 = {
  이름: string
  미디음들: readonly number[]
}

type 리듬패턴 = {
  이름: string
  조각들: readonly { 시작: number; 길이: number; 세기: number }[]
  윤곽: readonly number[]
}

export type 오디오표본결과 = {
  표본들: Float32Array
  기호누적초들: Float32Array
}

export const 청크크기 = 64
export const 청크반복 = 3
export const 스윙긴밀리초 = 180
export const 스윙짧은밀리초 = 120
export const 표본율 = 48_000
export const 프리앰블초 = 1
export const 끝표식초 = 0.32
export const 프리앰블주파수 = [1200, 1800] as const
export const 끝표식주파수 = [8600, 9400] as const
export const 마디당기호수 = 8
export const 코드톤수 = 4

const 마법값 = [0x53, 0x4e, 0x50, 0x31] as const
const 버전 = 1
const 재즈모뎀모드 = 2
const 옥타브내림반음 = 12
const 기본오류문구: Record<헤더오류키, string> = {
  프레임없음: '프레임없음',
  미지원프레임: '미지원프레임',
  헤더오류: '헤더오류',
  길이오류: '길이오류',
}
const 재즈코드진행: readonly 코드진행마디[] = [
  { 이름: 'C7', 미디음들: [84, 88, 91, 94] },
  { 이름: 'F7', 미디음들: [89, 93, 96, 99] },
  { 이름: 'C7', 미디음들: [84, 88, 91, 94] },
  { 이름: 'C7', 미디음들: [84, 88, 91, 94] },
  { 이름: 'F7', 미디음들: [89, 93, 96, 99] },
  { 이름: 'F#dim7', 미디음들: [90, 93, 96, 99] },
  { 이름: 'C7', 미디음들: [84, 88, 91, 94] },
  { 이름: 'A7', 미디음들: [93, 97, 100, 103] },
  { 이름: 'Dm7', 미디음들: [86, 89, 93, 96] },
  { 이름: 'G7', 미디음들: [91, 95, 98, 101] },
  { 이름: 'C7', 미디음들: [84, 88, 91, 94] },
  { 이름: 'G7', 미디음들: [91, 95, 98, 101] },
]
const 리듬패턴들: readonly 리듬패턴[] = [
  {
    이름: 'long',
    조각들: [{ 시작: 0, 길이: 0.94, 세기: 1 }],
    윤곽: [1, 0.86, 0.7, 0.29],
  },
  {
    이름: 'swing-short',
    조각들: [{ 시작: 0, 길이: 0.72, 세기: 1 }],
    윤곽: [1, 0.88, 0.34, 0.01],
  },
  {
    이름: 'push',
    조각들: [{ 시작: 0.32, 길이: 0.68, 세기: 0.95 }],
    윤곽: [0, 0.96, 1, 0.57],
  },
  {
    이름: 'double',
    조각들: [
      { 시작: 0, 길이: 0.44, 세기: 0.9 },
      { 시작: 0.56, 길이: 0.44, 세기: 0.78 },
    ],
    윤곽: [1, 0.33, 0.81, 0.43],
  },
]

export async function 프레임만들기(텍스트: string): Promise<{ 바이트: Uint8Array; 청크수: number }> {
  const 원문 = new TextEncoder().encode(텍스트)
  const 압축된값 = await 압축하기(원문)
  const 본문 = 압축된값.바이트
  const 청크들: number[] = []

  for (let 위치 = 0; 위치 < 본문.length; 위치 += 청크크기) {
    const 청크 = 본문.slice(위치, 위치 + 청크크기)
    const 검사합 = 검사합16(청크)
    for (let 반복번호 = 0; 반복번호 < 청크반복; 반복번호 += 1) {
      청크들.push(...청크, 검사합 >> 8, 검사합 & 0xff)
    }
  }

  const 헤더 = new Uint8Array(16)
  헤더.set(마법값, 0)
  헤더[4] = 버전
  헤더[5] = 재즈모뎀모드
  헤더[6] = (본문.length >> 16) & 0xff
  헤더[7] = (본문.length >> 8) & 0xff
  헤더[8] = 본문.length & 0xff
  헤더[9] = 압축된값.압축됨 ? 1 : 0
  헤더[12] = 청크반복
  const 헤더검사합 = 헤더검사합구하기(헤더)
  헤더[10] = (헤더검사합 >> 8) & 0xff
  헤더[11] = 헤더검사합 & 0xff

  const 프레임 = new Uint8Array(헤더.length + 청크들.length)
  프레임.set(헤더, 0)
  프레임.set(청크들, 헤더.length)
  return { 바이트: 프레임, 청크수: Math.ceil(본문.length / 청크크기) }
}

export function 헤더읽기(헤더: number[], 문구찾기: (키: 헤더오류키) => string = (키) => 기본오류문구[키]): 헤더결과 {
  if (!마법값.every((값, 순서) => 헤더[순서] === 값)) {
    return { 성공: false, 이유: 문구찾기('프레임없음') }
  }
  if (헤더[4] !== 버전 || 헤더[5] !== 재즈모뎀모드) {
    return { 성공: false, 이유: 문구찾기('미지원프레임') }
  }
  const 기대검사합 = (헤더[10] << 8) | 헤더[11]
  const 실제검사합 = 헤더검사합구하기(Uint8Array.from(헤더))
  if (기대검사합 !== 실제검사합) {
    return { 성공: false, 이유: 문구찾기('헤더오류') }
  }
  const 본문길이 = (헤더[6] << 16) | (헤더[7] << 8) | 헤더[8]
  if (!본문길이 || 본문길이 > 65_535) {
    return { 성공: false, 이유: 문구찾기('길이오류') }
  }
  return {
    성공: true,
    본문길이,
    압축됨: 헤더[9] === 1,
    반복수: Math.max(1, 헤더[12] || 1),
  }
}

export function 프레임복구하기(
  바이트들: number[] | Uint8Array,
  문구찾기: (키: 헤더오류키) => string = (키) => 기본오류문구[키],
): 프레임복구결과 {
  if (바이트들.length < 16) {
    return { 성공: false, 이유: 문구찾기('프레임없음'), 청크상태들: [], 성공청크수: 0, 전체청크수: 0 }
  }

  const 헤더 = 헤더읽기(Array.from(바이트들.slice(0, 16)), 문구찾기)
  if (!헤더.성공) {
    return { 성공: false, 이유: 헤더.이유, 청크상태들: [], 성공청크수: 0, 전체청크수: 0 }
  }

  const 전체청크수 = Math.ceil(헤더.본문길이 / 청크크기)
  const 청크지도 = new Map<number, number[]>()
  const 청크상태들: 청크상태[] = Array.from({ length: 전체청크수 }, () => '실패')
  let 위치 = 16

  for (let 청크번호 = 0; 청크번호 < 전체청크수; 청크번호 += 1) {
    const 남은크기 = 헤더.본문길이 - 청크번호 * 청크크기
    const 길이 = Math.min(청크크기, 남은크기)
    for (let 반복번호 = 0; 반복번호 < 헤더.반복수; 반복번호 += 1) {
      if (위치 + 길이 + 2 > 바이트들.length) {
        return {
          성공: false,
          이유: 문구찾기('길이오류'),
          청크상태들,
          성공청크수: 청크지도.size,
          전체청크수,
        }
      }
      const 청크 = Array.from(바이트들.slice(위치, 위치 + 길이))
      const 기대검사합 = (바이트들[위치 + 길이] << 8) | 바이트들[위치 + 길이 + 1]
      const 실제검사합 = 검사합16(new Uint8Array(청크))
      위치 += 길이 + 2
      if (실제검사합 === 기대검사합 && !청크지도.has(청크번호)) {
        청크지도.set(청크번호, 청크)
        청크상태들[청크번호] = '성공'
      }
    }
  }

  if (청크지도.size !== 전체청크수) {
    return {
      성공: false,
      이유: '청크실패',
      청크상태들,
      성공청크수: 청크지도.size,
      전체청크수,
    }
  }

  const 본문: number[] = []
  for (let 청크번호 = 0; 청크번호 < 전체청크수; 청크번호 += 1) {
    본문.push(...(청크지도.get(청크번호) ?? []))
  }

  return {
    성공: true,
    본문: new Uint8Array(본문),
    헤더,
    청크상태들,
    성공청크수: 청크지도.size,
    전체청크수,
  }
}

export async function 텍스트복구하기(
  바이트들: number[] | Uint8Array,
  문구찾기: (키: 헤더오류키) => string = (키) => 기본오류문구[키],
): Promise<{ 텍스트: string; 복구: Extract<프레임복구결과, { 성공: true }> }> {
  const 복구 = 프레임복구하기(바이트들, 문구찾기)
  if (!복구.성공) throw new Error(복구.이유)
  const 원문 = await 압축풀기(복구.본문, 복구.헤더.압축됨)
  return { 텍스트: new TextDecoder().decode(원문), 복구 }
}

export function 바이트를음악기호로(바이트들: Uint8Array): number[] {
  const 기호들: number[] = []
  for (const 바이트 of 바이트들) {
    기호들.push((바이트 >> 4) & 0x0f, 바이트 & 0x0f)
  }
  return 기호들
}

export function 음악기호를바이트로(기호들: number[]): number[] {
  const 바이트들: number[] = []
  for (let 순서 = 0; 순서 + 1 < 기호들.length; 순서 += 2) {
    바이트들.push(((기호들[순서] & 0x0f) << 4) | (기호들[순서 + 1] & 0x0f))
  }
  return 바이트들
}

export function 오디오표본만들기(기호들: number[], 출력표본율 = 표본율): 오디오표본결과 {
  const 프리앰블표본수 = Math.floor(출력표본율 * 프리앰블초)
  const 기호누적초들 = 기호누적초들만들기(기호들.length)
  const 본문표본수 = Math.floor(출력표본율 * 기호누적초들[기호누적초들.length - 1])
  const 끝표식표본수 = Math.floor(출력표본율 * 끝표식초)
  const 표본들 = new Float32Array(프리앰블표본수 + 본문표본수 + 끝표식표본수)
  let 위치 = 0

  for (let 순서 = 0; 순서 < 10; 순서 += 1) {
    위치 = 제어톤쓰기(표본들, 위치, 출력표본율, 프리앰블주파수[순서 % 2], 프리앰블표본수 / 10)
  }

  for (let 순서 = 0; 순서 < 기호들.length; 순서 += 1) {
    const 기호표본수 = Math.round(출력표본율 * 기호길이초구하기(순서))
    위치 = 음악기호쓰기(표본들, 위치, 출력표본율, 기호들[순서], 기호표본수, 순서)
  }

  for (let 순서 = 0; 순서 < 4; 순서 += 1) {
    위치 = 제어톤쓰기(표본들, 위치, 출력표본율, 끝표식주파수[순서 % 2], 끝표식표본수 / 4)
  }

  버퍼부드럽게제한하기(표본들)
  return { 표본들, 기호누적초들 }
}

export function 음악기호찾기(
  표본들: Float32Array,
  입력표본율: number,
  기호순서: number,
): { 기호: number; 신호대잡음: number } {
  const 에너지들 = 코드톤주파수들구하기(기호순서).map((주파수) => 괴르첼(표본들, 입력표본율, 주파수))
  let 최고 = 0
  let 차점 = 0
  for (const 에너지 of 에너지들) {
    if (에너지 > 최고) {
      차점 = 최고
      최고 = 에너지
    } else if (에너지 > 차점) {
      차점 = 에너지
    }
  }
  const 피치번호 = Math.max(0, 에너지들.indexOf(최고))
  const 리듬번호 = 리듬찾기(표본들)
  const 기호 = (피치번호 << 2) | 리듬번호
  const 신호대잡음 = 10 * Math.log10((최고 + 1e-12) / (차점 + 1e-12))
  return { 기호, 신호대잡음 }
}

export function 검사합16(바이트들: Uint8Array): number {
  let 검사합 = 0xffff
  for (const 바이트 of 바이트들) {
    검사합 ^= 바이트 << 8
    for (let 비트 = 0; 비트 < 8; 비트 += 1) {
      검사합 = 검사합 & 0x8000 ? (검사합 << 1) ^ 0x1021 : 검사합 << 1
      검사합 &= 0xffff
    }
  }
  return 검사합
}

export function 반복청크바이트수구하기(본문길이: number, 청크수: number, 반복수: number): number {
  let 합계 = 0
  for (let 청크번호 = 0; 청크번호 < 청크수; 청크번호 += 1) {
    const 남은크기 = 본문길이 - 청크번호 * 청크크기
    const 길이 = Math.min(청크크기, 남은크기)
    합계 += (길이 + 2) * 반복수
  }
  return 합계
}

export function 기호길이초구하기(기호순서: number): number {
  const 밀리초 = 기호순서 % 2 === 0 ? 스윙긴밀리초 : 스윙짧은밀리초
  return 밀리초 / 1000
}

export function 기호시간초구하기(기호수: number): number {
  const 쌍수 = Math.floor(기호수 / 2)
  const 나머지 = 기호수 % 2
  const 남는시간 = 나머지 ? 기호길이초구하기(기호수 - 1) : 0
  return 쌍수 * ((스윙긴밀리초 + 스윙짧은밀리초) / 1000) + 남는시간
}

export function 기호구간시간초구하기(시작기호: number, 끝기호: number): number {
  return Math.max(0, 기호시간초구하기(끝기호) - 기호시간초구하기(시작기호))
}

export function 기호누적초들만들기(기호수: number): Float32Array {
  const 누적초들 = new Float32Array(기호수 + 1)
  for (let 순서 = 0; 순서 < 기호수; 순서 += 1) {
    누적초들[순서 + 1] = 누적초들[순서] + 기호길이초구하기(순서)
  }
  return 누적초들
}

export function 기호위치찾기(누적초들: Float32Array, 지난초: number): number {
  if (지난초 <= 0) return 0
  let 왼쪽 = 0
  let 오른쪽 = 누적초들.length - 1
  while (왼쪽 < 오른쪽) {
    const 가운데 = Math.floor((왼쪽 + 오른쪽 + 1) / 2)
    if (누적초들[가운데] <= 지난초) {
      왼쪽 = 가운데
    } else {
      오른쪽 = 가운데 - 1
    }
  }
  return Math.min(왼쪽, 누적초들.length - 1)
}

export function 코드톤주파수들구하기(기호순서: number): number[] {
  const 마디번호 = Math.floor(기호순서 / 마디당기호수) % 재즈코드진행.length
  return 재즈코드진행[마디번호].미디음들.map((미디음) => 미디를주파수로(미디음 - 옥타브내림반음))
}

export async function 압축하기(원문: Uint8Array): Promise<압축결과> {
  if (!('CompressionStream' in globalThis)) {
    return { 바이트: 원문, 압축됨: false }
  }

  try {
    const 압축바이트 = await 스트림변환하기(원문, new CompressionStream('deflate'))
    if (압축바이트.length < 원문.length) {
      return { 바이트: 압축바이트, 압축됨: true }
    }
  } catch {
    return { 바이트: 원문, 압축됨: false }
  }

  return { 바이트: 원문, 압축됨: false }
}

export async function 압축풀기(본문: Uint8Array, 압축됨: boolean): Promise<Uint8Array> {
  if (!압축됨) return 본문
  if (!('DecompressionStream' in globalThis)) {
    throw new Error('압축 해제 불가')
  }
  return 스트림변환하기(본문, new DecompressionStream('deflate'))
}

function 제어톤쓰기(
  채널: Float32Array,
  위치: number,
  출력표본율: number,
  주파수: number,
  표본수: number,
): number {
  const 개수 = Math.floor(표본수)
  for (let 순서 = 0; 순서 < 개수 && 위치 + 순서 < 채널.length; 순서 += 1) {
    const 상대초 = 순서 / 출력표본율
    const 포락선 = Math.min(1, 순서 / 128, (개수 - 순서) / 128)
    채널[위치 + 순서] += Math.sin(2 * Math.PI * 주파수 * 상대초) * 포락선 * 0.72
  }
  return 위치 + 개수
}

function 음악기호쓰기(
  채널: Float32Array,
  위치: number,
  출력표본율: number,
  기호: number,
  표본수: number,
  기호순서: number,
): number {
  const 피치번호 = (기호 >> 2) & 0b11
  const 리듬번호 = 기호 & 0b11
  const 주파수 = 코드톤주파수들구하기(기호순서)[피치번호]
  const 패턴 = 리듬패턴들[리듬번호]
  const 강세 = 기호강세구하기(기호순서)

  if (기호순서 % 마디당기호수 === 0 || 기호순서 % 마디당기호수 === 5) {
    화음깔기(채널, 위치, 출력표본율, 표본수, 기호순서)
  }

  for (const 조각 of 패턴.조각들) {
    const 시작 = 위치 + Math.floor(표본수 * 조각.시작)
    const 길이 = Math.max(96, Math.floor(표본수 * 조각.길이))
    음표더하기(채널, 시작, 출력표본율, 주파수, 길이, 강세 * 조각.세기, 기호순서)
  }

  return 위치 + 표본수
}

function 음표더하기(
  채널: Float32Array,
  위치: number,
  출력표본율: number,
  주파수: number,
  표본수: number,
  세기: number,
  씨앗: number,
): void {
  const 전체초 = 표본수 / 출력표본율
  for (let 순서 = 0; 순서 < 표본수 && 위치 + 순서 < 채널.length; 순서 += 1) {
    const 상대초 = 순서 / 출력표본율
    const 포락선 = 피아노포락선구하기(상대초, 전체초)
    채널[위치 + 순서] += 피아노파형구하기(주파수, 상대초, 씨앗) * 포락선 * 세기 * 0.62
  }
}

function 화음깔기(
  채널: Float32Array,
  위치: number,
  출력표본율: number,
  표본수: number,
  기호순서: number,
): void {
  const 코드톤들 = 코드톤주파수들구하기(기호순서)
  const 길이 = Math.floor(표본수 * 0.86)
  for (let 순서 = 0; 순서 < 코드톤들.length; 순서 += 1) {
    음표더하기(채널, 위치, 출력표본율, 코드톤들[순서] / 2, 길이, 0.07, 기호순서 + 순서 * 17)
  }
}

function 피아노파형구하기(주파수: number, 상대초: number, 씨앗: number): number {
  const 흔들림 = 1 + 0.0018 * Math.sin(2 * Math.PI * (3.1 + (씨앗 % 5) * 0.13) * 상대초)
  const 망치소리 = 의사잡음(씨앗, Math.floor(상대초 * 9000)) * Math.exp(-상대초 * 170) * 0.08
  const 기본 = Math.sin(2 * Math.PI * 주파수 * 흔들림 * 상대초) * 0.78
  const 배음2 = Math.sin(2 * Math.PI * 주파수 * 2.002 * 상대초 + 0.11) * 0.23 * Math.exp(-상대초 * 2.3)
  const 배음3 = Math.sin(2 * Math.PI * 주파수 * 3.006 * 상대초 + 0.31) * 0.12 * Math.exp(-상대초 * 4.1)
  const 배음4 = Math.sin(2 * Math.PI * 주파수 * 4.01 * 상대초 + 0.53) * 0.045 * Math.exp(-상대초 * 6.2)
  return Math.tanh(기본 + 배음2 + 배음3 + 배음4 + 망치소리)
}

function 피아노포락선구하기(상대초: number, 전체초: number): number {
  const 어택 = Math.min(1, 상대초 / 0.004)
  const 감쇠 = 0.22 + 0.78 * Math.exp(-상대초 * 6.4)
  const 릴리스 = Math.min(1, Math.max(0, (전체초 - 상대초) / 0.038))
  return 어택 * 감쇠 * 릴리스
}

function 버퍼부드럽게제한하기(채널: Float32Array): void {
  for (let 순서 = 0; 순서 < 채널.length; 순서 += 1) {
    채널[순서] = Math.tanh(채널[순서] * 1.35) * 0.86
  }
}

export function 의사잡음(씨앗: number, 눈금: number): number {
  const 값 = Math.sin((씨앗 + 1) * 12.9898 + 눈금 * 78.233) * 43758.5453
  return 값 - Math.floor(값) - 0.5
}

function 리듬찾기(표본들: Float32Array): number {
  const 구간수 = 4
  const 구간값들 = Array.from({ length: 구간수 }, (_, 순서) => {
    const 시작 = Math.floor((표본들.length * 순서) / 구간수)
    const 끝 = Math.floor((표본들.length * (순서 + 1)) / 구간수)
    let 합계 = 0
    for (let 위치 = 시작; 위치 < 끝; 위치 += 1) {
      합계 += 표본들[위치] * 표본들[위치]
    }
    return Math.sqrt(합계 / Math.max(1, 끝 - 시작))
  })
  const 최대값 = Math.max(...구간값들, 1e-9)
  const 윤곽 = 구간값들.map((값) => 값 / 최대값)
  let 최고번호 = 0
  let 최고점수 = Number.POSITIVE_INFINITY
  for (let 번호 = 0; 번호 < 리듬패턴들.length; 번호 += 1) {
    const 후보 = 리듬패턴들[번호].윤곽
    const 점수 = 후보.reduce((합계, 값, 순서) => 합계 + (값 - 윤곽[순서]) ** 2, 0)
    if (점수 < 최고점수) {
      최고점수 = 점수
      최고번호 = 번호
    }
  }
  return 최고번호
}

export function 괴르첼(표본들: Float32Array, 입력표본율: number, 주파수: number): number {
  const 오메가 = (2 * Math.PI * 주파수) / 입력표본율
  const 계수 = 2 * Math.cos(오메가)
  let 현재값 = 0
  let 이전값 = 0
  let 전전값 = 0

  for (const 표본 of 표본들) {
    현재값 = 계수 * 이전값 - 전전값 + 표본
    전전값 = 이전값
    이전값 = 현재값
  }

  return 이전값 * 이전값 + 전전값 * 전전값 - 계수 * 이전값 * 전전값
}

function 헤더검사합구하기(헤더: Uint8Array): number {
  const 검사대상 = new Uint8Array(14)
  검사대상.set(헤더.slice(0, 10), 0)
  검사대상.set(헤더.slice(12, 16), 10)
  return 검사합16(검사대상)
}

function 미디를주파수로(미디음: number): number {
  return 440 * 2 ** ((미디음 - 69) / 12)
}

function 기호강세구하기(기호순서: number): number {
  const 박위치 = 기호순서 % 마디당기호수
  if (박위치 === 0) return 1
  if (박위치 === 4) return 0.88
  if (박위치 % 2 === 1) return 0.72
  return 0.8
}

async function 스트림변환하기(바이트들: Uint8Array, 변환: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const 복사본 = new Uint8Array(바이트들.length)
  복사본.set(바이트들)
  const 흐름 = new Blob([복사본.buffer]).stream().pipeThrough(변환)
  const 응답 = new Response(흐름)
  return new Uint8Array(await 응답.arrayBuffer())
}
