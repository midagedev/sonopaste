import './style.css'
import {
  type 청크상태,
  type 헤더오류키,
  바이트를음악기호로,
  음악기호를바이트로,
  음악기호찾기,
  오디오표본만들기,
  코드톤수,
  괴르첼,
  끝표식초,
  청크반복,
  청크크기,
  프레임복구하기,
  프레임만들기,
  프리앰블주파수,
  프리앰블초,
  표본율,
  반복청크바이트수구하기,
  기호길이초구하기,
  기호구간시간초구하기,
  기호시간초구하기,
  기호위치찾기,
  압축하기,
  압축풀기,
  헤더읽기,
  의사잡음,
} from './음악모뎀'

type 송신상태 = {
  맥락: AudioContext
  이득: GainNode
  소스: AudioBufferSourceNode
  시작초: number
  기호수: number
  기호들: number[]
  기호누적초들: Float32Array
}

type 수신상태 = {
  맥락: AudioContext
  흐름: MediaStream
  처리기: ScriptProcessorNode
  소스: MediaStreamAudioSourceNode
}

type 수신단계 = '대기' | '준비' | '본문' | '완료' | '오류'
type 소리정체성 = '재즈피아노'
type 언어 = 'ko' | 'en'

type 오디오결과 = {
  버퍼: AudioBuffer
  기호누적초들: Float32Array
}

const 현재언어: 언어 = navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en'

const 글 = {
  ko: {
    제목: '재즈 피아노로 텍스트 붙여넣기.',
    상태: '네트워크 없음. 메모리만 사용.',
    텍스트: '텍스트',
    복사: '복사',
    자리표시자: 'URL, 코드 조각, 에러 로그, 한글/영문 텍스트를 붙여넣으세요.',
    길이경고: '8KB가 넘으면 전송 시간이 길어지고 실패 확률이 높아집니다.',
    모드: '모드',
    균형: '재즈',
    모드설명: 'MVP는 재즈 블루스 코드 진행 위에 음정 2비트 + 리듬 2비트를 싣고, CRC 청크 복구를 사용합니다.',
    볼륨: '출력 볼륨',
    소리정체성: '소리 정체성',
    보내기: '보내기',
    멈춤: '멈춤',
    듣기: '듣기',
    듣기멈춤: '듣기 중지',
    고급: '고급 설정',
    청크: '청크',
    프리앰블: '프리앰블',
    압축: '압축',
    복구: '복구',
    청크값: '64B × 3 + CRC16',
    프리앰블값: '1.0초 투톤 동기화',
    압축값: '브라우저 내장 Deflate',
    복구값: 'CRC가 맞는 반복 청크 채택',
    단계: '단계',
    심볼: '음표',
    청크들: '청크',
    신호대잡음: 'SNR',
    남은시간: '남은 시간',
    대기: '대기',
    준비중: '송신 준비 중',
    붙여넣기먼저: '먼저 텍스트를 붙여넣으세요',
    보내는중: '송신 중',
    송신실패: '송신 실패',
    보냄: '송신 완료',
    멈춤상태: '멈춤',
    마이크없음: '마이크를 사용할 수 없음',
    듣는중: '듣는 중',
    받는중: '수신 중',
    프레임없음: 'Jazzmodem 프레임이 아님',
    미지원프레임: '지원하지 않는 프레임',
    헤더오류: '헤더 CRC 실패',
    길이오류: '잘못된 길이',
    청크실패: '깨진 청크가 남아 있습니다. 다시 보내주세요.',
    해제불가: '압축 해제 불가',
    받음: '수신 완료',
    메타압축: '압축',
    메타원문: '원문',
    메타압축없음: '무압축',
    청크없음: '아직 청크 없음',
    전송미리보기: '전송 미리보기',
    원문크기: '텍스트 크기',
    본문크기: '전송 본문',
    프레임크기: '실제 프레임',
    예상전송시간: '예상 전송 시간',
    복구반복: '복구 반복',
    소리시각화: '소리 시각화',
    출력레벨: '출력 레벨',
    톤분포: '코드 톤',
    없음: '없음',
  },
  en: {
    제목: 'Paste text through jazz piano.',
    상태: 'No network. Memory only.',
    텍스트: 'Text',
    복사: 'Copy',
    자리표시자: 'Paste a URL, source snippet, error log, or Korean/English text here.',
    길이경고: 'Over 8KB takes longer and is more likely to fail.',
    모드: 'Mode',
    균형: 'Jazz',
    모드설명: 'MVP carries 2 pitch bits + 2 rhythm bits over a jazz-blues progression with CRC chunk recovery.',
    볼륨: 'Output volume',
    소리정체성: 'Sound identity',
    보내기: 'Send',
    멈춤: 'Stop',
    듣기: 'Listen',
    듣기멈춤: 'Stop listening',
    고급: 'Advanced settings',
    청크: 'Chunk',
    프리앰블: 'Preamble',
    압축: 'Compression',
    복구: 'Recovery',
    청크값: '64 B × 3 + CRC16',
    프리앰블값: '1.0 s two-tone sync',
    압축값: 'Native browser Deflate',
    복구값: 'valid repeated chunks win',
    단계: 'Phase',
    심볼: 'Notes',
    청크들: 'Chunks',
    신호대잡음: 'SNR',
    남은시간: 'ETA',
    대기: 'Idle',
    준비중: 'Preparing',
    붙여넣기먼저: 'Paste text first',
    보내는중: 'Sending',
    송신실패: 'Send failed',
    보냄: 'Sent',
    멈춤상태: 'Stopped',
    마이크없음: 'Mic unsupported',
    듣는중: 'Listening',
    받는중: 'Receiving',
    프레임없음: 'No Jazzmodem frame',
    미지원프레임: 'Unsupported frame',
    헤더오류: 'Header CRC failed',
    길이오류: 'Invalid length',
    청크실패: 'Broken chunks remain. Please resend.',
    해제불가: 'Decode failed',
    받음: 'Received',
    메타압축: 'compressed',
    메타원문: 'raw',
    메타압축없음: 'stored',
    청크없음: 'No chunks yet',
    전송미리보기: 'Transfer preview',
    원문크기: 'Text size',
    본문크기: 'Payload',
    프레임크기: 'On-air frame',
    예상전송시간: 'Estimated send time',
    복구반복: 'Recovery repeats',
    소리시각화: 'Sound view',
    출력레벨: 'Output level',
    톤분포: 'Chord tones',
    없음: 'None',
  },
} as const

const 소리정체성목록: Record<
  소리정체성,
  { 이름: Record<언어, string>; 설명: Record<언어, string> }
> = {
  재즈피아노: {
    이름: { ko: '블루 재즈 피아노', en: 'Blue Jazz Piano' },
    설명: {
      ko: '12마디 재즈 블루스와 ii-V 턴어라운드 위에서 음정과 스윙 리듬이 함께 데이터를 나릅니다.',
      en: 'Data rides on pitch and swing rhythm over a 12-bar jazz blues with ii-V turnaround.',
    },
  },
}

const 뿌리 = document.querySelector<HTMLDivElement>('#app')

if (!뿌리) {
  throw new Error('Missing #app root')
}

뿌리.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">${현재언어 === 'ko' ? '재즈모뎀' : 'Jazzmodem'}</p>
        <h1>${문구('제목')}</h1>
      </div>
      <div class="status-pill">${문구('상태')}</div>
    </header>

    <section class="workspace">
      <div class="panel input-panel">
        <div class="panel-head">
          <div>
            <h2>${문구('텍스트')}</h2>
            <p id="payloadMeta">0 B ${문구('메타원문')} · 0 B ${문구('메타압축없음')}</p>
          </div>
          <button id="copyButton" class="ghost" type="button" disabled>${문구('복사')}</button>
        </div>
        <textarea id="textBox" spellcheck="false" placeholder="${문구('자리표시자')}"></textarea>
        <p id="lengthWarning" class="warning" hidden>${문구('길이경고')}</p>
      </div>

      <aside class="panel controls-panel">
        <div class="control-block">
          <label for="modeSlider">${문구('모드')}</label>
          <div class="mode-row">
            <input id="modeSlider" type="range" min="0" max="3" value="1" step="1" disabled />
            <strong>${문구('균형')}</strong>
          </div>
          <p class="muted">${문구('모드설명')}</p>
        </div>

        <div class="control-block">
          <label for="volumeSlider">${문구('볼륨')}</label>
          <input id="volumeSlider" type="range" min="0" max="100" value="75" />
        </div>

        <div class="control-block">
          <label for="soundTheme">${문구('소리정체성')}</label>
          <select id="soundTheme">${소리옵션HTML()}</select>
          <p class="muted" id="themeDescription">${소리정체성목록.재즈피아노.설명[현재언어]}</p>
        </div>

        <div class="preview-block" aria-label="${문구('전송미리보기')}">
          <h2>${문구('전송미리보기')}</h2>
          <dl class="preview-grid">
            <div>
              <dt>${문구('원문크기')}</dt>
              <dd id="previewRaw">0 B</dd>
            </div>
            <div>
              <dt>${문구('본문크기')}</dt>
              <dd id="previewPayload">0 B</dd>
            </div>
            <div>
              <dt>${문구('프레임크기')}</dt>
              <dd id="previewFrame">0 B</dd>
            </div>
            <div>
              <dt>${문구('예상전송시간')}</dt>
              <dd id="previewTime">0s</dd>
            </div>
            <div>
              <dt>${문구('복구반복')}</dt>
              <dd id="previewRepeat">${청크반복}×</dd>
            </div>
          </dl>
        </div>

        <div class="visualizer-block" aria-label="${문구('소리시각화')}">
          <div class="visualizer-head">
            <h2>${문구('소리시각화')}</h2>
            <span>${문구('톤분포')}</span>
          </div>
          <div class="vu-row">
            <span>${문구('출력레벨')}</span>
            <div class="vu-track"><i id="vuFill"></i></div>
          </div>
          <div class="eq-grid" id="eqGrid">
            ${Array.from({ length: 코드톤수 }, (_, 순서) => 순서)
              .map((순서) => `<span class="eq-bar" data-tone="${순서}" title="${순서 + 1}"><i></i></span>`)
              .join('')}
          </div>
        </div>

        <div class="button-grid">
          <button id="sendButton" class="primary" type="button">${문구('보내기')}</button>
          <button id="stopButton" type="button" disabled>${문구('멈춤')}</button>
          <button id="listenButton" type="button">${문구('듣기')}</button>
        </div>

        <details>
          <summary>${문구('고급')}</summary>
          <dl class="spec-list">
            <div><dt>${문구('청크')}</dt><dd>${문구('청크값')}</dd></div>
            <div><dt>${문구('프리앰블')}</dt><dd>${문구('프리앰블값')}</dd></div>
            <div><dt>${문구('압축')}</dt><dd>${문구('압축값')}</dd></div>
            <div><dt>${문구('복구')}</dt><dd>${문구('복구값')}</dd></div>
          </dl>
        </details>
      </aside>
    </section>

    <section class="telemetry">
      <div>
        <span>${문구('단계')}</span>
        <strong id="phaseValue">${문구('대기')}</strong>
      </div>
      <div>
        <span>${문구('심볼')}</span>
        <strong id="symbolValue">0 / 0</strong>
      </div>
      <div>
        <span>${문구('청크들')}</span>
        <strong id="chunkValue">0 / 0</strong>
      </div>
      <div>
        <span>${문구('신호대잡음')}</span>
        <strong id="snrValue">-</strong>
      </div>
      <div>
        <span>${문구('남은시간')}</span>
        <strong id="etaValue">-</strong>
      </div>
    </section>

    <section class="chunk-strip" id="chunkStrip" aria-label="${문구('청크들')}"></section>
  </main>
`

const 텍스트상자 = 요소찾기<HTMLTextAreaElement>('textBox')
const 본문메타 = 요소찾기<HTMLParagraphElement>('payloadMeta')
const 길이경고 = 요소찾기<HTMLParagraphElement>('lengthWarning')
const 볼륨슬라이더 = 요소찾기<HTMLInputElement>('volumeSlider')
const 소리선택 = 요소찾기<HTMLSelectElement>('soundTheme')
const 소리설명 = 요소찾기<HTMLParagraphElement>('themeDescription')
const 미리보기원문 = 요소찾기<HTMLElement>('previewRaw')
const 미리보기본문 = 요소찾기<HTMLElement>('previewPayload')
const 미리보기프레임 = 요소찾기<HTMLElement>('previewFrame')
const 미리보기시간 = 요소찾기<HTMLElement>('previewTime')
const 미리보기반복 = 요소찾기<HTMLElement>('previewRepeat')
const 출력레벨막대 = 요소찾기<HTMLElement>('vuFill')
const 이큐막대들 = Array.from(document.querySelectorAll<HTMLElement>('.eq-bar i'))
const 보내기단추 = 요소찾기<HTMLButtonElement>('sendButton')
const 멈춤단추 = 요소찾기<HTMLButtonElement>('stopButton')
const 듣기단추 = 요소찾기<HTMLButtonElement>('listenButton')
const 복사단추 = 요소찾기<HTMLButtonElement>('copyButton')
const 단계값 = 요소찾기<HTMLElement>('phaseValue')
const 기호값 = 요소찾기<HTMLElement>('symbolValue')
const 청크값 = 요소찾기<HTMLElement>('chunkValue')
const 신호대잡음값 = 요소찾기<HTMLElement>('snrValue')
const 남은시간값 = 요소찾기<HTMLElement>('etaValue')
const 청크띠 = 요소찾기<HTMLElement>('chunkStrip')

let 송신: 송신상태 | null = null
let 송신준비중 = false
let 수신: 수신상태 | null = null
let 수신단계값: 수신단계 = '대기'
let 수신버퍼: Float32Array<ArrayBufferLike> = new Float32Array(0)
let 대기기호: number[] = []
let 예상본문바이트: number | null = null
let 예상청크수 = 0
let 예상반복수 = 청크반복
let 받은바이트: number[] = []
let 받은기호수 = 0
let 메타순번 = 0

텍스트상자.addEventListener('input', () => {
  void 메타갱신하기()
})

볼륨슬라이더.addEventListener('input', () => {
  if (송신) {
    송신.이득.gain.value = Number(볼륨슬라이더.value) / 100
  }
})

소리선택.addEventListener('change', () => {
  소리설명.textContent = 소리정체성목록[현재소리정체성()].설명[현재언어]
})

보내기단추.addEventListener('click', () => {
  void 송신시작하기()
})

멈춤단추.addEventListener('click', () => {
  송신멈추기()
})

듣기단추.addEventListener('click', () => {
  if (수신) {
    수신멈추기()
  } else {
    void 수신시작하기()
  }
})

복사단추.addEventListener('click', () => {
  void navigator.clipboard.writeText(텍스트상자.value)
})

void 메타갱신하기()
청크띠그리기(0)

function 문구(키: keyof (typeof 글)['ko']): string {
  return 글[현재언어][키]
}

function 헤더문구찾기(키: 헤더오류키): string {
  return 문구(키)
}

function 요소찾기<요소 extends HTMLElement>(아이디: string): 요소 {
  const 찾은요소 = document.getElementById(아이디)
  if (!찾은요소) throw new Error(`Missing #${아이디}`)
  return 찾은요소 as 요소
}

function 소리옵션HTML(): string {
  return (Object.keys(소리정체성목록) as 소리정체성[])
    .map((정체성) => {
      const 선택됨 = 정체성 === '재즈피아노' ? ' selected' : ''
      return `<option value="${정체성}"${선택됨}>${소리정체성목록[정체성].이름[현재언어]}</option>`
    })
    .join('')
}

function 현재소리정체성(): 소리정체성 {
  const 값 = 소리선택.value as 소리정체성
  return 값 in 소리정체성목록 ? 값 : '재즈피아노'
}

async function 메타갱신하기(): Promise<void> {
  const 현재순번 = ++메타순번
  const 원문 = new TextEncoder().encode(텍스트상자.value)
  const 압축된값 = 원문.length ? await 압축하기(원문) : { 바이트: new Uint8Array(), 압축됨: false }
  if (현재순번 !== 메타순번) return
  const 압축표시 = 압축된값.압축됨 ? 문구('메타압축') : 문구('메타압축없음')
  const 청크수 = 압축된값.바이트.length ? Math.ceil(압축된값.바이트.length / 청크크기) : 0
  const 프레임바이트수 = 압축된값.바이트.length
    ? 16 + 반복청크바이트수구하기(압축된값.바이트.length, 청크수, 청크반복)
    : 0
  const 기호수 = 프레임바이트수 * 2
  const 예상초 = 프레임바이트수 ? 프리앰블초 + 끝표식초 + 기호시간초구하기(기호수) : 0
  본문메타.textContent = `${원문.length} B ${문구('메타원문')} · ${압축된값.바이트.length} B ${압축표시}`
  미리보기원문.textContent = 바이트표시하기(원문.length)
  미리보기본문.textContent = `${바이트표시하기(압축된값.바이트.length)} ${압축표시}`
  미리보기프레임.textContent = `${바이트표시하기(프레임바이트수)} · ${기호수} ${문구('심볼')}`
  미리보기시간.textContent = 시간표시하기(예상초)
  미리보기반복.textContent = 프레임바이트수 ? `${청크반복}× · ${청크수} ${문구('청크들')}` : 문구('없음')
  길이경고.hidden = 원문.length <= 8192
  복사단추.disabled = !텍스트상자.value
}

async function 송신시작하기(): Promise<void> {
  if (송신 || 송신준비중) return

  const 텍스트 = 텍스트상자.value
  if (!텍스트.trim()) {
    단계쓰기(문구('붙여넣기먼저'))
    return
  }

  송신멈추기()
  송신준비중 = true
  단계쓰기(문구('준비중'))
  단추상태쓰기()
  시각화그리기(null, 0)

  let 맥락: AudioContext | null = null

  try {
    맥락 = new AudioContext({ sampleRate: 표본율 })
    if (맥락.state === 'suspended') {
      await 맥락.resume()
    }

    await 화면그리기기다리기()

    const 프레임 = await 프레임만들기(텍스트)
    const 기호들 = 바이트를음악기호로(프레임.바이트)
    const 오디오 = 오디오버퍼만들기(맥락, 기호들)
    const 소스 = 맥락.createBufferSource()
    const 이득 = 맥락.createGain()

    소스.buffer = 오디오.버퍼
    이득.gain.value = Number(볼륨슬라이더.value) / 100
    소스.connect(이득)
    이득.connect(맥락.destination)
    소스.onended = () => {
      if (송신?.소스 === 소스) 송신멈추기(false)
    }

    송신준비중 = false
    송신 = {
      맥락,
      이득,
      소스,
      시작초: 맥락.currentTime,
      기호수: 기호들.length,
      기호들,
      기호누적초들: 오디오.기호누적초들,
    }

    맥락 = null
    청크띠그리기(프레임.청크수, '대기')
    단계쓰기(문구('보내는중'))
    단추상태쓰기()
    소스.start()
    송신틱()
  } catch (오류) {
    송신준비중 = false
    if (맥락) {
      void 맥락.close()
    }
    단계쓰기(문구('송신실패'))
    console.error(오류)
    단추상태쓰기()
  }
}

function 송신멈추기(강제멈춤 = true): void {
  if (!송신) return
  if (강제멈춤) {
    try {
      송신.소스.stop()
    } catch {
      // 이미 끝난 소스는 멈출 수 없다.
    }
  }
  void 송신.맥락.close()
  송신 = null
  단계쓰기(강제멈춤 ? 문구('멈춤상태') : 문구('보냄'))
  기호값.textContent = '0 / 0'
  남은시간값.textContent = '-'
  시각화그리기(null, 0)
  단추상태쓰기()
}

function 송신틱(): void {
  if (!송신) return
  const 지난초 = 송신.맥락.currentTime - 송신.시작초 - 프리앰블초
  const 보낸수 = 기호위치찾기(송신.기호누적초들, 지난초)
  const 남은초 = Math.max(0, 송신.기호누적초들[송신.기호수] - Math.max(0, 지난초))
  const 현재기호 = 보낸수 < 송신.기호수 ? 송신.기호들[보낸수] : null
  기호값.textContent = `${보낸수} / ${송신.기호수}`
  남은시간값.textContent = 남은초 ? `${Math.ceil(남은초)}s` : '-'
  시각화그리기(현재기호, 송신.맥락.currentTime)
  requestAnimationFrame(송신틱)
}

async function 수신시작하기(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    단계쓰기(문구('마이크없음'))
    return
  }

  수신멈추기()
  수신초기화하기()

  try {
    const 흐름 = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    const 맥락 = new AudioContext({ sampleRate: 표본율 })
    const 소스 = 맥락.createMediaStreamSource(흐름)
    const 처리기 = 맥락.createScriptProcessor(4096, 1, 1)
    처리기.onaudioprocess = (사건) => {
      소리처리하기(사건.inputBuffer.getChannelData(0), 맥락.sampleRate)
    }
    소스.connect(처리기)
    처리기.connect(맥락.destination)
    수신 = { 맥락, 흐름, 처리기, 소스 }
    수신단계값 = '준비'
    단계쓰기(문구('듣는중'))
    단추상태쓰기()
  } catch (오류) {
    단계쓰기(오류 instanceof Error ? 오류.message : 문구('마이크없음'))
    수신멈추기()
  }
}

function 수신멈추기(): void {
  if (!수신) return
  수신.처리기.disconnect()
  수신.소스.disconnect()
  수신.흐름.getTracks().forEach((트랙) => 트랙.stop())
  void 수신.맥락.close()
  수신 = null
  수신단계값 = '대기'
  단추상태쓰기()
}

function 수신초기화하기(): void {
  수신버퍼 = new Float32Array(0)
  대기기호 = []
  예상본문바이트 = null
  예상청크수 = 0
  예상반복수 = 청크반복
  받은바이트 = []
  받은기호수 = 0
  청크띠그리기(0)
  기호값.textContent = '0 / 0'
  청크값.textContent = '0 / 0'
  신호대잡음값.textContent = '-'
  남은시간값.textContent = '-'
}

function 소리처리하기(입력: Float32Array, 입력표본율: number): void {
  수신버퍼 = 이어붙이기(수신버퍼, 입력)

  if (수신단계값 === '준비' && 프리앰블찾기(입력표본율)) {
    수신단계값 = '본문'
    단계쓰기(문구('받는중'))
  }

  if (수신단계값 !== '본문') {
    수신버퍼줄이기(입력표본율 * 2)
    return
  }

  while (true) {
    const 기호표본수 = Math.round(입력표본율 * 기호길이초구하기(받은기호수))
    if (수신버퍼.length < 기호표본수) break
    const 창 = 수신버퍼.slice(0, 기호표본수)
    수신버퍼 = 수신버퍼.slice(기호표본수)
    const 판정 = 음악기호찾기(창, 입력표본율, 받은기호수)
    대기기호.push(판정.기호)
    받은기호수 += 1
    신호대잡음값.textContent = `${판정.신호대잡음.toFixed(1)} dB`
    기호소비하기()
  }
}

function 프리앰블찾기(입력표본율: number): boolean {
  const 톤표본수 = Math.round(입력표본율 * 0.1)
  const 창수 = 10
  const 필요수 = 톤표본수 * 창수
  if (수신버퍼.length < 필요수) return false

  const 꼬리 = 수신버퍼.slice(수신버퍼.length - 필요수)
  let 맞은수 = 0
  for (let 순서 = 0; 순서 < 창수; 순서 += 1) {
    const 시작 = 순서 * 톤표본수
    const 창 = 꼬리.slice(시작, 시작 + 톤표본수)
    const 에너지들 = 프리앰블주파수.map((주파수) => 괴르첼(창, 입력표본율, 주파수))
    const 승자 = 에너지들[0] > 에너지들[1] ? 0 : 1
    if (승자 === 순서 % 2 && Math.max(...에너지들) > 0.002) 맞은수 += 1
  }

  if (맞은수 >= 8) {
    수신버퍼 = new Float32Array(0)
    return true
  }
  return false
}

function 기호소비하기(): void {
  const 바이트들 = 음악기호를바이트로(대기기호)
  if (바이트들.length < 16) return

  if (예상본문바이트 === null) {
    const 읽은헤더 = 헤더읽기(바이트들.slice(0, 16), 헤더문구찾기)
    if (!읽은헤더.성공) {
      수신단계값 = '오류'
      단계쓰기(읽은헤더.이유)
      수신멈추기()
      return
    }
    예상본문바이트 = 읽은헤더.본문길이
    예상청크수 = Math.ceil(읽은헤더.본문길이 / 청크크기)
    예상반복수 = 읽은헤더.반복수
    청크띠그리기(예상청크수, '대기')
  }

  if (예상본문바이트 === null) return
  const 전체프레임바이트 = 16 + 반복청크바이트수구하기(예상본문바이트, 예상청크수, 예상반복수)
  const 전체기호수 = 전체프레임바이트 * 2
  기호값.textContent = `${받은기호수} / ${전체기호수}`
  남은시간값.textContent = `${Math.max(0, Math.ceil(기호구간시간초구하기(받은기호수, 전체기호수)))}s`

  if (바이트들.length < 전체프레임바이트) return

  받은바이트 = 바이트들.slice(0, 전체프레임바이트)
  void 수신완료하기()
}

async function 수신완료하기(): Promise<void> {
  if (예상본문바이트 === null) return
  const 복구 = 프레임복구하기(받은바이트, 헤더문구찾기)
  청크띠그리기(복구.전체청크수, '대기', 복구.청크상태들)
  청크값.textContent = `${복구.성공청크수} / ${복구.전체청크수}`

  if (!복구.성공) {
    수신단계값 = '오류'
    단계쓰기(복구.이유 === '청크실패' ? 문구('청크실패') : 복구.이유)
    수신멈추기()
    return
  }

  try {
    const 원문 = await 압축풀기(복구.본문, 복구.헤더.압축됨)
    텍스트상자.value = new TextDecoder().decode(원문)
    await 메타갱신하기()
    복사단추.disabled = false
    수신단계값 = '완료'
    단계쓰기(문구('받음'))
    수신멈추기()
  } catch {
    수신단계값 = '오류'
    단계쓰기(문구('해제불가'))
    수신멈추기()
  }
}

function 오디오버퍼만들기(맥락: AudioContext, 기호들: number[]): 오디오결과 {
  const 표본결과 = 오디오표본만들기(기호들, 맥락.sampleRate)
  const 버퍼 = 맥락.createBuffer(1, 표본결과.표본들.length, 맥락.sampleRate)
  버퍼.getChannelData(0).set(표본결과.표본들)
  return { 버퍼, 기호누적초들: 표본결과.기호누적초들 }
}

function 바이트표시하기(바이트수: number): string {
  if (바이트수 < 1024) return `${바이트수} B`
  return `${(바이트수 / 1024).toFixed(1)} KB`
}

function 시간표시하기(초: number): string {
  if (!초) return '0s'
  if (초 < 60) return `${초.toFixed(1)}s`
  const 분 = Math.floor(초 / 60)
  const 남은초 = Math.round(초 % 60)
  return `${분}m ${남은초}s`
}

function 이어붙이기(왼쪽: Float32Array<ArrayBufferLike>, 오른쪽: Float32Array): Float32Array<ArrayBufferLike> {
  const 합친값 = new Float32Array(왼쪽.length + 오른쪽.length)
  합친값.set(왼쪽)
  합친값.set(오른쪽, 왼쪽.length)
  return 합친값
}

function 수신버퍼줄이기(최대길이: number): void {
  if (수신버퍼.length > 최대길이) {
    수신버퍼 = 수신버퍼.slice(수신버퍼.length - 최대길이)
  }
}

function 단계쓰기(값: string): void {
  단계값.textContent = 값
}

function 단추상태쓰기(): void {
  보내기단추.disabled = Boolean(송신) || 송신준비중
  멈춤단추.disabled = !송신
  듣기단추.textContent = 수신 ? 문구('듣기멈춤') : 문구('듣기')
  듣기단추.classList.toggle('listening', Boolean(수신))
}

function 화면그리기기다리기(): Promise<void> {
  return new Promise((계속하기) => {
    requestAnimationFrame(() => 계속하기())
  })
}

function 시각화그리기(기호: number | null, 시간초: number): void {
  const 볼륨 = Number(볼륨슬라이더.value) / 100
  const 피치번호 = 기호 === null ? null : (기호 >> 2) & 0b11
  const 리듬번호 = 기호 === null ? 0 : 기호 & 0b11
  const 움직임 = 기호 === null ? 0 : 0.62 + 리듬번호 * 0.08 + 0.14 * Math.sin(시간초 * Math.PI * 8)
  출력레벨막대.style.width = `${Math.max(0, Math.min(100, 볼륨 * 움직임 * 100))}%`

  이큐막대들.forEach((막대, 순서) => {
    const 가까움 = 피치번호 === null ? 0 : 순서 === 피치번호 ? 1 : 0.16
    const 바닥 = 피치번호 === null ? 7 : 14 + 의사잡음(순서, Math.floor(시간초 * 16)) * 6
    const 높이 = Math.max(6, Math.min(100, 바닥 + 가까움 * 78 * 볼륨))
    막대.style.height = `${높이}%`
    막대.style.opacity = 피치번호 === null ? '0.45' : 가까움 > 0.6 ? '1' : '0.58'
  })
}

function 청크띠그리기(개수: number, 기본상태: 청크상태 = '대기', 상태들: 청크상태[] = []): void {
  청크띠.innerHTML = ''
  if (!개수) {
    const 빈칸 = document.createElement('span')
    빈칸.className = 'chunk empty'
    빈칸.title = 문구('청크없음')
    청크띠.append(빈칸)
    return
  }
  for (let 순서 = 0; 순서 < 개수; 순서 += 1) {
    const 조각 = document.createElement('span')
    const 상태 = 상태들[순서] ?? 기본상태
    조각.className = `chunk ${상태클래스(상태)}`
    조각.title = `${문구('청크')} ${순서 + 1}: ${상태}`
    청크띠.append(조각)
  }
  청크값.textContent = `0 / ${개수}`
}

function 상태클래스(상태: 청크상태): string {
  if (상태 === '성공') return 'ok'
  if (상태 === '실패') return 'bad'
  return 'pending'
}
