# 결정의 순간 - 올인원 랜덤 추첨기 & 사다리 & 룰렛

줄바꿈 목록 무작위 추첨, 대화형 룰렛 돌림판, 사다리 타기 게임, 로또 6/45 번호 생성기 및 난수/주사위/동전 도구를 제공하는 깔끔한 다크 모드 웹 애플리케이션입니다.

---

## 🚀 GitHub Pages 배포 설정 안내

본 저장소에는 `.github/workflows/deploy.yml` 워크플로우가 포함되어 있어, 코드를 푸시하면 자동으로 GitHub Pages에 빌드 및 배포됩니다.

### 활성화 방법 (최초 1회 설정)

1. GitHub 저장소의 **Settings** 탭으로 이동합니다.
2. 왼쪽 메뉴에서 **Pages**를 클릭합니다.
3. **Build and deployment** 항목의 **Source**를 `Deploy from a branch` 대신 **`GitHub Actions`**로 변경합니다.
4. 이제 코드를 `main` 또는 `master` 브랜치에 푸시하면 Actions 탭에서 자동으로 빌드가 시작되고, 잠시 후 배포 URL(`https://<사용자이름>.github.io/<저장소이름>/`)로 접속할 수 있습니다.

---

## 🛠 로컬 개발 및 빌드

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```
