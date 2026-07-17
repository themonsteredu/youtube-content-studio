# Setup

1. Node.js 20.9 이상을 설치한다.
2. `npm install`을 실행한다.
3. `.env.example`을 기준으로 `.env.local`을 만든다.
4. Supabase SQL Editor에서 `supabase/migrations/202607170001_youtube_studio.sql`을 실행한다.
5. 첫 관리자 계정을 Auth에 만든 뒤 `profiles` 테이블에 같은 UUID와 `admin` 역할을 넣는다.
6. `npm run dev`를 실행한다.

환경변수가 비어 있으면 인증 없는 데모 모드로 열린다. 실제 배포에는 반드시 Supabase 환경변수를 설정한다. `SUPABASE_SERVICE_ROLE_KEY`는 렌더 워커에만 넣고 브라우저에 노출하지 않는다.
