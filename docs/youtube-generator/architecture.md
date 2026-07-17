# Architecture

이 저장소는 기존 정적 사이트와 분리된 독립 Next.js App Router 애플리케이션이다.

## 구성

- Next.js 서버 컴포넌트: 관리자 권한 확인, 목록 조회
- 클라이언트 컴포넌트: 폼, 실시간 미리보기, Remotion Player
- Route Handlers: 이미지 업로드, PNG 생성, 렌더 작업 등록
- Supabase: Auth, Postgres, Storage, RLS
- Remotion: 브라우저 미리보기와 MP4 렌더 컴포지션 공유

`proxy.ts`는 세션 갱신만 담당한다. 실제 권한은 페이지의 `requireAdmin`과 API의 `assertAdminApi`에서 다시 검증한다.

MP4 렌더는 `src/lib/render/provider.ts`를 경계로 분리된다. `RENDER_WEBHOOK_URL`이 있으면 외부 워커로 전달하고, 없으면 DB 작업을 로컬 워커가 처리한다.
