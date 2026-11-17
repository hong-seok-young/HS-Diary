# 💕 석영 ♥ 예은 데이트 일지 (HS Diary)

갔던 곳, 여행지, 맛집, 카페, 기념일까지 우리 둘의 모든 순간을 기록하는 귀여운 일지예요.

## 보는 법

`index.html`을 브라우저로 열면 끝! 서버나 설치가 필요 없어요.

GitHub Pages를 켜면 여기서도 볼 수 있어요: https://hong-seok-young.github.io/HS-Diary/

## 기록 추가하는 법

**방법 1. 사이트에서 입력하기**

1. `＋ 기록 추가` 버튼으로 입력해요. (이 브라우저에만 임시 저장돼요)
2. 맨 아래 `내보내기`에서 `entries.js 다운로드`를 눌러요.
3. 받은 파일로 `data/entries.js`를 덮어쓰고 깃에 올려요.

**방법 2. 파일 직접 고치기**

`data/entries.js`의 `DIARY_ENTRIES` 맨 위에 아래 모양으로 추가해요.

```js
{
  date: "2026-11-15",
  category: "food",       // date / travel / food / cafe / anniv / etc
  title: "성수동 파스타집",
  place: "서울 성수동",
  rating: 5,              // 하트 1~5
  memo: "크림 파스타가 진짜 맛있었음",
  tags: ["파스타", "성수"],
  photo: "pasta.jpg",     // photos/ 폴더 파일 이름 또는 이미지 URL
},
```

## 기본 정보

`data/entries.js` 맨 위 `DIARY_CONFIG`에 처음 만난 날, 사귄 날, 두 사람 생일이 들어 있어요.
여기 날짜로 D+ 숫자와 "다가오는 기념일"(100일 단위, 주년, 생일)이 자동 계산돼요.

## 배포

`main` 브랜치에 올리면 자동으로 https://hong-seok-young.github.io/HS-Diary/ 에 반영돼요.

## 사진

`photos/` 폴더에 사진을 넣고 `photo`에 파일 이름을 적으면 카드에 표시돼요.
