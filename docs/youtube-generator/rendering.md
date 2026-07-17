# Rendering

PNG는 `/api/thumbnail`에서 Next.js `ImageResponse`로 1920×1080 이미지를 즉시 반환한다.

MP4 요청은 `/api/render`가 `render_jobs`에 기록한다. 로컬 처리는 다음 명령을 사용한다.

```bash
npm run render:worker -- <job-id>
```

워커는 Remotion 번들 생성, H.264 렌더, `youtube-renders` 업로드, 작업 상태 갱신 순서로 실행된다. Vercel 함수에서 Chromium 렌더를 직접 오래 실행하지 않는다. 운영에서는 `RENDER_WEBHOOK_URL`에 별도 워커나 Remotion Lambda 호환 어댑터를 연결한다.
