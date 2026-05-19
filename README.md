# Jazzmodem

재즈 피아노 화성과 리듬에 텍스트 데이터를 실어 보내는 브라우저 기반 음향 모뎀입니다.

네트워크, 서버, 계정, 설치 없이 두 기기의 스피커와 마이크만으로 짧은 텍스트를 전송하는 것을 목표로 합니다.

## Links

- Web: [jazzmodem.midagedev.com](https://jazzmodem.midagedev.com)
- Repository: [github.com/midagedev/jazzmodem](https://github.com/midagedev/jazzmodem)

## 현재 상태

Jazzmodem은 아직 실험 단계입니다. 현재 MVP는 재즈 블루스 진행 위에 보이싱과 컴핑 리듬을 함께 싣는 음악 모뎀을 중심으로 구현되어 있습니다.

- 송신/수신 단일 페이지
- 재즈 피아노풍 합성음 기반 기호 전송
- 138BPM 스윙 8분 그리드와 12마디 재즈 블루스/ii-V 턴어라운드 기반 코드 진행
- 보이싱 3비트 + 컴핑 리듬 3비트 음악 기호
- 상성부 태그음 기반 저음량/잡음 내성 강화
- 스트리밍 표시를 위한 UTF-8 원문 청크 전송
- CRC-16/CCITT 기반 청크 검증
- 속도를 우선한 기본 청크 반복 1회
- 수신 중 CRC가 통과한 연속 청크를 textarea에 즉시 반영
- 전송 시간, 텍스트 크기, 프레임 크기 미리보기
- 송신 중 VU 미터와 코드 톤 EQ 시각화
- 브라우저 로케일 기반 한국어/영어 UI
- Node 내장 테스트 러너 기반 변복조 테스트

## 전송 컨셉

Jazzmodem은 단순 비프음 대신 음악적으로 들리는 전송음을 목표로 합니다. 현재 구현은 138BPM 스윙 8분 그리드, 12마디 재즈 블루스, ii-V 턴어라운드의 루트리스 피아노 보이싱을 따라가며, 각 음악 기호에 보이싱 3비트와 컴핑 리듬 3비트를 함께 실어 보냅니다.

몸통 화음은 재즈 피아노 질감을 만들고, 데이터 판정은 작은 스피커에서도 비교적 잘 살아남는 상성부 태그음에 더 집중합니다. 수신기는 전체 음량의 크기보다 프리앰블의 상대 패턴, 상성부 피크, 리듬 윤곽을 보도록 설계되어 저음량/저품질 상황에서 덜 흔들리게 했습니다.

오류 처리는 CRC-16/CCITT로 깨진 청크를 검출합니다. CRC 자체는 오류를 방지하는 장치가 아니라 검출하는 장치이며, 현재 기본값은 속도를 위해 청크 반복을 1회로 둡니다. Reed-Solomon 같은 FEC나 선택적 반복 전송은 v2 후보입니다.

## 원칙

- No network: CSP에서 `connect-src 'none'`
- No backend: 정적 파일만 배포
- No runtime dependencies: 앱 런타임은 브라우저 API만 사용
- No payload storage: 전송 텍스트는 메모리에서만 처리

## 개발

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test
```

현재 테스트는 CRC, 음악 기호 왕복, 깨진 청크 검출, 부분 프레임 읽기, 저음량+잡음 조건의 합성 오디오 복조, 짧은 텍스트 전체 왕복을 검증합니다.

## 빌드

```bash
npm run build
```

정적 산출물은 `dist/`에 생성됩니다.

Cloudflare Pages용 빌드는 커스텀 도메인 `jazzmodem.midagedev.com`에 맞춰 `/` base path를 사용합니다.

```bash
npm run build:cf
```

## 브라우저 요구사항

송신은 Web Audio API를 사용합니다. 수신은 마이크 권한이 필요하므로 배포 환경에서는 HTTPS가 필요합니다.

MVP는 수신 중 textarea가 자연스럽게 채워지는 UX를 우선해 압축하지 않은 UTF-8 청크를 전송합니다. 압축은 청크별 스트리밍 복원 전략을 정한 뒤 다시 켤 수 있습니다.

## 이름

Jazzmodem / 재즈모뎀
