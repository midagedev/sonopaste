import { 데이터청크복원하기, 패리티청크만들기 } from './리드솔로몬.js'

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
    }
  | {
      성공: false
      이유: string
    }

export type 알에스블록 = {
  데이터수: number
  패리티수: number
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
export const 블록당데이터청크상한 = 128
export const 최소패리티수 = 2
const 패리티비율 = 0.25
export const 템포 = 138
export const 표본율 = 48_000
export const 프리앰블초 = 1
export const 끝표식초 = 0.32
export const 프리앰블주파수 = [1200, 1800] as const
export const 끝표식주파수 = [8600, 9400] as const
export const 박초 = 60 / 템포
// 화음 = 고정 성부(베이스 + 가이드 톤 3·7도) + 데이터 성부.
// 고정 성부가 코드 정체성을 또렷이 들려주고, 데이터 성부 3개가 그 위에 텐션·컬러로 얹힌다.
// 데이터 성부 v는 자기 음역대의 스케일 음 8개 후보 중 하나를 골라 3비트를 싣는다.
// 수신 측은 성부별 음역대를 괴르첼로 따로 읽어 3개 성부를 병렬 복조한다.
export const 성부수 = 3
export const 성부후보수 = 8
export const 성부비트수 = 3
export const 성부기준미디 = 68
export const 기호비트수 = 성부수 * 성부비트수
const 가이드톤수 = 2

const 마법값 = [0x53, 0x4e, 0x50, 0x31] as const
const 버전 = 1
const 재즈모뎀모드 = 8
const 음이름값: Record<음이름, number> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
const 기호마스크 = (1 << 기호비트수) - 1
const 마디당박수 = 4
// 마디당 8분음표 8칸(스트레이트 골격). 심볼 물리 길이는 약 0.22초로 복조에 넉넉하다.
const 셀자리박들 = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] as const
const 화음펼침초 = 0.006
const 상성부강조값 = 2.0
export const 마디당기호수 = 셀자리박들.length
const 박당기호수 = 마디당기호수 / 마디당박수
const 기본오류문구: Record<헤더오류키, string> = {
  프레임없음: '프레임없음',
  미지원프레임: '미지원프레임',
  헤더오류: '헤더오류',
  길이오류: '길이오류',
}
// 표준 C 재즈 블루스 12마디(Charlie Parker 스타일 블루스의 정석 진행).
const 재즈코드진행: readonly (readonly 코드진행마디[])[] = [
  [{ 박: 0, 근음: 'C', 종류: 'dom13' }], // 1  I7
  [{ 박: 0, 근음: 'F', 종류: 'dom13' }], // 2  IV7
  [{ 박: 0, 근음: 'C', 종류: 'dom13' }], // 3  I7
  [
    { 박: 0, 근음: 'G', 종류: 'min9' }, // 4  ii-V (IV로)
    { 박: 2, 근음: 'C', 종류: 'dom13b9' },
  ],
  [{ 박: 0, 근음: 'F', 종류: 'dom13' }], // 5  IV7
  [{ 박: 0, 근음: 'Gb', 종류: 'dim7' }], // 6  #IV°7
  [{ 박: 0, 근음: 'C', 종류: 'dom13' }], // 7  I7
  [
    { 박: 0, 근음: 'E', 종류: 'halfDim' }, // 8  ii-V (ii로)
    { 박: 2, 근음: 'A', 종류: 'dom13b9' },
  ],
  [{ 박: 0, 근음: 'D', 종류: 'min9' }], // 9  ii7
  [{ 박: 0, 근음: 'G', 종류: 'dom13b9' }], // 10 V7
  [
    { 박: 0, 근음: 'C', 종류: 'sixNine' }, // 11 턴어라운드
    { 박: 2, 근음: 'A', 종류: 'dom13b9' },
  ],
  [
    { 박: 0, 근음: 'D', 종류: 'min9' }, // 12 ii-V 턴어라운드
    { 박: 2, 근음: 'G', 종류: 'dom13b9' },
  ],
]
// 코드 종류별 한 옥타브 스케일(근음에서의 반음 오프셋).
// 데이터가 어떤 후보를 고르든 항상 이 스케일 안의 음이라 화음이 협화한다.
const 코드스케일: Record<코드종류, readonly number[]> = {
  dom13: [0, 2, 4, 5, 7, 9, 10],
  dom13b9: [0, 1, 3, 4, 6, 7, 9, 10],
  domAlt: [0, 1, 3, 4, 6, 8, 10],
  min9: [0, 2, 3, 5, 7, 9, 10],
  halfDim: [0, 2, 3, 5, 6, 8, 10],
  dim7: [0, 2, 3, 5, 6, 8, 9, 11],
  sixNine: [0, 2, 4, 5, 7, 9, 11],
  sus13: [0, 2, 5, 7, 9, 10],
}
// 코드별 가이드 톤(근음에서의 반음 오프셋 [3도 격, 7도 격]). 데이터와 무관하게 항상 울려 코드 색깔을 정한다.
const 가이드톤간격: Record<코드종류, readonly [number, number]> = {
  dom13: [4, 10],
  dom13b9: [4, 10],
  domAlt: [4, 10],
  min9: [3, 10],
  halfDim: [3, 10],
  dim7: [3, 9],
  sixNine: [4, 9],
  sus13: [5, 10],
}
// 모든 패턴이 화음을 슬롯 후반까지 지속시킨다(공통 디코드 구간 확보).
// 리듬감은 음 길이가 아니라 어택 타이밍(스윙)·셈여림·터치 캐릭터로 낸다.
const 리듬패턴들: readonly 리듬패턴[] = [
  { 이름: 'comp-soft', 릴리스: 0.16, 지속: 0.3, 사건들: [{ 시작비율: 0.02, 길이비율: 0.96, 세기: 0.92 }] },
  { 이름: 'comp-firm', 릴리스: 0.12, 지속: 0.26, 사건들: [{ 시작비율: 0, 길이비율: 0.98, 세기: 1.05 }] },
  { 이름: 'comp-laid', 릴리스: 0.18, 지속: 0.34, 사건들: [{ 시작비율: 0.06, 길이비율: 0.93, 세기: 0.96 }] },
  { 이름: 'comp-bright', 릴리스: 0.1, 지속: 0.22, 사건들: [{ 시작비율: 0, 길이비율: 0.97, 세기: 1.1 }] },
  { 이름: 'comp-warm', 릴리스: 0.22, 지속: 0.38, 사건들: [{ 시작비율: 0.03, 길이비율: 0.95, 세기: 0.88 }] },
  { 이름: 'comp-push', 릴리스: 0.14, 지속: 0.28, 사건들: [{ 시작비율: 0, 길이비율: 0.99, 세기: 1 }] },
]

// 데이터 청크 수를 RS 블록으로 나눈다(송수신이 본문 길이만으로 같은 결과를 얻는다).
export function 알에스블록들구하기(데이터청크수: number): 알에스블록[] {
  const 블록들: 알에스블록[] = []
  let 남은 = Math.max(1, 데이터청크수)
  while (남은 > 0) {
    const 데이터수 = Math.min(남은, 블록당데이터청크상한)
    const 패리티수 = Math.max(최소패리티수, Math.ceil(데이터수 * 패리티비율))
    블록들.push({ 데이터수, 패리티수 })
    남은 -= 데이터수
  }
  return 블록들
}

function 데이터청크길이구하기(본문길이: number, 청크번호: number): number {
  return Math.min(청크크기, Math.max(0, 본문길이 - 청크번호 * 청크크기))
}

// 패리티 청크 길이는 그 블록 데이터 청크 중 가장 긴 것에 맞춘다.
// (거의 항상 64이지만, 데이터 청크 하나뿐인 작은 블록에서는 짧아져 오버헤드가 준다.)
function 블록패리티길이구하기(본문길이: number, 블록첫번호: number, 데이터수: number): number {
  let 최대 = 0
  for (let 안번호 = 0; 안번호 < 데이터수; 안번호 += 1) {
    최대 = Math.max(최대, 데이터청크길이구하기(본문길이, 블록첫번호 + 안번호))
  }
  return 최대
}

function 본문을패딩청크로(본문: Uint8Array, 데이터청크수: number): Uint8Array[] {
  const 청크들: Uint8Array[] = []
  for (let 번호 = 0; 번호 < 데이터청크수; 번호 += 1) {
    const 청크 = new Uint8Array(청크크기)
    청크.set(본문.subarray(번호 * 청크크기, 번호 * 청크크기 + 청크크기))
    청크들.push(청크)
  }
  return 청크들
}

function 청크쓰기(출력: number[], 페이로드: Uint8Array): void {
  const 검사합 = 검사합16(페이로드)
  for (const 바이트 of 페이로드) 출력.push(바이트)
  출력.push((검사합 >> 8) & 0xff, 검사합 & 0xff)
}

function 헤더만들기(본문길이: number, 압축됨: boolean): Uint8Array {
  const 헤더 = new Uint8Array(16)
  헤더.set(마법값, 0)
  헤더[4] = 버전
  헤더[5] = 재즈모뎀모드
  헤더[6] = (본문길이 >> 16) & 0xff
  헤더[7] = (본문길이 >> 8) & 0xff
  헤더[8] = 본문길이 & 0xff
  헤더[9] = 압축됨 ? 1 : 0
  const 헤더검사합 = 헤더검사합구하기(헤더)
  헤더[10] = (헤더검사합 >> 8) & 0xff
  헤더[11] = 헤더검사합 & 0xff
  return 헤더
}

// 헤더(16B) + 블록마다 [데이터 청크들][패리티 청크들] 순서의 전체 프레임 바이트 수.
export function 전체프레임바이트구하기(본문길이: number): number {
  const 데이터청크수 = Math.max(1, Math.ceil(본문길이 / 청크크기))
  let 바이트 = 16
  let 청크번호 = 0
  for (const 블록 of 알에스블록들구하기(데이터청크수)) {
    const 패리티길이 = 블록패리티길이구하기(본문길이, 청크번호, 블록.데이터수)
    for (let 안번호 = 0; 안번호 < 블록.데이터수; 안번호 += 1) {
      바이트 += 데이터청크길이구하기(본문길이, 청크번호) + 2
      청크번호 += 1
    }
    바이트 += 블록.패리티수 * (패리티길이 + 2)
  }
  return 바이트
}

export async function 프레임만들기(텍스트: string): Promise<{ 바이트: Uint8Array; 청크수: number }> {
  const 원문 = new TextEncoder().encode(텍스트)
  const 본문값 = await 전송본문만들기(원문)
  const 본문 = 본문값.바이트
  const 데이터청크수 = Math.max(1, Math.ceil(본문.length / 청크크기))
  const 패딩청크들 = 본문을패딩청크로(본문, 데이터청크수)
  const 청크들: number[] = []
  let 블록시작 = 0

  for (const 블록 of 알에스블록들구하기(데이터청크수)) {
    const 패리티길이 = 블록패리티길이구하기(본문.length, 블록시작, 블록.데이터수)
    for (let 안번호 = 0; 안번호 < 블록.데이터수; 안번호 += 1) {
      const 길이 = 데이터청크길이구하기(본문.length, 블록시작 + 안번호)
      청크쓰기(청크들, 패딩청크들[블록시작 + 안번호].subarray(0, 길이))
    }
    const 블록데이터 = 패딩청크들
      .slice(블록시작, 블록시작 + 블록.데이터수)
      .map((청크) => 청크.subarray(0, 패리티길이))
    for (const 패리티 of 패리티청크만들기(블록데이터, 블록.패리티수)) {
      청크쓰기(청크들, 패리티)
    }
    블록시작 += 블록.데이터수
  }

  const 헤더 = 헤더만들기(본문.length, 본문값.압축됨)
  const 프레임 = new Uint8Array(헤더.length + 청크들.length)
  프레임.set(헤더, 0)
  프레임.set(청크들, 헤더.length)
  return { 바이트: 프레임, 청크수: 데이터청크수 }
}

export function 전송본문만들기(원문: Uint8Array): Promise<압축결과> {
  return 압축하기(원문)
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
  }
}

function 성공청크수세기(청크상태들: 청크상태[]): number {
  return 청크상태들.filter((상태) => 상태 === '성공').length
}

// CRC가 통과한 청크는 그대로 신뢰하고, 깨진 청크는 같은 블록의 패리티 청크로 RS 복원한다.
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

  const 데이터청크수 = Math.ceil(헤더.본문길이 / 청크크기)
  const 청크상태들: 청크상태[] = Array.from({ length: 데이터청크수 }, () => '실패')
  const 본문 = new Uint8Array(헤더.본문길이)
  let 위치 = 16
  let 전역번호 = 0
  let 블록실패 = false

  for (const 블록 of 알에스블록들구하기(데이터청크수)) {
    const 블록첫번호 = 전역번호
    const 패리티길이 = 블록패리티길이구하기(헤더.본문길이, 블록첫번호, 블록.데이터수)
    const 받은청크들: (Uint8Array | null)[] = []

    for (let 안번호 = 0; 안번호 < 블록.데이터수; 안번호 += 1) {
      const 길이 = 데이터청크길이구하기(헤더.본문길이, 전역번호)
      if (위치 + 길이 + 2 > 바이트들.length) {
        return { 성공: false, 이유: 문구찾기('길이오류'), 헤더, 청크상태들, 성공청크수: 성공청크수세기(청크상태들), 전체청크수: 데이터청크수 }
      }
      const 페이로드 = Uint8Array.from(바이트들.slice(위치, 위치 + 길이))
      const 기대검사합 = (바이트들[위치 + 길이] << 8) | 바이트들[위치 + 길이 + 1]
      위치 += 길이 + 2
      if (검사합16(페이로드) === 기대검사합) {
        const 패딩청크 = new Uint8Array(패리티길이)
        패딩청크.set(페이로드)
        받은청크들.push(패딩청크)
        청크상태들[전역번호] = '성공'
      } else {
        받은청크들.push(null)
      }
      전역번호 += 1
    }

    for (let 안번호 = 0; 안번호 < 블록.패리티수; 안번호 += 1) {
      if (위치 + 패리티길이 + 2 > 바이트들.length) {
        return { 성공: false, 이유: 문구찾기('길이오류'), 헤더, 청크상태들, 성공청크수: 성공청크수세기(청크상태들), 전체청크수: 데이터청크수 }
      }
      const 페이로드 = Uint8Array.from(바이트들.slice(위치, 위치 + 패리티길이))
      const 기대검사합 = (바이트들[위치 + 패리티길이] << 8) | 바이트들[위치 + 패리티길이 + 1]
      위치 += 패리티길이 + 2
      받은청크들.push(검사합16(페이로드) === 기대검사합 ? 페이로드 : null)
    }

    const 복원 = 데이터청크복원하기(받은청크들, 블록.데이터수, 패리티길이)
    if (!복원) {
      블록실패 = true
      continue
    }
    for (let 안번호 = 0; 안번호 < 블록.데이터수; 안번호 += 1) {
      const 청크번호 = 블록첫번호 + 안번호
      const 길이 = 데이터청크길이구하기(헤더.본문길이, 청크번호)
      본문.set(복원[안번호].subarray(0, 길이), 청크번호 * 청크크기)
      청크상태들[청크번호] = '성공'
    }
  }

  if (블록실패) {
    return { 성공: false, 이유: '청크실패', 헤더, 청크상태들, 성공청크수: 성공청크수세기(청크상태들), 전체청크수: 데이터청크수 }
  }

  return {
    성공: true,
    본문,
    헤더,
    청크상태들,
    성공청크수: 데이터청크수,
    전체청크수: 데이터청크수,
  }
}

// 수신 도중 호출: CRC가 통과한 데이터 청크를 순서대로 노출한다(RS 복원은 완료 후 프레임복구하기가 맡는다).
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

  const 데이터청크수 = Math.ceil(헤더.본문길이 / 청크크기)
  const 전체프레임바이트 = 전체프레임바이트구하기(헤더.본문길이)
  const 청크들: (number[] | null)[] = Array.from({ length: 데이터청크수 }, () => null)
  const 청크상태들: 청크상태[] = Array.from({ length: 데이터청크수 }, () => '대기')
  let 위치 = 16
  let 전역번호 = 0

  for (const 블록 of 알에스블록들구하기(데이터청크수)) {
    const 패리티길이 = 블록패리티길이구하기(헤더.본문길이, 전역번호, 블록.데이터수)
    for (let 안번호 = 0; 안번호 < 블록.데이터수; 안번호 += 1) {
      const 길이 = 데이터청크길이구하기(헤더.본문길이, 전역번호)
      if (위치 + 길이 + 2 > 바이트들.length) {
        return 부분프레임결과만들기(헤더, 청크상태들, 청크들, 전체프레임바이트, 바이트들.length >= 전체프레임바이트)
      }
      const 페이로드 = Uint8Array.from(바이트들.slice(위치, 위치 + 길이))
      const 기대검사합 = (바이트들[위치 + 길이] << 8) | 바이트들[위치 + 길이 + 1]
      위치 += 길이 + 2
      if (검사합16(페이로드) === 기대검사합) {
        청크들[전역번호] = Array.from(페이로드)
        청크상태들[전역번호] = '성공'
      } else {
        청크상태들[전역번호] = '실패'
      }
      전역번호 += 1
    }

    for (let 안번호 = 0; 안번호 < 블록.패리티수; 안번호 += 1) {
      if (위치 + 패리티길이 + 2 > 바이트들.length) {
        return 부분프레임결과만들기(헤더, 청크상태들, 청크들, 전체프레임바이트, 바이트들.length >= 전체프레임바이트)
      }
      위치 += 패리티길이 + 2
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
  return {
    성공: true,
    헤더,
    청크상태들,
    청크들,
    성공청크수: 성공청크수세기(청크상태들),
    전체청크수: 청크상태들.length,
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

// 합성 음의 스펙트럼 피크는 명목 주파수에서 몇 Hz 어긋날 수 있다(합성 처프, 음향 채널의 클럭 드리프트).
// 후보 주파수 주변 좁은 대역을 훑어 피크 에너지를 잡는다.
const 대역탐침Hz = [-3, 0, 3, 6, 9] as const

function 후보에너지구하기(표본들: Float32Array, 입력표본율: number, 명목주파수: number): number {
  let 최고 = 0
  for (const 차이 of 대역탐침Hz) {
    const 에너지 = 정규화괴르첼(표본들, 입력표본율, 명목주파수 + 차이)
    if (에너지 > 최고) 최고 = 에너지
  }
  return 최고
}

// 성부별 음역대를 괴르첼로 따로 읽어 4개 성부를 독립 복조한다.
export function 음악기호찾기(
  표본들: Float32Array,
  입력표본율: number,
  기호순서: number,
): { 기호: number; 신호대잡음: number } {
  const 후보들 = 화음후보들구하기(기호순서)
  let 기호 = 0
  let 최소신호대잡음 = Infinity

  for (let 성부 = 0; 성부 < 성부수; 성부 += 1) {
    let 최고 = -1
    let 차점 = -1
    let 최고번호 = 0
    for (let 후보 = 0; 후보 < 성부후보수; 후보 += 1) {
      const 에너지 = 후보에너지구하기(표본들, 입력표본율, 미디를주파수로(후보들[성부 * 성부후보수 + 후보]))
      if (에너지 > 최고) {
        차점 = 최고
        최고 = 에너지
        최고번호 = 후보
      } else if (에너지 > 차점) {
        차점 = 에너지
      }
    }
    기호 |= 최고번호 << (성부 * 성부비트수)
    최소신호대잡음 = Math.min(최소신호대잡음, 10 * Math.log10((최고 + 1e-12) / (Math.max(0, 차점) + 1e-12)))
  }

  return { 기호, 신호대잡음: Number.isFinite(최소신호대잡음) ? 최소신호대잡음 : 0 }
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
  const 리듬번호 = 리듬선택하기(기호순서)
  const 슬롯초 = 표본수 / 출력표본율
  const 리듬패턴 = 리듬패턴들[리듬번호]
  const 강세 = 기호강세구하기(기호순서)
  // 가이드 톤(코드 색깔, 고정) 아래에 데이터 성부(텐션)를 얹어 한 화음으로 친다.
  const 보이싱 = [...가이드톤음들구하기(기호순서), ...화음음들구하기(기호순서, 기호)]
  const 셀번호 = 기호순서 % 마디당기호수

  if (셀번호 % 박당기호수 === 0) {
    베이스깔기(채널, 위치, 출력표본율, 표본수, 기호순서)
  }

  for (let 사건번호 = 0; 사건번호 < 리듬패턴.사건들.length; 사건번호 += 1) {
    const 사건 = 리듬패턴.사건들[사건번호]
    const 시작초 = 슬롯초 * 사건.시작비율
    const 길이초 = Math.max(0.08, 슬롯초 * 사건.길이비율)
    const 시작 = 위치 + Math.floor(시작초 * 출력표본율)
    const 길이 = Math.max(96, Math.floor(Math.min(길이초, 슬롯초 - 시작초) * 출력표본율))

    for (let 순서 = 0; 순서 < 보이싱.length; 순서 += 1) {
      // 보이싱 앞쪽 2음은 가이드 톤(코드 색깔, 차분하게), 뒤쪽은 데이터 성부.
      let 음량배수: number
      if (순서 < 가이드톤수) {
        음량배수 = 0.2
      } else {
        const 데이터순 = 순서 - 가이드톤수
        const 데이터강조 = 데이터순 === 성부수 - 1 ? 상성부강조값 : 데이터순 === 성부수 - 2 ? 1.15 : 1
        음량배수 = (0.32 - 데이터순 * 0.016) * 데이터강조
      }
      음표더하기(
        채널,
        시작 + Math.floor(순서 * 화음펼침초 * 출력표본율),
        출력표본율,
        보이싱[순서],
        길이,
        강세 * 사건.세기 * 음량배수,
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
  const 보조음 = 베이스 + (Math.floor(셀번호 / 박당기호수) % 2 ? 7 : 0)
  const 길이 = Math.floor(표본수 * 0.92)
  // 근음을 또렷이 짚어 코드 진행이 베이스 라인으로도 들리게 한다.
  음표더하기(채널, 위치, 출력표본율, 보조음, 길이, 셀번호 === 0 ? 0.34 : 0.26, 기호순서 * 11, 0.18, 0.2)
}

function 피아노파형구하기(주파수: number, 상대초: number, 씨앗: number): number {
  const 줄흔들림들 = [-0.0015, 0.0002, 0.0017]
  const 배음세기들 = [0.82, 0.36, 0.2, 0.11, 0.065, 0.038]
  let 합계 = 0

  for (let 줄번호 = 0; 줄번호 < 줄흔들림들.length; 줄번호 += 1) {
    // 정적 디튠만으로 3현 코러스를 만든다(시변 비브라토는 처프를 만들어 복조 주파수를 어긋나게 한다).
    const 줄보정 = 1 + 줄흔들림들[줄번호]
    // 비브라토는 음높이가 아니라 위상에 얹어 평균 주파수를 명목값에 고정한다.
    const 진동 = 0.5 * Math.sin(2 * Math.PI * (2.2 + 줄번호 * 0.31) * 상대초)
    for (let 배음번호 = 1; 배음번호 <= 배음세기들.length; 배음번호 += 1) {
      const 휨 = 배음번호 + 배음번호 * 배음번호 * 0.0007
      const 세기 = 배음세기들[배음번호 - 1] * Math.exp(-상대초 * (0.75 + 배음번호 * 1.35))
      const 위상 = 씨앗 * 0.017 + 줄번호 * 0.41 + 배음번호 * 0.19
      합계 += Math.sin(2 * Math.PI * 주파수 * 휨 * 줄보정 * 상대초 + 위상 + 진동 * 배음번호) * 세기
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

function 정규화괴르첼(표본들: Float32Array, 입력표본율: number, 주파수: number): number {
  return 괴르첼(표본들, 입력표본율, 주파수) / Math.max(1, 표본들.length * 표본들.length)
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

// 현재 코드의 스케일 음을 성부기준미디부터 오름차순으로 (성부수 × 성부후보수)개 모은다.
// 성부 v의 후보는 후보들[v*성부후보수 .. v*성부후보수+성부후보수). 성부마다 음역대가 겹치지 않는다.
function 화음후보들구하기(기호순서: number): number[] {
  const 코드 = 코드찾기(기호순서)
  const 허용피치 = new Set(코드스케일[코드.종류].map((간격) => (음이름값[코드.근음] + 간격) % 12))
  const 필요수 = 성부수 * 성부후보수
  const 후보들: number[] = []
  let 미디 = 성부기준미디
  while (후보들.length < 필요수) {
    if (허용피치.has(((미디 % 12) + 12) % 12)) 후보들.push(미디)
    미디 += 1
  }
  return 후보들
}

// 12비트 기호를 성부수개의 3비트 묶음으로 풀어 각 성부의 실제 음을 고른다.
function 화음음들구하기(기호순서: number, 기호: number): number[] {
  const 후보들 = 화음후보들구하기(기호순서)
  const 음들: number[] = []
  for (let 성부 = 0; 성부 < 성부수; 성부 += 1) {
    const 후보번호 = (기호 >> (성부 * 성부비트수)) & (성부후보수 - 1)
    음들.push(후보들[성부 * 성부후보수 + 후보번호])
  }
  return 음들
}

// 코드의 3도·7도를 MIDI 49~67 창에 쌓아 가이드 톤을 만든다(데이터 성부 음역대 68 아래).
function 가이드톤음들구하기(기호순서: number): number[] {
  const 코드 = 코드찾기(기호순서)
  const [삼도간격, 칠도간격] = 가이드톤간격[코드.종류]
  const 삼도 = 49 + (((음이름값[코드.근음] + 삼도간격 - 49) % 12) + 12) % 12
  const 칠도 = 삼도 + ((((칠도간격 - 삼도간격) % 12) + 12) % 12)
  return [삼도, 칠도]
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

function 리듬선택하기(기호순서: number): number {
  const 셀번호 = 기호순서 % 마디당기호수
  const 마디번호 = Math.floor(기호순서 / 마디당기호수)
  return (셀번호 * 3 + 마디번호 * 5) % 리듬패턴들.length
}

function 기호강세구하기(기호순서: number): number {
  const 셀번호 = 기호순서 % 마디당기호수
  if (셀번호 === 0) return 1
  if (셀번호 === 마디당기호수 / 2) return 0.9
  if (셀번호 % 박당기호수 === 0) return 0.84
  return 0.68
}

async function 스트림변환하기(바이트들: Uint8Array, 변환: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const 복사본 = new Uint8Array(바이트들.length)
  복사본.set(바이트들)
  const 흐름 = new Blob([복사본.buffer]).stream().pipeThrough(변환)
  const 응답 = new Response(흐름)
  return new Uint8Array(await 응답.arrayBuffer())
}
