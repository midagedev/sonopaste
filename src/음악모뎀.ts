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
      헤더?: Extract<헤더결과, { 성공: true }>
      청크상태들: 청크상태[]
      성공청크수: number
      전체청크수: number
    }

export type 청크상태 = '대기' | '성공' | '실패'

export type 부분프레임결과 =
  | {
      성공: true
      헤더: Extract<헤더결과, { 성공: true }>
      청크상태들: 청크상태[]
      청크들: (number[] | null)[]
      성공청크수: number
      전체청크수: number
      전체프레임바이트: number
      완료됨: boolean
    }
  | {
      성공: false
      이유: string
      헤더?: Extract<헤더결과, { 성공: true }>
      청크상태들: 청크상태[]
      청크들: (number[] | null)[]
      성공청크수: number
      전체청크수: number
      전체프레임바이트: number
      완료됨: boolean
    }

type 코드진행마디 = {
  박: number
  근음: 음이름
  종류: 코드종류
}

type 리듬사건 = {
  시작비율: number
  길이비율: number
  세기: number
}

type 리듬패턴 = {
  이름: string
  릴리스: number
  지속: number
  사건들: readonly 리듬사건[]
}

type 음이름 = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B'
type 코드종류 = 'dom13' | 'dom13b9' | 'domAlt' | 'min9' | 'halfDim' | 'dim7' | 'sixNine' | 'sus13'

export type 오디오표본결과 = {
  표본들: Float32Array
  기호누적초들: Float32Array
}

export const 청크크기 = 64
export const 청크반복 = 1
export const 템포 = 138
export const 표본율 = 48_000
export const 프리앰블초 = 1
export const 끝표식초 = 0.32
export const 프리앰블주파수 = [1200, 1800] as const
export const 끝표식주파수 = [8600, 9400] as const
export const 박초 = 60 / 템포
export const 코드톤수 = 8
export const 기호비트수 = 6

const 마법값 = [0x53, 0x4e, 0x50, 0x31] as const
const 버전 = 1
const 재즈모뎀모드 = 5
const 음이름값: Record<음이름, number> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
const 기호마스크 = 0b11_1111
const 마디당박수 = 4
const 셀자리박들 = [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66] as const
const 보이싱상성부간격들 = [24, 26, 28, 31, 33, 35, 38, 40] as const
const 세부윤곽구간수 = 12
const 화음펼침초 = 0.0035
const 상성부강조값 = 2.7
const 세부기대윤곽저장소 = new Map<string, number[]>()
export const 마디당기호수 = 셀자리박들.length
const 기본오류문구: Record<헤더오류키, string> = {
  프레임없음: '프레임없음',
  미지원프레임: '미지원프레임',
  헤더오류: '헤더오류',
  길이오류: '길이오류',
}
const 재즈코드진행: readonly (readonly 코드진행마디[])[] = [
  [{ 박: 0, 근음: 'C', 종류: 'dom13' }],
  [{ 박: 0, 근음: 'F', 종류: 'dom13' }],
  [{ 박: 0, 근음: 'C', 종류: 'dom13' }],
  [
    { 박: 0, 근음: 'G', 종류: 'min9' },
    { 박: 2, 근음: 'C', 종류: 'domAlt' },
  ],
  [{ 박: 0, 근음: 'F', 종류: 'dom13' }],
  [{ 박: 0, 근음: 'Gb', 종류: 'dim7' }],
  [
    { 박: 0, 근음: 'C', 종류: 'dom13' },
    { 박: 2, 근음: 'A', 종류: 'domAlt' },
  ],
  [
    { 박: 0, 근음: 'D', 종류: 'min9' },
    { 박: 2, 근음: 'G', 종류: 'dom13b9' },
  ],
  [
    { 박: 0, 근음: 'E', 종류: 'halfDim' },
    { 박: 2, 근음: 'A', 종류: 'domAlt' },
  ],
  [
    { 박: 0, 근음: 'D', 종류: 'min9' },
    { 박: 2, 근음: 'G', 종류: 'dom13b9' },
  ],
  [
    { 박: 0, 근음: 'C', 종류: 'sixNine' },
    { 박: 2, 근음: 'A', 종류: 'domAlt' },
  ],
  [
    { 박: 0, 근음: 'D', 종류: 'min9' },
    { 박: 2, 근음: 'G', 종류: 'sus13' },
  ],
]
const 보이싱사전: Record<코드종류, readonly (readonly number[])[]> = {
  dom13: [
    [3, 10, 14, 21],
    [10, 14, 16, 21],
    [3, 10, 18, 21],
    [10, 16, 18, 21],
    [3, 9, 14, 22],
    [10, 14, 21, 28],
    [3, 10, 13, 20],
    [10, 15, 18, 21],
  ],
  dom13b9: [
    [3, 10, 13, 21],
    [10, 13, 16, 21],
    [3, 10, 13, 20],
    [10, 13, 18, 21],
    [3, 10, 15, 20],
    [10, 13, 21, 27],
    [3, 9, 13, 20],
    [10, 16, 20, 25],
  ],
  domAlt: [
    [3, 10, 13, 20],
    [3, 10, 15, 20],
    [10, 13, 16, 20],
    [3, 10, 13, 18],
    [10, 15, 20, 25],
    [3, 10, 16, 22],
    [10, 13, 18, 22],
    [3, 10, 15, 25],
  ],
  min9: [
    [3, 10, 14, 17],
    [10, 14, 15, 17],
    [3, 10, 14, 21],
    [10, 15, 17, 21],
    [3, 7, 10, 14],
    [10, 14, 17, 24],
    [3, 10, 17, 21],
    [7, 10, 14, 17],
  ],
  halfDim: [
    [3, 6, 10, 17],
    [10, 15, 18, 21],
    [3, 10, 13, 18],
    [6, 10, 15, 20],
    [3, 6, 10, 14],
    [10, 13, 18, 22],
    [6, 10, 17, 20],
    [3, 10, 15, 18],
  ],
  dim7: [
    [0, 3, 6, 9],
    [3, 6, 9, 12],
    [6, 9, 12, 15],
    [9, 12, 15, 18],
    [0, 6, 9, 15],
    [3, 9, 12, 18],
    [0, 3, 9, 15],
    [6, 12, 15, 21],
  ],
  sixNine: [
    [4, 9, 14, 19],
    [9, 14, 16, 19],
    [4, 7, 14, 21],
    [9, 14, 19, 24],
    [4, 11, 14, 21],
    [7, 9, 14, 16],
    [4, 9, 16, 21],
    [11, 14, 16, 21],
  ],
  sus13: [
    [5, 10, 14, 21],
    [10, 14, 17, 21],
    [5, 10, 14, 19],
    [10, 17, 21, 26],
    [5, 9, 14, 21],
    [10, 14, 21, 24],
    [5, 10, 17, 21],
    [10, 14, 19, 21],
  ],
}
const 리듬패턴들: readonly 리듬패턴[] = [
  { 이름: 'laid-short', 릴리스: 0.04, 지속: 0.06, 사건들: [{ 시작비율: 0.13, 길이비율: 0.36, 세기: 1.08 }] },
  { 이름: 'laid-medium', 릴리스: 0.06, 지속: 0.08, 사건들: [{ 시작비율: 0.13, 길이비율: 0.46, 세기: 1 }] },
  { 이름: 'laid-long', 릴리스: 0.12, 지속: 0.16, 사건들: [{ 시작비율: 0.13, 길이비율: 0.88, 세기: 0.93 }] },
  { 이름: 'held', 릴리스: 0.22, 지속: 0.25, 사건들: [{ 시작비율: 0, 길이비율: 0.99, 세기: 0.86 }] },
  { 이름: 'push-short', 릴리스: 0.04, 지속: 0.06, 사건들: [{ 시작비율: 0, 길이비율: 0.3, 세기: 1.08 }] },
  {
    이름: 'push-echo',
    릴리스: 0.05,
    지속: 0.07,
    사건들: [
      { 시작비율: 0, 길이비율: 0.24, 세기: 0.96 },
      { 시작비율: 0.5, 길이비율: 0.25, 세기: 0.9 },
    ],
  },
  { 이름: 'late-stab', 릴리스: 0.06, 지속: 0.08, 사건들: [{ 시작비율: 0.36, 길이비율: 0.46, 세기: 1.04 }] },
  {
    이름: 'late-double',
    릴리스: 0.05,
    지속: 0.07,
    사건들: [
      { 시작비율: 0.24, 길이비율: 0.25, 세기: 0.92 },
      { 시작비율: 0.66, 길이비율: 0.24, 세기: 0.86 },
    ],
  },
]

export async function 프레임만들기(텍스트: string): Promise<{ 바이트: Uint8Array; 청크수: number }> {
  const 원문 = new TextEncoder().encode(텍스트)
  const 본문값 = 전송본문만들기(원문)
  const 본문 = 본문값.바이트
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
  헤더[9] = 본문값.압축됨 ? 1 : 0
  헤더[12] = 청크반복
  const 헤더검사합 = 헤더검사합구하기(헤더)
  헤더[10] = (헤더검사합 >> 8) & 0xff
  헤더[11] = 헤더검사합 & 0xff

  const 프레임 = new Uint8Array(헤더.length + 청크들.length)
  프레임.set(헤더, 0)
  프레임.set(청크들, 헤더.length)
  return { 바이트: 프레임, 청크수: Math.ceil(본문.length / 청크크기) }
}

export function 전송본문만들기(원문: Uint8Array): 압축결과 {
  return { 바이트: 원문, 압축됨: false }
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

export function 부분프레임읽기(
  바이트들: number[] | Uint8Array,
  문구찾기: (키: 헤더오류키) => string = (키) => 기본오류문구[키],
): 부분프레임결과 {
  if (바이트들.length < 16) {
    return {
      성공: false,
      이유: 문구찾기('프레임없음'),
      청크상태들: [],
      청크들: [],
      성공청크수: 0,
      전체청크수: 0,
      전체프레임바이트: 16,
      완료됨: false,
    }
  }

  const 헤더 = 헤더읽기(Array.from(바이트들.slice(0, 16)), 문구찾기)
  if (!헤더.성공) {
    return {
      성공: false,
      이유: 헤더.이유,
      청크상태들: [],
      청크들: [],
      성공청크수: 0,
      전체청크수: 0,
      전체프레임바이트: 16,
      완료됨: false,
    }
  }

  const 전체청크수 = Math.ceil(헤더.본문길이 / 청크크기)
  const 전체프레임바이트 = 16 + 반복청크바이트수구하기(헤더.본문길이, 전체청크수, 헤더.반복수)
  const 청크들: (number[] | null)[] = Array.from({ length: 전체청크수 }, () => null)
  const 청크상태들: 청크상태[] = Array.from({ length: 전체청크수 }, () => '대기')
  let 위치 = 16

  for (let 청크번호 = 0; 청크번호 < 전체청크수; 청크번호 += 1) {
    const 남은크기 = 헤더.본문길이 - 청크번호 * 청크크기
    const 길이 = Math.min(청크크기, 남은크기)
    let 청크완료 = false
    let 청크성공 = false

    for (let 반복번호 = 0; 반복번호 < 헤더.반복수; 반복번호 += 1) {
      if (위치 + 길이 + 2 > 바이트들.length) {
        return 부분프레임결과만들기(헤더, 청크상태들, 청크들, 전체프레임바이트, 바이트들.length >= 전체프레임바이트)
      }

      청크완료 = true
      const 청크 = Array.from(바이트들.slice(위치, 위치 + 길이))
      const 기대검사합 = (바이트들[위치 + 길이] << 8) | 바이트들[위치 + 길이 + 1]
      const 실제검사합 = 검사합16(new Uint8Array(청크))
      위치 += 길이 + 2

      if (실제검사합 === 기대검사합 && !청크성공) {
        청크들[청크번호] = 청크
        청크상태들[청크번호] = '성공'
        청크성공 = true
      }
    }

    if (청크완료 && !청크성공) {
      청크상태들[청크번호] = '실패'
    }
  }

  return 부분프레임결과만들기(헤더, 청크상태들, 청크들, 전체프레임바이트, 바이트들.length >= 전체프레임바이트)
}

function 부분프레임결과만들기(
  헤더: Extract<헤더결과, { 성공: true }>,
  청크상태들: 청크상태[],
  청크들: (number[] | null)[],
  전체프레임바이트: number,
  완료됨: boolean,
): 부분프레임결과 {
  const 성공청크수 = 청크상태들.filter((상태) => 상태 === '성공').length
  const 전체청크수 = 청크상태들.length
  const 성공 = !완료됨 || 성공청크수 === 전체청크수

  if (!성공) {
    return {
      성공: false,
      이유: '청크실패',
      헤더,
      청크상태들,
      청크들,
      성공청크수,
      전체청크수,
      전체프레임바이트,
      완료됨,
    }
  }

  return {
    성공: true,
    헤더,
    청크상태들,
    청크들,
    성공청크수,
    전체청크수,
    전체프레임바이트,
    완료됨,
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
  let 누산값 = 0
  let 비트수 = 0
  for (const 바이트 of 바이트들) {
    누산값 = (누산값 << 8) | 바이트
    비트수 += 8
    while (비트수 >= 기호비트수) {
      비트수 -= 기호비트수
      기호들.push((누산값 >> 비트수) & 기호마스크)
    }
  }
  if (비트수) 기호들.push((누산값 << (기호비트수 - 비트수)) & 기호마스크)
  return 기호들
}

export function 음악기호를바이트로(기호들: number[]): number[] {
  const 바이트들: number[] = []
  let 누산값 = 0
  let 비트수 = 0
  for (const 기호 of 기호들) {
    누산값 = (누산값 << 기호비트수) | (기호 & 기호마스크)
    비트수 += 기호비트수
    while (비트수 >= 8) {
      비트수 -= 8
      바이트들.push((누산값 >> 비트수) & 0xff)
    }
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

  버퍼부드럽게제한하기(표본들, 출력표본율)
  return { 표본들, 기호누적초들 }
}

export function 음악기호찾기(
  표본들: Float32Array,
  입력표본율: number,
  기호순서: number,
): { 기호: number; 신호대잡음: number } {
  const 에너지들 = Array.from({ length: 코드톤수 }, (_, 보이싱번호) =>
    코드톤점수구하기(표본들, 입력표본율, 기호순서, 보이싱번호),
  )
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
  const 보이싱번호 = Math.max(0, 에너지들.indexOf(최고))
  const { 기호 } = 기호세부찾기(표본들, 입력표본율, 기호순서, [보이싱번호])
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
  const 셀번호 = 기호순서 % 마디당기호수
  const 현재박 = 셀자리박들[셀번호]
  const 다음박 = 셀번호 + 1 < 마디당기호수 ? 셀자리박들[셀번호 + 1] : 마디당박수 + 셀자리박들[0]
  return (다음박 - 현재박) * 박초
}

export function 기호시간초구하기(기호수: number): number {
  const 온전한마디수 = Math.floor(기호수 / 마디당기호수)
  const 나머지 = 기호수 % 마디당기호수
  let 초 = 온전한마디수 * 마디당박수 * 박초
  for (let 순서 = 0; 순서 < 나머지; 순서 += 1) {
    초 += 기호길이초구하기(순서)
  }
  return 초
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

export function 코드톤주파수들구하기(기호순서: number, 보이싱번호 = 0): number[] {
  return 보이싱미디음들구하기(기호순서, 보이싱번호).map(미디를주파수로)
}

function 코드톤점수구하기(표본들: Float32Array, 입력표본율: number, 기호순서: number, 보이싱번호: number): number {
  const 주파수들 = 코드톤주파수들구하기(기호순서, 보이싱번호).sort((왼쪽, 오른쪽) => 왼쪽 - 오른쪽)
  let 합계 = 0
  let 가중합 = 0
  for (let 순서 = 0; 순서 < 주파수들.length; 순서 += 1) {
    const 끝거리 = 주파수들.length - 1 - 순서
    const 가중치 = 끝거리 === 0 ? 8 : 끝거리 === 1 ? 0.55 : 0.22
    합계 += 정규화괴르첼(표본들, 입력표본율, 주파수들[순서]) * 가중치
    가중합 += 가중치 * 가중치
  }
  return 합계 / Math.sqrt(가중합) + 상성부구간피크구하기(표본들, 입력표본율, 주파수들[주파수들.length - 1]) * 5
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
  const 보이싱번호 = 기호 & 0b111
  const 리듬번호 = (기호 >> 3) & 0b111
  const 슬롯초 = 표본수 / 출력표본율
  const 리듬패턴 = 리듬패턴들[리듬번호]
  const 강세 = 기호강세구하기(기호순서)
  const 보이싱 = 보이싱미디음들구하기(기호순서, 보이싱번호)
  const 셀번호 = 기호순서 % 마디당기호수

  if (셀번호 % 2 === 0) {
    베이스깔기(채널, 위치, 출력표본율, 표본수, 기호순서)
  }

  for (let 사건번호 = 0; 사건번호 < 리듬패턴.사건들.length; 사건번호 += 1) {
    const 사건 = 리듬패턴.사건들[사건번호]
    const 시작초 = 슬롯초 * 사건.시작비율
    const 길이초 = Math.max(0.08, 슬롯초 * 사건.길이비율)
    const 시작 = 위치 + Math.floor(시작초 * 출력표본율)
    const 길이 = Math.max(96, Math.floor(Math.min(길이초, 슬롯초 - 시작초) * 출력표본율))

    for (let 순서 = 0; 순서 < 보이싱.length; 순서 += 1) {
      const 상성부강조 = 순서 === 보이싱.length - 1 ? 상성부강조값 : 순서 === 보이싱.length - 2 ? 1.12 : 1
      음표더하기(
        채널,
        시작 + Math.floor(순서 * 화음펼침초 * 출력표본율),
        출력표본율,
        보이싱[순서],
        길이,
        강세 * 사건.세기 * (0.34 - 순서 * 0.014) * 상성부강조,
        기호순서 * 19 + 사건번호 * 7 + 순서,
        리듬패턴.릴리스,
        리듬패턴.지속,
      )
    }
  }

  return 위치 + 표본수
}

function 음표더하기(
  채널: Float32Array,
  위치: number,
  출력표본율: number,
  미디음: number,
  표본수: number,
  세기: number,
  씨앗: number,
  릴리스: number,
  지속: number,
): void {
  const 전체초 = 표본수 / 출력표본율
  const 주파수 = 미디를주파수로(미디음)
  for (let 순서 = 0; 순서 < 표본수 && 위치 + 순서 < 채널.length; 순서 += 1) {
    if (위치 + 순서 < 0) continue
    const 상대초 = 순서 / 출력표본율
    const 포락선 = 피아노포락선구하기(상대초, 전체초, 릴리스, 지속)
    채널[위치 + 순서] += 피아노파형구하기(주파수, 상대초, 씨앗) * 포락선 * 세기 * 0.78
  }
}

function 베이스깔기(
  채널: Float32Array,
  위치: number,
  출력표본율: number,
  표본수: number,
  기호순서: number,
): void {
  const 코드 = 코드찾기(기호순서)
  const 베이스 = 근음미디구하기(코드.근음) - 12
  const 셀번호 = 기호순서 % 마디당기호수
  const 보조음 = 베이스 + (Math.floor(셀번호 / 2) % 2 ? 7 : 0)
  const 길이 = Math.floor(표본수 * 0.78)
  음표더하기(채널, 위치, 출력표본율, 보조음, 길이, 셀번호 === 0 ? 0.18 : 0.12, 기호순서 * 11, 0.16, 0.12)
}

function 피아노파형구하기(주파수: number, 상대초: number, 씨앗: number): number {
  const 줄흔들림들 = [-0.0015, 0.0002, 0.0017]
  const 배음세기들 = [0.82, 0.36, 0.2, 0.11, 0.065, 0.038]
  let 합계 = 0

  for (let 줄번호 = 0; 줄번호 < 줄흔들림들.length; 줄번호 += 1) {
    const 줄보정 = 1 + 줄흔들림들[줄번호] + 0.0008 * Math.sin(2 * Math.PI * (2.2 + 줄번호 * 0.31) * 상대초)
    for (let 배음번호 = 1; 배음번호 <= 배음세기들.length; 배음번호 += 1) {
      const 휨 = 배음번호 + 배음번호 * 배음번호 * 0.0007
      const 세기 = 배음세기들[배음번호 - 1] * Math.exp(-상대초 * (0.75 + 배음번호 * 1.35))
      const 위상 = 씨앗 * 0.017 + 줄번호 * 0.41 + 배음번호 * 0.19
      합계 += Math.sin(2 * Math.PI * 주파수 * 휨 * 줄보정 * 상대초 + 위상) * 세기
    }
  }

  const 망치소리 = 의사잡음(씨앗, Math.floor(상대초 * 12_000)) * Math.exp(-상대초 * 360) * 0.035
  const 울림판 = Math.sin(2 * Math.PI * 주파수 * 0.5 * 상대초 + 0.2) * Math.exp(-상대초 * 1.8) * 0.035
  return Math.tanh(합계 / 줄흔들림들.length + 망치소리 + 울림판)
}

function 피아노포락선구하기(상대초: number, 전체초: number, 릴리스초: number, 지속: number): number {
  const 어택 = Math.min(1, 상대초 / 0.0035)
  const 감쇠 = 지속 + (1 - 지속) * Math.exp(-상대초 * 7.4)
  const 릴리스 = Math.min(1, Math.max(0, (전체초 - 상대초) / 릴리스초)) ** 1.4
  return 어택 * 감쇠 * 릴리스
}

function 버퍼부드럽게제한하기(채널: Float32Array, 출력표본율: number): void {
  방울림더하기(채널, 출력표본율, 0.074, 0.012)
  방울림더하기(채널, 출력표본율, 0.097, 0.009)
  for (let 순서 = 0; 순서 < 채널.length; 순서 += 1) {
    채널[순서] = Math.tanh(채널[순서] * 1.36) * 0.92
  }
}

export function 의사잡음(씨앗: number, 눈금: number): number {
  const 값 = Math.sin((씨앗 + 1) * 12.9898 + 눈금 * 78.233) * 43758.5453
  return 값 - Math.floor(값) - 0.5
}

function 기호세부찾기(
  표본들: Float32Array,
  입력표본율: number,
  기호순서: number,
  보이싱후보들: number[],
): { 기호: number } {
  let 최고점수 = Number.NEGATIVE_INFINITY
  let 최고기호 = 0

  for (const 보이싱번호 of 보이싱후보들) {
    const 관측윤곽 = 세부관측윤곽구하기(표본들, 입력표본율, 기호순서, 보이싱번호)
    for (let 리듬번호 = 0; 리듬번호 < 리듬패턴들.length; 리듬번호 += 1) {
      const 후보 = (리듬번호 << 3) | 보이싱번호
        const 점수 = 세부후보점수구하기(관측윤곽, 입력표본율, 기호순서, 후보, 표본들.length)
      if (점수 > 최고점수) {
        최고점수 = 점수
        최고기호 = 후보
      }
    }
  }

  return { 기호: 최고기호 }
}

function 세부관측윤곽구하기(
  표본들: Float32Array,
  입력표본율: number,
  기호순서: number,
  보이싱번호: number,
): number[] {
  const 윤곽: number[] = []

  for (let 구간 = 0; 구간 < 세부윤곽구간수; 구간 += 1) {
    const 시작 = Math.floor((표본들.length * 구간) / 세부윤곽구간수)
    const 끝 = Math.floor((표본들.length * (구간 + 1)) / 세부윤곽구간수)
    const 창 = 표본들.slice(시작, 끝)
    윤곽.push(Math.sqrt(Math.max(0, 상성부점수구하기(창, 입력표본율, 기호순서, 보이싱번호))))
  }

  return 윤곽
}

function 상성부점수구하기(표본들: Float32Array, 입력표본율: number, 기호순서: number, 보이싱번호: number): number {
  const 주파수들 = 코드톤주파수들구하기(기호순서, 보이싱번호).sort((왼쪽, 오른쪽) => 왼쪽 - 오른쪽)
  return 괴르첼(표본들, 입력표본율, 주파수들[주파수들.length - 1])
}

function 상성부구간피크구하기(표본들: Float32Array, 입력표본율: number, 주파수: number): number {
  const 구간수 = 8
  let 최고 = 0
  for (let 구간 = 0; 구간 < 구간수; 구간 += 1) {
    const 시작 = Math.floor((표본들.length * 구간) / 구간수)
    const 끝 = Math.floor((표본들.length * (구간 + 1)) / 구간수)
    최고 = Math.max(최고, 정규화괴르첼(표본들.slice(시작, 끝), 입력표본율, 주파수))
  }
  return 최고
}

function 정규화괴르첼(표본들: Float32Array, 입력표본율: number, 주파수: number): number {
  return 괴르첼(표본들, 입력표본율, 주파수) / Math.max(1, 표본들.length * 표본들.length)
}

function 세부후보점수구하기(
  관측윤곽: number[],
  입력표본율: number,
  기호순서: number,
  후보: number,
  표본수: number,
): number {
  const 기대윤곽 = 세부기대윤곽구하기(입력표본율, 기호순서, 후보, 표본수)
  let 곱합 = 0
  let 관측합 = 0
  let 기대합 = 0

  for (let 순서 = 0; 순서 < 관측윤곽.length; 순서 += 1) {
    곱합 += 관측윤곽[순서] * 기대윤곽[순서]
    관측합 += 관측윤곽[순서] * 관측윤곽[순서]
    기대합 += 기대윤곽[순서] * 기대윤곽[순서]
  }

  return 곱합 / Math.sqrt((관측합 + 1e-12) * (기대합 + 1e-12))
}

function 세부기대윤곽구하기(입력표본율: number, 기호순서: number, 후보: number, 표본수: number): number[] {
  const 코드주기기호수 = 재즈코드진행.length * 마디당기호수
  const 저장키 = `${입력표본율}:${기호순서 % 코드주기기호수}:${표본수}:${후보}`
  const 저장값 = 세부기대윤곽저장소.get(저장키)
  if (저장값) return 저장값

  const 참조 = new Float32Array(표본수)
  세부참조상성부쓰기(참조, 입력표본율, 후보, 표본수, 기호순서)
  const 보이싱번호 = 후보 & 0b111
  const 기대윤곽 = 세부관측윤곽구하기(참조, 입력표본율, 기호순서, 보이싱번호)
  세부기대윤곽저장소.set(저장키, 기대윤곽)
  return 기대윤곽
}

function 세부참조상성부쓰기(
  채널: Float32Array,
  출력표본율: number,
  기호: number,
  표본수: number,
  기호순서: number,
): void {
  const 보이싱번호 = 기호 & 0b111
  const 리듬번호 = (기호 >> 3) & 0b111
  const 슬롯초 = 표본수 / 출력표본율
  const 리듬패턴 = 리듬패턴들[리듬번호]
  const 강세 = 기호강세구하기(기호순서)
  const 보이싱 = 보이싱미디음들구하기(기호순서, 보이싱번호)
  const 상성부순서 = 보이싱.length - 1
  const 상성부음 = 보이싱[상성부순서]

  for (let 사건번호 = 0; 사건번호 < 리듬패턴.사건들.length; 사건번호 += 1) {
    const 사건 = 리듬패턴.사건들[사건번호]
    const 시작초 = 슬롯초 * 사건.시작비율
    const 길이초 = Math.max(0.08, 슬롯초 * 사건.길이비율)
    const 시작 = Math.floor((시작초 + 상성부순서 * 화음펼침초) * 출력표본율)
    const 길이 = Math.max(96, Math.floor(Math.min(길이초, 슬롯초 - 시작초) * 출력표본율))
    음표더하기(
      채널,
      시작,
      출력표본율,
      상성부음,
      길이,
      강세 * 사건.세기 * (0.34 - 상성부순서 * 0.014) * 상성부강조값,
      기호순서 * 19 + 사건번호 * 7 + 상성부순서,
      리듬패턴.릴리스,
      리듬패턴.지속,
    )
  }
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

function 보이싱미디음들구하기(기호순서: number, 보이싱번호: number): number[] {
  const 코드 = 코드찾기(기호순서)
  const 근음 = 근음미디구하기(코드.근음)
  const 간격들 = 보이싱사전[코드.종류][보이싱번호 % 코드톤수]
  const 몸통음들 = 가까운배치하기(간격들.map((간격) => 근음 + 간격))
  const 상성부음 = 상성부미디음구하기(근음, 보이싱번호)
  return [...몸통음들, 상성부음].sort((왼쪽, 오른쪽) => 왼쪽 - 오른쪽)
}

function 가까운배치하기(기본음들: number[]): number[] {
  const 다섯음보이싱 = 기본음들.length > 4
  const 음들 = 기본음들
    .map((음, 인덱스) => {
      let 후보 = 음
      const 목표 = 다섯음보이싱 ? 54 + 인덱스 * 7 : 56 + 인덱스 * 5
      while (후보 - 목표 > 6) 후보 -= 12
      while (목표 - 후보 > 6) 후보 += 12
      while (후보 < (다섯음보이싱 ? 48 : 52)) 후보 += 12
      while (후보 > (다섯음보이싱 ? 88 : 76)) 후보 -= 12
      return 후보
    })
    .sort((왼쪽, 오른쪽) => 왼쪽 - 오른쪽)

  for (let 순서 = 1; 순서 < 음들.length; 순서 += 1) {
    if (음들[순서] <= 음들[순서 - 1]) 음들[순서] += 12
  }
  return 음들.map((음) => (음 > (다섯음보이싱 ? 90 : 78) ? 음 - 12 : 음))
}

function 상성부미디음구하기(근음: number, 보이싱번호: number): number {
  let 음 = 근음 + 보이싱상성부간격들[보이싱번호 % 보이싱상성부간격들.length]
  while (음 < 72) 음 += 12
  while (음 > 96) 음 -= 12
  return 음
}

function 코드찾기(기호순서: number): 코드진행마디 {
  const 마디번호 = Math.floor(기호순서 / 마디당기호수) % 재즈코드진행.length
  const 박 = 셀자리박들[기호순서 % 마디당기호수]
  let 현재코드 = 재즈코드진행[마디번호][0]
  for (const 코드 of 재즈코드진행[마디번호]) {
    if (코드.박 <= 박) 현재코드 = 코드
  }
  return 현재코드
}

function 근음미디구하기(근음: 음이름): number {
  let 미디음 = 48 + 음이름값[근음]
  if (미디음 > 59) 미디음 -= 12
  return 미디음
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

function 방울림더하기(채널: Float32Array, 출력표본율: number, 지연초: number, 이득: number): void {
  const 지연 = Math.floor(지연초 * 출력표본율)
  for (let 순서 = 지연; 순서 < 채널.length; 순서 += 1) {
    채널[순서] += 채널[순서 - 지연] * 이득
  }
}

function 기호강세구하기(기호순서: number): number {
  const 박위치 = 기호순서 % 마디당기호수
  if (박위치 === 0) return 1
  if (박위치 === 4) return 0.9
  if (박위치 % 2 === 0) return 0.84
  return 0.68
}

async function 스트림변환하기(바이트들: Uint8Array, 변환: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const 복사본 = new Uint8Array(바이트들.length)
  복사본.set(바이트들)
  const 흐름 = new Blob([복사본.buffer]).stream().pipeThrough(변환)
  const 응답 = new Response(흐름)
  return new Uint8Array(await 응답.arrayBuffer())
}
