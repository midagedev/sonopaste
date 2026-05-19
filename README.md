# Jazzmodem

재즈 피아노 화성과 리듬에 텍스트 데이터를 실어 보내는 브라우저 기반 음향 모뎀입니다.

네트워크, 서버, 계정, 설치 없이 두 기기의 스피커와 마이크만으로 짧은 텍스트를 전송하는 것을 목표로 합니다.

## 현재 상태

Jazzmodem은 아직 실험 단계입니다. 현재 MVP는 재즈 블루스 진행 위에 음정과 리듬을 함께 싣는 음악 모뎀을 중심으로 구현되어 있습니다.

- 송신/수신 단일 페이지
- 재즈 피아노풍 합성음 기반 기호 전송
- 12마디 재즈 블루스와 ii-V 턴어라운드 기반 코드 진행
- 음정 2비트 + 리듬 2비트 음악 기호
- 브라우저 내장 Deflate 압축, 미지원 시 무압축 폴백
- CRC-16/CCITT 기반 청크 검증
- 깨진 청크 완화를 위한 3회 반복 전송
- 전송 시간, 텍스트 크기, 프레임 크기 미리보기
- 송신 중 VU 미터와 코드 톤 EQ 시각화
- 브라우저 로케일 기반 한국어/영어 UI
- Node 내장 테스트 러너 기반 변복조 테스트

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

현재 테스트는 CRC, 음악 기호 왕복, 반복 청크 복구, 합성 오디오 복조, 짧은 텍스트 전체 왕복을 검증합니다.

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

압축에는 브라우저 내장 `CompressionStream`/`DecompressionStream`을 사용합니다. 지원하지 않는 브라우저에서는 압축 없이 전송합니다.

## Name

Jazzmodem / 재즈모뎀
