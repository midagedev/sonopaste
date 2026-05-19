# Sonopaste

디바이스 간 짧은 텍스트를 소리로 옮기는 브라우저 기반 음향 모뎀입니다.

네트워크, 서버, 계정, 설치 없이 두 기기의 스피커와 마이크만으로 텍스트를 전송하는 것을 목표로 합니다.

## 현재 상태

Sonopaste는 아직 실험 단계입니다. 현재 MVP는 Balanced 모드 하나를 중심으로 구현되어 있습니다.

- 송신/수신 단일 페이지
- 8-FSK 기반 심볼 전송
- 브라우저 내장 Deflate 압축, 미지원 시 무압축 폴백
- CRC-16/CCITT 기반 청크 검증
- 깨진 청크 완화를 위한 3회 반복 전송
- 로파이/클린/블루스/재즈/덥스텝 사운드 정체성 선택
- 전송 시간, 텍스트 크기, 프레임 크기 미리보기
- 송신 중 VU 미터와 8-FSK EQ 시각화
- 브라우저 로케일 기반 한국어/영어 UI

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

## 빌드

```bash
npm run build
```

정적 산출물은 `dist/`에 생성됩니다.

## 브라우저 요구사항

송신은 Web Audio API를 사용합니다. 수신은 마이크 권한이 필요하므로 배포 환경에서는 HTTPS가 필요합니다.

압축에는 브라우저 내장 `CompressionStream`/`DecompressionStream`을 사용합니다. 지원하지 않는 브라우저에서는 압축 없이 전송합니다.

## Codename

Sonopaste
