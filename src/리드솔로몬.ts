// GF(256) Reed-Solomon erasure 코드. 외부 의존성 없이 구현한다.
//
// 데이터 청크 K개에 패리티 청크 M개를 더해 전송하면, 어느 청크가 소실됐는지
// (CRC 등으로) 알고 있을 때 임의의 K개 청크만 살아남아도 전체를 복원할 수 있다.
//
// systematic original-view 방식: 청크 번호를 GF(256) 평가점으로 보고,
// 데이터 청크를 K-1차 다항식의 평가값으로 둔 뒤 패리티 청크를 추가 평가점에서 얻는다.
// 소실 위치를 알고 있으므로 라그랑주 보간만으로 정정한다(errors-and-erasures 불필요).

const 기약다항식 = 0x11d

const 지수표 = new Uint8Array(512)
const 로그표 = new Uint8Array(256)

;(() => {
  let 값 = 1
  for (let 차수 = 0; 차수 < 255; 차수 += 1) {
    지수표[차수] = 값
    로그표[값] = 차수
    값 <<= 1
    if (값 & 0x100) 값 ^= 기약다항식
  }
  for (let 차수 = 255; 차수 < 512; 차수 += 1) {
    지수표[차수] = 지수표[차수 - 255]
  }
})()

function 곱(왼쪽: number, 오른쪽: number): number {
  if (왼쪽 === 0 || 오른쪽 === 0) return 0
  return 지수표[로그표[왼쪽] + 로그표[오른쪽]]
}

function 나눗셈(왼쪽: number, 오른쪽: number): number {
  // 오른쪽 !== 0 을 가정한다(평가점이 서로 달라 분모가 0이 되지 않는다).
  if (왼쪽 === 0) return 0
  return 지수표[로그표[왼쪽] + 255 - 로그표[오른쪽]]
}

// 표본점들에서의 값으로 목표점에서의 값을 구하는 라그랑주 보간 계수.
function 보간계수구하기(표본점들: number[], 목표점: number): number[] {
  const 개수 = 표본점들.length
  const 계수들: number[] = []
  for (let 기준 = 0; 기준 < 개수; 기준 += 1) {
    let 분자 = 1
    let 분모 = 1
    for (let 다른 = 0; 다른 < 개수; 다른 += 1) {
      if (다른 === 기준) continue
      분자 = 곱(분자, 목표점 ^ 표본점들[다른])
      분모 = 곱(분모, 표본점들[기준] ^ 표본점들[다른])
    }
    계수들.push(나눗셈(분자, 분모))
  }
  return 계수들
}

function 가중합(계수들: number[], 청크들: Uint8Array[], 청크길이: number): Uint8Array {
  const 결과 = new Uint8Array(청크길이)
  for (let 순서 = 0; 순서 < 청크들.length; 순서 += 1) {
    const 계수 = 계수들[순서]
    if (계수 === 0) continue
    const 청크 = 청크들[순서]
    for (let 바이트 = 0; 바이트 < 청크길이; 바이트 += 1) {
      결과[바이트] ^= 곱(계수, 청크[바이트])
    }
  }
  return 결과
}

// 데이터 청크 K개로 패리티 청크 M개를 만든다. 모든 청크 길이는 같아야 한다.
// K + M 은 255 이하여야 한다.
export function 패리티청크만들기(데이터청크들: Uint8Array[], 패리티수: number): Uint8Array[] {
  const 데이터수 = 데이터청크들.length
  if (데이터수 === 0 || 패리티수 === 0) return []
  const 청크길이 = 데이터청크들[0].length
  const 데이터점들 = Array.from({ length: 데이터수 }, (_, 순서) => 순서)
  const 패리티청크들: Uint8Array[] = []

  for (let 패리티번호 = 0; 패리티번호 < 패리티수; 패리티번호 += 1) {
    const 계수들 = 보간계수구하기(데이터점들, 데이터수 + 패리티번호)
    패리티청크들.push(가중합(계수들, 데이터청크들, 청크길이))
  }
  return 패리티청크들
}

// 받은청크들[i] 가 null 이면 i번 청크가 소실된 것이다(0..데이터수-1: 데이터, 그 뒤: 패리티).
// 살아있는 청크가 데이터수 이상이면 데이터 청크 전체를 복원해 반환하고, 모자라면 null.
export function 데이터청크복원하기(
  받은청크들: (Uint8Array | null)[],
  데이터수: number,
  청크길이: number,
): Uint8Array[] | null {
  const 살아있는번호들: number[] = []
  for (let 번호 = 0; 번호 < 받은청크들.length; 번호 += 1) {
    if (받은청크들[번호]) 살아있는번호들.push(번호)
  }
  if (살아있는번호들.length < 데이터수) return null

  const 결과: Uint8Array[] = []
  let 누락있음 = false
  for (let 번호 = 0; 번호 < 데이터수; 번호 += 1) {
    const 청크 = 받은청크들[번호]
    if (청크) {
      결과.push(청크)
    } else {
      누락있음 = true
      결과.push(new Uint8Array(청크길이))
    }
  }
  if (!누락있음) return 결과

  const 표본번호들 = 살아있는번호들.slice(0, 데이터수)
  const 표본청크들 = 표본번호들.map((번호) => 받은청크들[번호] as Uint8Array)

  for (let 번호 = 0; 번호 < 데이터수; 번호 += 1) {
    if (받은청크들[번호]) continue
    const 계수들 = 보간계수구하기(표본번호들, 번호)
    결과[번호] = 가중합(계수들, 표본청크들, 청크길이)
  }
  return 결과
}
