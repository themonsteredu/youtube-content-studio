# YouTube Content Studio

`별거 다하는 원장님` 채널용 관리자 콘텐츠 제작 도구입니다. 이미지 자산을 관리하고, 같은 입력값으로 16:9 썸네일 PNG와 Remotion 인트로 MP4를 만듭니다.

## 빠른 시작

```bash
npm install
npm run dev
```

Supabase 환경변수가 없으면 로컬 데모 모드로 실행됩니다. 운영 연결 절차는 `docs/youtube-generator/setup.md`를 참고하세요.

## 주요 경로

- `/admin/youtube-gallery`: 이미지 업로드 및 자산 검색
- `/admin/youtube-generator`: 썸네일/인트로 실시간 미리보기와 생성
- `/admin/youtube-history`: 렌더 작업 상태와 결과

## 검증

```bash
npm run lint
npm run typecheck
npm run build
```
