# Database

`profiles`는 사용자 역할, `media_assets`는 Storage 이미지 메타데이터, `render_jobs`는 PNG/MP4 작업 상태를 저장한다.

Storage 버킷:

- `youtube-assets`: 최대 10MB의 JPEG, PNG, WebP
- `youtube-renders`: 최대 500MB의 MP4

RLS는 관리자만 자산과 작업을 변경하도록 제한한다. 렌더 워커는 서비스 역할로 결과 파일과 작업 상태를 갱신한다. 운영에서 공개 결과 URL이 부적절하면 버킷을 비공개로 바꾸고 서명 URL을 발급하도록 데이터 접근 계층을 변경한다.
