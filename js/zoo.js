// ============================================================
// 동물 도감: 한 줄이 동물 한 종. 이 표 하나로 잠옷과 그림 속 동물을 모두 그려요.
// 아이디, 이름, 몸 색, 배 색, 귀, 꼬리, 특징, 포인트 색, 성격
// 귀: R 둥근 L 긴 P 뾰족 T 작은 F 처진 G 개구리눈 K 코알라 D 뿔(사슴) S 등가시 U 볏털 N 없음 B 큰귀 H 작은뿔 A 더듬이
// 꼬리: p 솜 l 긴 b 풍성 d 공룡 c 돼지 u 위로 n 짧은 r 줄무늬 f 지느러미 - 없음
// 특징: s 줄무늬 d 점박이 m 눈가 무늬 z 밝은 주둥이 n 코 k 부리 o 돼지코 w 곱슬털 g 갈기 v 이마 흰줄 c 볏
//       h 뿔 f 등지느러미 p 얼룩 l 짙은 발 e 짙은 귀 y 큰 눈 t 이빨 q 등딱지 i 날개
// 성격: w 물을 좋아해요 / c 고양이처럼 / (없음) 순해요
// ============================================================
(function () {
  "use strict";
  const RAW = `
bear,곰돌이,b98a62,ecd2b0,R,p,zn,f2b8a0
bunny,토끼,fff8f0,ffd8e2,L,p,n,ffb0c8
cat,고양이,98a3b5,dde2ea,P,l,n,f2a0b4,c
sheep,아기 양,f4ece0,fbe6d2,F,p,w,f6a8b8
hippo,아기 하마,c9b6e6,f8d6e6,T,n,z,ff9ab8,w
puppy,강아지,f2d1a4,fff6e6,F,u,zn,d9a46c
frog,개구리,8cd47a,d8f2b8,G,-,,ffffff,w
chick,병아리,ffe066,fff2b0,U,-,k,ff9a3c
panda,판다,ffffff,ffffff,R,p,mlen,3a3a44
fox,여우,f29a4a,fff4e6,P,b,zn,4a3428
tiger,호랑이,ffb04a,fff4e6,R,r,szn,5a3a28,c
penguin,펭귄,3e4a5e,ffffff,N,-,k,ff9a3c,w
dino,공룡,7cc46e,fff2b0,S,d,,ffd34d
pig,아기 돼지,ffc0cc,ffe0e6,P,c,o,ff8aa0
koala,코알라,a8b0bc,e6e8ee,K,-,n,3a3a44
deer,아기 사슴,c98a5a,fff4e6,D,p,dn,e8c890
dg01,시바견,f0a85a,fff4e6,P,c,zn,4a2a18
dg02,검은 시바,3e3a3a,f6e6d0,P,c,zn,d8a46a
dg03,말티즈,ffffff,fff4f6,F,u,wn,ff9ab8
dg04,비숑,ffffff,ffffff,R,p,wn,2e221c
dg05,푸들,9a6a4a,b8886a,F,p,wn,2e1a12
dg06,토이 푸들,f2c8a0,fbe2c8,F,p,wn,6a4a36
dg07,포메라니안,f7b060,fff2e0,P,b,gzn,e09040
dg08,웰시코기,f2a85c,fff6ea,P,n,zvn,2e221c
dg09,골든 리트리버,e8b860,f6dca0,F,b,zn,6a4a2a
dg10,래브라도,f2deb0,fbeed0,F,l,zn,4a3428
dg11,검은 래브라도,3a3632,5a5650,F,l,n,8a8078
dg12,허스키,8a94a8,ffffff,P,b,mzvn,4a5468
dg13,말라뮤트,6a7078,ffffff,P,b,mzn,3a4048
dg14,사모예드,ffffff,fff8f8,P,b,zn,2e221c
dg15,진돗개,fff6e0,ffffff,P,c,zn,3a2a20
dg16,황구,e0a860,f6e0b0,P,c,zn,4a3020
dg17,삽살개,c8c0b0,e0d8c8,F,b,wn,6a6258
dg18,풍산개,fbf6ec,ffffff,P,c,n,3a2a20
dg19,닥스훈트,9a5a34,c88a5a,F,l,zn,3a2014
dg20,비글,f6efe2,ffffff,F,u,pzn,a8642e
dg21,불도그,f0e0c8,ffffff,T,n,pzn,b8926a
dg22,프렌치 불도그,6a6460,d8d0c8,B,n,zn,3a3632
dg23,퍼그,e8cfa0,f6e6c8,T,c,mn,3a302a
dg24,치와와,f0c890,fbe6c8,B,u,zn,6a4a36
dg25,요크셔테리어,b8864a,e8c890,P,u,gn,5a5a6a
dg26,슈나우저,8a8a90,e6e6ea,P,n,zn,3a3a40
dg27,도베르만,3a302c,c8864a,P,n,zn,c8864a
dg28,로트와일러,2e2a28,b87a44,F,n,zn,b87a44
dg29,달마티안,ffffff,ffffff,F,l,dn,2e2a2e
dg30,보더콜리,2e2e34,ffffff,F,b,vzn,ffffff
dg31,셰퍼드,c8924a,e8c890,P,b,mn,3a302a
dg32,차우차우,d8904a,e8b070,R,b,gn,5a4a8a
dg33,시추,f6efe6,ffffff,F,u,pwn,a87a4a
dg34,페키니즈,e8c488,f6e2b8,F,b,mgn,4a3a30
dg35,코커스패니얼,d8a058,f0cc90,F,n,wn,6a4420
dg36,그레이하운드,b0b4bc,e6e8ec,F,l,n,5a5e66
dg37,세인트버나드,f6efe6,ffffff,F,b,pvzn,a8582e
dg38,버니즈 마운틴,2e2a2a,ffffff,F,b,vzn,c8763a
dg39,올드잉글리시 쉽독,d0d4dc,ffffff,F,p,wn,8a90a0
dg40,바셋하운드,f6efe6,ffffff,F,l,pn,a8642e
dg41,잭러셀,ffffff,ffffff,F,u,pn,c8864a
dg42,아키타,e8a868,fff6ea,P,c,zn,3a2a20
dg43,스피츠,ffffff,ffffff,P,b,gn,2e221c
dg44,파피용,ffffff,ffffff,B,b,pen,a85a2a
dg45,콜리,e0a060,ffffff,P,b,vgzn,6a4020
ct01,치즈 태비,f2b060,fff0d8,P,r,szn,d8883a,c
ct02,고등어 태비,8a8e96,e6e8ec,P,r,szn,4a4e56,c
ct03,턱시도,2e2e34,ffffff,P,l,vzn,ffffff,c
ct04,삼색이,ffffff,ffffff,P,l,pn,f0a050,c
ct05,까만 고양이,2a2a30,3a3a42,P,l,yn,f0d040,c
ct06,하얀 고양이,ffffff,fff6f8,P,l,n,ffb0c8,c
ct07,샴,f6ead8,fff6ea,P,l,mlen,5a4032,c
ct08,러시안 블루,8a9ab0,b8c4d4,P,l,n,5a6a80,c
ct09,페르시안,f6f0e8,ffffff,T,b,gn,c8b8a0,c
ct10,스코티시 폴드,d8c8b0,f0e6d6,T,l,zn,8a7458,c
ct11,메인쿤,8a6a4a,d8c0a0,P,b,sgn,4a3422,c
ct12,노르웨이숲,a8a098,f0ece6,P,b,gzn,5a5248,c
ct13,벵갈,e0a850,f6e0b0,P,r,dn,5a3a1a,c
ct14,스핑크스,f0c8b8,f8dcd0,B,l,n,d89a88,c
ct15,아비시니안,d8905a,f0c090,B,l,n,7a4422,c
ct16,봄베이,1e1e24,2e2e36,P,l,yn,e8a020,c
ct17,터키시 앙고라,ffffff,ffffff,P,b,yn,6ab0e0,c
ct18,랙돌,f6f0e6,ffffff,P,b,mgn,8a7a6a,c
ct19,먼치킨,98a3b5,dde2ea,P,n,zn,f0a030,c
ct20,브리티시 숏헤어,8d99ab,c9d0da,T,l,zn,f0a030,c
ct21,코리안 숏헤어,f6ead8,ffffff,P,l,pn,8a8e96,c
ct22,카오스,3a3230,5a4a40,P,l,pn,d8883a,c
ct23,버만,f6ecd8,ffffff,P,b,mlen,6a5040,c
ct24,히말라얀,f6f0e6,ffffff,T,b,mgn,6a5a50,c
ct25,이집션 마우,c8c8cc,e6e6ea,P,r,dn,4a4a50,c
ct26,오시캣,d8a868,f0d8a8,P,r,dn,6a4420,c
ct27,사바나,e8c078,f6e4b8,B,r,dn,3a2a18,c
ct28,데본 렉스,b8a898,d8ccc0,B,l,wn,7a6a5a,c
ct29,엑조틱,e8a860,f6d8a8,T,l,szn,b8742e,c
ct30,소말리,d8804a,f0b880,P,b,gn,7a3a1a,c
ct31,샤르트뢰,7a8698,a8b2c2,P,l,yn,e8a020,c
ct32,라가머핀,d8c8b8,ffffff,P,b,vgn,8a7868,c
ct33,젖소 고양이,ffffff,ffffff,P,l,pn,2e2e34,c
ct34,회색 줄무늬,b0b4bc,e8eaee,P,r,sn,6a6e76,c
ct35,연어색 고양이,f6c0a0,fbe0d0,P,l,sn,e09a70,c
wb01,북극곰,fbfbff,ffffff,R,p,n,2e2e34,w
wb02,반달가슴곰,2e2a2e,3e3a3e,R,p,vzn,f6ecd8
wb03,불곰,8a5a34,b88a5a,R,p,zn,3a2414
wb04,회색곰,8a7a6a,b0a090,R,p,gzn,4a3e34
wb05,안경곰,3a3230,4a403c,R,p,mzn,e8d8b8
wb06,말레이곰,2e2826,3a3230,R,n,zvn,e8a84a
wb07,레서판다,d8683a,3a2a26,R,r,mzn,ffffff
wb08,너구리,8a8a8a,d8d8d8,R,r,mn,3a3a3e
wb09,라쿤,9a9aa0,e0e0e4,P,r,mzn,2e2e34
wb10,오소리,6a6a70,3a3a40,T,n,vzn,ffffff
wb11,스컹크,2a2a30,3a3a42,T,b,vn,ffffff
wb12,수달,8a6a4a,e0cdb0,T,l,zn,3a2a1a,w
wb13,해달,7a5a44,e8dcc8,T,l,zn,3a2a20,w
wb14,비버,8a5a38,b88a60,T,n,tn,f6f0e0,w
wb15,족제비,c8905a,fff4e0,T,l,zn,5a3a1e
wb16,담비,e8c060,fff0c0,R,b,n,5a4020
wb17,밍크,5a4034,7a5a4a,T,l,n,f6ecd8,w
wb18,미어캣,d8b888,f0dcb8,T,l,mn,5a4630
wb19,몽구스,a89068,c8b490,T,l,n,5a4a30
wb20,나무늘보,a89878,c8bca0,N,-,mn,6a5a40
wb21,개미핥기,8a8a90,c8c8cc,T,b,sn,2e2e34
wb22,아르마딜로,c8a888,e0ccb4,P,l,qn,8a6a50
wb23,고슴도치,d8c0a0,f6ecd8,T,-,qn,7a5a3a
wb24,두더지,5a5058,7a707a,N,n,n,f2a0b4
wb25,박쥐,5a4a6a,8a7a9a,B,-,in,3a2e4a
wb26,과일박쥐,8a5a3a,c89060,B,-,in,3a2a1e
wb27,캥거루,c8905a,f0d8b0,L,l,n,7a5030
wb28,왈라비,a88a70,e0d0bc,L,l,n,5a4636
wb29,웜뱃,8a7a6a,a89888,R,-,n,3a302a
wb30,태즈메이니아데블,2e2a2e,3e3a3e,R,l,vn,ffffff
wb31,쿼카,b8946a,d8bc98,R,n,zn,5a4030
wb32,주머니쥐,d0d0d4,ffffff,B,l,n,f2a0b4
wb33,오리너구리,7a5a44,a88a70,N,n,k,4a4a50,w
wb34,가시두더지,6a5a4a,8a7a68,N,-,qk,e8d8b8
wb35,늑대,8a8e96,e0e2e6,P,b,zn,3a3e46
wb36,북극늑대,f6f6fa,ffffff,P,b,zn,5a5e66
wb37,코요테,c8a070,f0dcb8,P,b,zn,6a4a2a
wb38,자칼,d8a860,f0d8a0,P,b,zn,5a4a3a
wb39,하이에나,c8b088,e0d0b0,R,n,dzn,4a3a2a
wb40,리카온,c89a50,f0e0c0,B,b,pn,2e2620
wb41,북극여우,fbfbff,ffffff,P,b,n,3a3a44
wb42,사막여우,f6dca8,fff4e0,B,b,n,3a2a20
wb43,은여우,5a5e68,c8ccd4,P,b,zn,ffffff
wb44,붉은여우,e8743a,ffffff,P,b,zln,2e2220
wb45,사자,e8b860,f6dc9a,R,l,gzn,a8642e,c
wb46,암사자,e8c078,f6e2a8,R,l,zn,8a5a2a,c
wb47,백사자,fbf6ec,ffffff,R,l,gzn,d8ccb8,c
wb48,백호,fbfbff,ffffff,R,r,szn,3a3a44,c
wb49,표범,f0c060,fff0c0,R,l,dzn,3a2a18,c
wb50,눈표범,e0e2e8,ffffff,R,b,dzn,5a5e68,c
wb51,흑표범,26262c,34343c,R,l,yn,e8d040,c
wb52,치타,f0c870,fff0c8,R,l,dmn,2e2418,c
wb53,재규어,e8a850,f6dca0,R,l,dzn,3a2414,c
wb54,퓨마,c8a078,f0dcc0,R,l,zn,5a4030,c
wb55,스라소니,c8a880,f0e0c8,P,n,dzn,3a2e24,c
wb56,삵,b89868,e8d8b8,P,r,sdn,3a2e20,c
wb57,카라칼,d8985a,f6dcb8,P,l,en,2e2420,c
wb58,서벌,e8c070,fff0c8,B,l,dn,2e2418,c
wb59,오셀롯,e0b060,f6e4b0,R,r,dn,3a2a18,c
wb60,코끼리,a8b0bc,c8ced8,B,n,tn,f6f0e0
wb61,아기 코끼리,b8c4d4,d8e0ea,B,n,n,f2a0b4
wb62,매머드,8a5a3a,a87a58,B,n,gtn,f6f0e0
wb63,코뿔소,9a9aa0,b8b8be,T,n,hn,e8e0d0
wb64,기린,f0c860,fff0c0,H,l,pn,b8742e
wb65,얼룩말,ffffff,ffffff,P,l,sgn,2e2e34
wb66,오카피,6a3a2a,ffffff,B,l,sn,2e2020
wb67,영양,d8a868,ffffff,H,n,zn,3a2a1a
wb68,가젤,e8b878,ffffff,H,n,szn,3a2a1a
wb69,누,5a5a62,7a7a82,H,l,gn,2e2e34
wb70,물소,3e3a3e,5a565a,H,l,n,c8c0b0,w
wb71,들소,6a4630,8a6448,H,n,gn,2e2018
wb72,낙타,d8b078,f0d8a8,T,n,zn,8a6a3a
wb73,쌍봉낙타,c89a60,e8c890,T,n,gzn,7a5428
wb74,라마,f6ecd8,ffffff,L,p,wn,a88a6a
wb75,알파카,fbf2e0,ffffff,P,p,wn,d8b890
wb76,과나코,d89a5a,ffffff,L,p,zn,5a5a62
wb77,순록,a88a6a,f0e6d6,D,p,zn,d8363a
wb78,엘크,8a6240,c8a880,D,p,gn,3a2818
wb79,무스,5a4030,7a5a48,D,n,zn,2e2018
wb80,고라니,c89a68,f6e6cc,T,p,tn,3a2a1a
wb81,노루,b88858,f0dcc0,H,p,zn,3a2a1a
wb82,꽃사슴,d89a5a,fff4e0,D,p,dn,ffffff
wb83,산양,8a8a90,d8d8dc,H,n,gn,3a3a40
wb84,아이벡스,a8906a,d8c8a8,H,n,gn,4a3a24
wb85,멧돼지,6a5448,8a7466,P,c,ton,3a2a22
wb86,아기 멧돼지,c89a68,f0d8b0,P,c,son,6a4428
wb87,혹멧돼지,8a7a70,a89a90,P,l,gton,f6f0e0
wb88,맥,2e2e34,ffffff,T,n,pn,ffffff,w
wb89,카피바라,b88a5a,d8b088,T,-,n,5a3a20,w
wb90,고릴라,3a3a40,5a5a62,T,-,zn,8a8a92
wb91,침팬지,3e342e,e8c8a8,B,-,zn,e8c8a8
wb92,오랑우탄,d8743a,e8a070,T,-,gzn,6a3418
wb93,긴팔원숭이,e8d8b8,fff6e0,T,-,mn,2e2620
wb94,일본원숭이,c8b8a0,f09a9a,T,n,zn,d86a6a
wb95,맨드릴,6a6a5a,e8e0c0,T,n,vzn,3a8ae0
wb96,다람쥐원숭이,e8c060,fff6e0,B,l,mn,3a302a
wb97,알락꼬리여우원숭이,a8a8ac,ffffff,P,r,mn,2e2e34
wb98,안경원숭이,c8a880,e8d8c0,B,l,yn,e8a020
wb99,코주부원숭이,d89060,f0d0b0,T,l,zn,f0a888
rd01,햄스터,f6d8a8,ffffff,R,n,zn,f2a0b4
rd02,골든 햄스터,e8b060,ffffff,R,n,pn,f2a0b4
rd03,드워프 햄스터,d0d0d8,ffffff,R,n,vn,5a5a66
rd04,기니피그,f6ecd8,ffffff,T,-,pn,c8763a
rd05,친칠라,b0b4c0,e6e8ee,B,b,n,5a5e6a
rd06,다람쥐,c8763a,fff0d8,P,b,szn,5a2e14
rd07,청설모,5a4a4a,e0d8d0,P,b,n,3a2e2e
rd08,하늘다람쥐,b8a898,ffffff,R,b,iyn,5a4a40
rd09,생쥐,d8d8de,ffffff,B,l,n,f2a0b4
rd10,들쥐,b89a78,f0e0c8,B,l,n,f2a0b4
rd11,흰쥐,ffffff,ffffff,B,l,n,f08aa0
rd12,저빌,e8c890,ffffff,T,l,n,6a4a2a
rd13,프레리도그,d8b480,f6e2c0,T,n,n,5a4024
rd14,마멋,a88a60,d8c098,T,b,tn,4a3418
rd15,호저,5a4a40,7a6a5e,T,-,qn,f6f0e0
rd16,데구,a88868,e8d8c0,R,l,n,5a4030
rd17,우는토끼,c8a880,f0e0c8,R,-,n,5a4030
rd18,롭이어 토끼,f6d8b0,ffffff,F,p,n,f2a0b4
rd19,더치 토끼,3a3a40,ffffff,L,p,vn,ffffff
rd20,앙고라 토끼,ffffff,ffffff,L,p,wn,ffb0c8
rd21,산토끼,b8946a,f6e6cc,L,p,n,3a2a1a
rd22,눈토끼,fbfbff,ffffff,L,p,en,2e2e34
rd23,회색 토끼,a8acb8,e6e8ee,L,p,n,f2a0b4
rd24,점박이 토끼,ffffff,ffffff,L,p,pn,5a4a40
rd25,까만 토끼,2e2e34,3e3e46,L,p,n,f2a0b4
fm01,젖소,ffffff,ffd8e0,H,l,pon,2e2e34
fm02,한우,c8843a,e8b070,H,l,on,f0c8b0
fm03,송아지,e8c090,fff0dc,F,l,on,f0b8a8
fm04,하이랜드 소,c8763a,e09a5a,H,l,gon,f6e6c8
fm05,칡소,a8642e,c8843a,H,l,son,3a2414
fm06,말,a8642e,c88a50,P,b,gvn,3a2414
fm07,백마,fbfbff,ffffff,P,b,gn,d8d8e0
fm08,흑마,2a2a30,3a3a42,P,b,gn,5a5a66
fm09,얼룩말 망아지,f6ecd8,ffffff,P,b,pgn,8a5a34
fm10,조랑말,e8c890,f6e2b8,P,b,gn,6a4a2a
fm11,당나귀,a8a8b0,f0f0f2,L,l,zn,5a5a62
fm12,노새,8a6a50,d8c8b0,L,l,zn,4a3424
fm13,염소,ffffff,ffffff,H,n,gn,d8d0c0
fm14,흑염소,2e2a2e,3e3a3e,H,n,gn,8a8088
fm15,아기 염소,f6ecd8,ffffff,F,n,n,d8a878
fm16,검은 양,3a3438,5a5258,F,p,wn,f6a8b8
fm17,메리노 양,fbf6ec,ffe6d8,H,p,wn,d8c8a8
fm18,흑돼지,3a3438,4a444a,P,c,o,7a6a72
fm19,점박이 돼지,ffc8d0,ffe0e6,P,c,po,5a4a50
fm20,미니피그,f6b0c0,ffd8e0,F,c,o,ff8aa0
fm21,닭,ffffff,ffffff,N,u,ck,e8504f
fm22,수탉,c8642e,e8a050,N,b,ck,e8363a
fm23,오골계,2e2e34,3e3e46,U,u,wk,5a5a66
fm24,청계,8a94a8,b8c0d0,N,u,ck,e8504f
fm25,오리,ffffff,ffffff,N,u,k,ffb030,w
fm26,청둥오리,8a7a68,e8e0d0,N,u,vk,2e8a5a,w
fm27,아기 오리,ffe680,fff4b8,N,-,k,ff9a3c,w
fm28,거위,fbfbff,ffffff,N,u,k,ff8a2a,w
fm29,칠면조,6a4a3a,8a6a58,N,b,ck,e8363a
fm30,메추라기,b89a78,e8d8c0,U,-,dk,5a4630
bd01,참새,c89a68,f6ecd8,N,u,mk,5a3a20
bd02,박새,5a6a7a,f6f6e8,N,u,vk,2e2e34
bd03,뱁새,d8b898,f6e6d4,N,l,k,5a4636
bd04,까치,2a2a34,ffffff,N,l,k,3a5aa8
bd05,까마귀,24242a,34343c,N,u,k,5a5a66
bd06,비둘기,a8b0c0,d8dce6,N,u,k,7a5aa8
bd07,제비,2e3a5a,ffffff,N,f,k,d8503a
bd08,직박구리,8a8a90,c8c8cc,U,l,k,5a3a2a
bd09,꾀꼬리,ffd83a,fff0a0,N,u,mk,2e2e34
bd10,파랑새,4a8ae0,d8ecff,N,u,k,2e4a8a
bd11,울새,a88a70,f08a4a,N,u,k,5a4636
bd12,동박새,a8c84a,f6f6d8,N,u,yk,5a6a1a
bd13,딱따구리,2e2e34,ffffff,U,u,ck,e8363a
bd14,물총새,3a9ae0,f0903a,N,n,k,2a5a9a,w
bd15,벌새,3ac89a,d8f6ec,N,n,ik,e83a7a
bd16,앵무새,e8363a,ffd83a,N,l,k,3a6ae0
bd17,왕관앵무,f6e680,fff6c0,U,l,ck,f08a3a
bd18,사랑앵무,8ad84a,f6f6a0,N,l,dk,3a8ae0
bd19,모란앵무,6ac85a,f6c84a,N,n,k,e8503a
bd20,코카투,fbfbff,ffffff,U,u,ck,ffd83a
bd21,청금강앵무,3a7ae0,ffd83a,N,l,k,2e2e34
bd22,회색앵무,a8acb8,d8dce4,N,n,k,e8363a
bd23,카나리아,ffe24a,fff4a8,N,u,k,f0903a
bd24,문조,fbfbff,ffffff,N,u,k,f08aa0
bd25,십자매,f6ecd8,ffffff,N,u,pk,8a5a34
bd26,부엉이,8a6a4a,d8c0a0,P,n,yk,f0b030
bd27,올빼미,a89878,e8dcc8,N,n,yk,5a4630
bd28,흰올빼미,fbfbff,ffffff,N,n,ydk,5a5a66
bd29,원숭이올빼미,e8c890,ffffff,N,n,yk,c89a50
bd30,소쩍새,8a7a6a,c8bca8,P,n,yk,f0d040
bd31,독수리,5a4030,ffffff,N,b,k,ffc83a
bd32,매,6a7080,f0e8d8,N,u,mk,ffc83a
bd33,솔개,a8703a,d8a870,N,f,k,ffc83a
bd34,황조롱이,d8904a,f6e0c0,N,u,dk,5a6a8a
bd35,콘도르,2e2e34,ffffff,N,b,k,f0a8a0
bd36,홍학,ff9ab8,ffd0dc,N,-,k,2e2e34,w
bd37,백조,fbfbff,ffffff,N,u,k,f08a2a,w
bd38,흑조,2a2a30,3a3a42,N,u,k,e8363a,w
bd39,두루미,fbfbff,ffffff,N,b,ck,e8363a,w
bd40,황새,fbfbff,ffffff,N,b,k,e8503a,w
bd41,왜가리,a8b0c0,ffffff,U,u,k,ffc83a,w
bd42,백로,fbfbff,ffffff,U,u,k,ffc83a,w
bd43,펠리컨,fbfbff,ffe6c0,N,u,k,ffb030,w
bd44,갈매기,fbfbff,ffffff,N,u,k,ffc83a,w
bd45,퍼핀,2e2e34,ffffff,N,-,mk,f0703a,w
bd46,알바트로스,fbfbff,ffffff,N,u,ik,f0c8a0,w
bd47,가마우지,2e3438,4a5258,N,u,k,f0b030,w
bd48,원앙,d8763a,f6ecd8,U,u,vck,3a8a5a,w
bd49,물닭,2e2e34,3e3e46,N,-,vk,ffffff,w
bd50,황제펭귄,2e3440,ffffff,N,-,vk,ffc83a,w
bd51,아델리펭귄,24282e,ffffff,N,-,yk,f0703a,w
bd52,아기 펭귄,a8b0bc,ffffff,N,-,mk,2e3440,w
bd53,바위뛰기펭귄,2e3038,ffffff,U,-,ck,ffd83a,w
bd54,타조,3a3438,f6ecd8,N,b,k,f0b0a0
bd55,에뮤,6a5a4a,8a7a68,N,b,k,5a8ae0
bd56,키위새,8a6a4a,a88a68,N,-,k,f0e0c8
bd57,공작,2a8ab8,3ac8a8,U,b,dck,ffd83a
bd58,꿩,a8642e,d8a050,N,l,vk,e8363a
bd59,큰부리새,2e2e34,ffffff,N,u,k,ffa02a
bd60,코뿔새,2e2e34,ffffff,N,l,hk,ffc83a
bd61,극락조,8a3a2a,ffd83a,U,b,ck,3ac8a8
bd62,도도새,a8a8b0,d8d8de,N,u,k,f0c84a
bd63,뻐꾸기,8a94a8,ffffff,N,l,sk,ffc83a
bd64,종달새,c8a878,f6ecd8,U,u,dk,5a4630
bd65,후투티,f0b070,fff0d8,U,l,sck,2e2e34
sa01,돌고래,7ab0d8,e6f2fa,N,f,fz,3a6a9a,w
sa02,분홍돌고래,ffb0c8,ffe0e8,N,f,fz,e87a9a,w
sa03,범고래,24282e,ffffff,N,f,mf,ffffff,w
sa04,흰고래,fbfbff,ffffff,N,f,z,d8e0ea,w
sa05,대왕고래,5a8ac8,c8dcf0,N,f,z,3a5a8a,w
sa06,혹등고래,3a4a5a,e6ecf2,N,f,dz,2a3440,w
sa07,향유고래,6a7480,8a949e,N,f,t,ffffff,w
sa08,일각고래,d8e0ea,ffffff,N,f,dh,f6f0e0,w
sa09,상괭이,a8b4c0,e6ecf2,N,f,z,6a7480,w
sa10,물개,6a5a50,8a7a6e,T,f,zn,2e2622,w
sa11,바다사자,a87a50,c89a70,T,f,zn,4a3018,w
sa12,물범,c8ccd4,ffffff,N,f,dzn,6a6e78,w
sa13,아기 물범,fbfbff,ffffff,N,f,yn,2e2e34,w
sa14,바다코끼리,a8785a,c89a80,N,f,tzn,f6f0e0,w
sa15,매너티,a8b0b8,c8ced4,N,f,zn,6a7078,w
sa16,듀공,c8c0b0,e0dace,N,f,zn,8a8274,w
sa17,상어,7a8a9a,ffffff,N,f,ft,ffffff,w
sa18,백상아리,a8b4c0,ffffff,N,f,ft,ffffff,w
sa19,고래상어,4a6a8a,ffffff,N,f,dfz,ffffff,w
sa20,망치상어,8a94a0,e6eaf0,B,f,f,5a646e,w
sa21,가오리,6a7a8a,ffffff,B,l,i,4a5a6a,w
sa22,쥐가오리,2e3440,ffffff,B,l,i,ffffff,w
sa23,흰동가리,ff8a2a,ffffff,N,f,sf,2e2e34,w
sa24,블루탱,3a6ae0,ffe24a,N,f,pf,2e2e34,w
sa25,복어,f6e6a0,ffffff,N,f,dq,a88a3a,w
sa26,금붕어,ff8a3a,ffd8a0,N,f,f,ffffff,w
sa27,비단잉어,ffffff,ffffff,N,f,pf,f0503a,w
sa28,구피,6ac8e0,ffe6a0,N,f,df,f08a3a,w
sa29,베타,8a3ae0,d8a0f6,N,f,gf,e83a7a,w
sa30,엔젤피시,f6f0d8,ffffff,U,f,sf,2e2e34,w
sa31,해마,ffc84a,fff0b0,U,c,q,f08a3a,w
sa32,개복치,a8b4c0,d8e0e8,N,-,f,6a7480,w
sa33,아귀,6a5040,8a7060,A,f,ty,ffe24a,w
sa34,참치,3a5a8a,e6ecf2,N,f,f,ffd83a,w
sa35,연어,c8ccd4,ffb0a0,N,f,df,f0705a,w
sa36,날치,5a9ae0,ffffff,N,f,if,3a6aa8,w
sa37,곰치,8a7a3a,c8b870,N,l,dt,3a3018,w
sa38,문어,e8605a,f6a8a0,N,-,dy,a8302a,w
sa39,대왕문어,c83a4a,f08a90,N,-,y,8a1a2a,w
sa40,오징어,f6d8d0,ffffff,U,-,y,e8a8a0,w
sa41,갑오징어,d8b890,f6e6d0,N,-,sy,8a6a4a,w
sa42,해파리,c8a8f6,ecdcff,N,-,d,a078e0,w
sa43,꽃게,e8503a,f6a890,A,-,qy,a8281a,w
sa44,소라게,f0906a,f6c8b0,A,-,qy,c8a878,w
sa45,바닷가재,d8362a,f08a70,A,f,qs,8a1a14,w
sa46,새우,ffa890,ffd8c8,A,f,s,e86a50,w
sa47,불가사리,ffb04a,ffd890,N,-,d,e8803a,w
sa48,성게,3a2a4a,5a4a6a,S,-,q,8a6ab8,w
sa49,조개,f6e0d0,ffffff,N,-,sq,e8b0a0,w
sa50,가리비,ffb8a0,ffe0d0,N,-,sq,e8806a,w
sa51,소라,e8c8a0,fff0dc,N,-,sq,c8946a,w
sa52,해삼,6a4a3a,8a6a58,S,-,d,3a2a20,w
sa53,바다거북,6aa87a,d8f0c0,N,n,q,3a6a4a,w
sa54,장수거북,3a4a5a,6a7a8a,N,n,qd,ffffff,w
sa55,가재,c8503a,e89a80,A,f,q,7a2a1a,w
rp01,거북이,7ab86a,e6f2c0,N,n,q,8a6a3a,w
rp02,육지거북,a8a070,d8d4a8,N,n,qd,6a5a2a
rp03,자라,7a8a5a,d8dcb0,N,n,qo,4a5a2a,w
rp04,악어,5a9a5a,d8ecb0,S,d,ty,3a6a3a,w
rp05,아기 악어,8ac86a,e6f6c0,S,d,y,4a8a3a,w
rp06,카멜레온,6ac86a,c8f0a0,U,c,sy,e8c83a
rp07,이구아나,7ab85a,c8e8a0,S,d,dy,3a6a2a
rp08,도마뱀,a8c86a,e6f0c0,N,d,dy,5a7a2a
rp09,게코,f6d86a,fff4c0,N,d,dy,e89a3a
rp10,레오파드게코,ffd84a,fff6d0,N,d,dy,3a2a1a
rp11,목도리도마뱀,c8a060,f0dcb0,B,d,gy,e8603a
rp12,코모도왕도마뱀,6a6a5a,8a8a78,N,d,ty,3a3a2e
rp13,뱀,7ac85a,e6f6c0,N,l,sy,3a8a3a
rp14,구렁이,c8a850,f0e0a8,N,l,dy,6a4a1a
rp15,코브라,d8b060,f6e6b8,B,l,sy,5a3a14
rp16,방울뱀,c89a68,f0dcc0,N,r,dy,5a3a20
rp17,산호뱀,e83a3a,ffe24a,N,r,sy,2e2e34
rp18,아나콘다,5a7a3a,a8c070,N,l,dy,2e3a1a,w
rp19,청개구리,6ad85a,f6f6c0,G,-,,ffffff,w
rp20,두꺼비,a8946a,d8c8a0,G,-,d,5a4a2a,w
rp21,독화살개구리,3a8ae0,ffe24a,G,-,d,2e2e34,w
rp22,빨간눈청개구리,5ac84a,f6a84a,G,-,s,e8363a,w
rp23,황소개구리,7a9a4a,e0e0a8,G,-,d,4a5a2a,w
rp24,올챙이,3a3a40,5a5a62,N,f,y,8a8a92,w
rp25,도롱뇽,3a3038,f0b03a,N,l,dy,f0b03a,w
rp26,우파루파,ffc0d0,ffe0e8,B,l,gy,ff7aa0,w
rp27,영원,e8703a,ffc890,N,l,dy,5a2a14,w
bg01,꿀벌,ffd83a,fff0a0,A,-,sin,3a2e1e
bg02,호박벌,ffc82a,2e2a28,A,-,swin,2e2a28
bg03,무당벌레,e8363a,2e2e34,A,-,dqn,2e2e34
bg04,나비,ff9ab8,ffe0e8,A,-,din,e85a8a
bg05,호랑나비,ffd84a,fff0a8,A,-,sin,2e2e34
bg06,모르포나비,3a8af0,a8d8ff,A,-,in,2a4a9a
bg07,배추흰나비,fbfbff,ffffff,A,-,din,5a5a66
bg08,나방,c8b8a0,e8dcc8,A,-,win,7a6a50
bg09,누에,f6f0e0,ffffff,N,-,sy,d8c8a8
bg10,애벌레,8ad85a,d8f6a8,A,-,sy,ffd83a
bg11,잠자리,5ab8e0,d8f0ff,A,l,iy,e8503a
bg12,고추잠자리,e8503a,ffb0a0,A,l,iy,8a1a14
bg13,매미,6a5a4a,a8987e,N,-,iy,3a8a5a
bg14,메뚜기,8ac84a,d8f0a0,A,-,y,5a8a2a
bg15,귀뚜라미,5a4a3a,7a6a58,A,-,y,2e241a
bg16,사마귀,7ac84a,d8f0a8,A,-,y,4a8a1a
bg17,개미,3a2a26,5a4640,A,-,y,8a3a2a
bg18,장수풍뎅이,5a3a2a,7a5a48,A,-,hq,2e1a12
bg19,사슴벌레,2e2a30,3e3a42,A,-,hq,6a6a78
bg20,풍뎅이,3ac88a,a8f0d0,A,-,q,2a8a5a
bg21,반딧불이,3a3a40,ffe86a,A,-,qy,ffe86a
bg22,달팽이,f6d8b0,fff0dc,A,-,q,c8946a
bg23,민달팽이,d8c8a0,f0e6c8,A,-,d,a8946a
bg24,지렁이,f0a8a0,ffd0c8,N,l,s,d87a70
bg25,거미,3a3038,5a4e58,N,-,ys,e8363a
bg26,타란툴라,5a4030,7a5a48,N,-,wy,e8803a
bg27,전갈,c8943a,e8c070,A,u,q,7a5414
bg28,쥐며느리,8a8a92,a8a8b0,A,-,sq,5a5a62
bg29,물방개,2e3a34,4a5a52,A,-,q,c8a83a,w
bg30,소금쟁이,5a5a4a,7a7a68,A,-,y,2e2e24,w
bg31,하늘소,3a3a40,5a5a62,A,-,dq,ffffff
bg32,방아깨비,a8c86a,e6f0c0,A,-,y,6a8a2a
bg33,꽃등에,ffc83a,fff0a0,A,-,siy,5a3a14
bg34,노린재,6aa84a,a8d080,A,-,q,3a6a1a
bg35,대벌레,a8946a,c8b890,A,l,y,6a5a3a
dn01,티라노사우루스,7a9a4a,e6ecb0,N,d,ty,4a6a1a
dn02,아기 티라노,a8d06a,f6f6c0,N,d,ty,6a9a2a
dn03,트리케라톱스,d8a060,f6e0b0,B,d,hk,8a5a20
dn04,스테고사우루스,7ab86a,e6f2c0,S,d,d,e8803a
dn05,브라키오사우루스,8aa8c8,d8e6f2,N,d,z,4a6a8a
dn06,벨로키랍토르,c8a050,f0e0a8,U,d,sty,6a4a14
dn07,프테라노돈,c8946a,f0d8b8,U,-,ik,7a4a24
dn08,안킬로사우루스,a8905a,d8c898,S,d,q,5a4a1a
dn09,파라사우롤로푸스,e89a5a,f6d8b0,U,d,ck,a8501a
dn10,스피노사우루스,5a8a9a,c8e0e6,S,d,fty,e8603a,w
dn11,플레시오사우루스,5a9ac8,d8ecf6,N,f,z,2a5a8a,w
dn12,모사사우루스,3a5a7a,c8d8e6,N,f,ty,1a3a5a,w
dn13,이구아노돈,8ab86a,e0f0c0,N,d,y,4a7a2a
dn14,파키케팔로사우루스,c8a878,f0e0c8,H,d,y,8a5a2a
dn15,디플로도쿠스,a8b8a0,e0e8d8,N,d,z,5a6a52
dn16,알로사우루스,c87a4a,f0c8a0,H,d,sty,7a3a14
dn17,딜로포사우루스,6aa88a,d8f0e0,U,d,cgy,e8503a
dn18,콤프소그나투스,d8c86a,f6f0b8,N,d,sy,8a7a1a
dn19,오비랍토르,e8c878,fff0c8,U,u,ck,e8703a
dn20,시조새,5a7ac8,f6e6a0,U,b,ik,e8503a
dn21,미크로랍토르,2e3a5a,5a6a9a,U,b,ik,3ac8e0
dn22,테리지노사우루스,a88a5a,e0d0a8,U,d,gy,5a4a1a
dn23,카르노타우루스,c85a3a,f0b090,H,d,ty,7a2a14
dn24,켄트로사우루스,a8a05a,e0dca0,S,d,d,6a5a1a
dn25,매머드 새끼,b88a68,d8b898,B,n,gn,f6f0e0
dn26,검치호랑이,e8b060,f6e0b0,R,n,stn,5a3a14,c
dn27,삼엽충,8a7a6a,a89a8a,A,-,sq,5a4a3a,w
dn28,암모나이트,e8a86a,f6d8b8,N,-,sq,a8642a,w
dn29,둔클레오스테우스,6a7a8a,a8b4c0,N,f,qt,3a4a5a,w
dn30,도도 아기,d8d8de,f6f6fa,U,-,k,f0c84a
my01,유니콘,fbfbff,ffffff,P,b,ghn,ff9ad8
my02,페가수스,fbfbff,ffffff,P,b,gin,8ac8ff
my03,용,5ac86a,fff0a8,H,d,gty,e8503a
my04,아기 용,8ad8a8,fff6c8,H,d,iy,ff8a5a
my05,청룡,3a8ae0,d8f0ff,H,d,gy,ffd83a
my06,황룡,ffc83a,fff4b8,H,d,gy,e8503a
my07,흑룡,2e2a3a,5a4a7a,H,d,giy,a078f0
my08,불사조,ff6a3a,ffd83a,U,b,cik,ffe86a
my09,해태,6ab8a8,e6f6f0,H,b,gty,ffd83a
my10,기린 신수,e8c85a,fff4c0,H,b,gdn,e8503a
my11,봉황,ff5a7a,ffd84a,U,b,cik,3ac8e0
my12,구미호,fbf6ec,ffffff,P,b,zn,ff7aa0
my13,도깨비,5ab8e0,d8f0ff,H,-,tn,ffd83a
my14,삼족오,24242c,3a3a46,N,u,k,ffd83a
my15,그리핀,e8c070,ffffff,P,l,ik,a8742a
my16,켈베로스,3a3038,5a4a58,P,l,tyn,e8503a
my17,예티,fbfbff,d8ecff,N,-,wtn,8ab8e0
my18,빅풋,7a5a40,a8866a,N,-,wn,3a2a1a
my19,네시,5aa88a,d8f0e0,N,f,z,2a6a4a,w
my20,크라켄,8a3a8a,e8a8e0,N,-,dy,5a1a5a,w
my21,인어 물고기,6ad8e0,ffe0f0,N,f,df,ff8ac8,w
my22,슬라임,8ad8f6,d8f6ff,N,-,y,5ab8e0
my23,분홍 슬라임,ffb0d0,ffe0ec,N,-,y,ff7aa8
my24,꼬마 유령,fbfbff,ffffff,N,-,y,c8c8e0
my25,호박 유령,ff9a3a,ffd890,U,-,ty,5a8a2a
my26,눈사람,fbfbff,ffffff,N,-,dn,ff8a3a
my27,별똥별이,ffe86a,fff8c8,S,-,y,ffb03a
my28,구름이,fbfbff,e6f2ff,N,p,wy,a8d0f6
my29,달토끼,fff6c8,ffffff,L,p,n,ffc83a
my30,버섯돌이,e8503a,fff6e6,N,-,dy,ffffff
my31,선인장이,6ab86a,c8eca8,S,-,dy,ff7aa8
my32,도토리,c8843a,f0d0a0,U,-,y,7a4a1a
my33,복숭아,ffb8b0,ffe6e0,U,-,y,6ab86a
my34,감자,d8b078,f0dcb8,N,-,dy,a8783a
my35,찹쌀떡,fbfbff,ffe6ec,N,-,y,ffb0c8
ar01,북극토끼,fbfbff,ffffff,L,p,en,2e2e34
ar02,하프물범,e6ecf2,ffffff,N,f,pn,3a4048,w
ar03,사향소,5a4030,7a5a48,H,n,gwn,e8dcc8
ar04,레밍,d8a868,f6e6c8,T,-,n,5a3a1a
ar05,흰담비,fbfbff,ffffff,T,l,n,2e2e34
ar06,눈덧신토끼,f6f6fa,ffffff,L,p,n,a8a8b4
ar07,순록 아기,c8a888,f6ecdc,H,p,n,e8363a
ar08,바다표범,8a94a0,d8dee6,N,f,dn,3a444e,w
ar09,흰기러기,fbfbff,ffffff,N,u,ek,f08aa0,w
ar10,뇌조,fbfbff,ffffff,N,u,ck,e8363a
jp01,검은 강아지,2e2a2a,4a4444,F,u,n,8a8080
jp02,얼룩 강아지,ffffff,ffffff,F,u,pn,3a3434
jp03,누렁이,e8b868,f6e0a8,F,c,zn,5a3a14
jp04,바둑이,ffffff,ffffff,F,u,pmn,2e2a2a
jp05,점박이 강아지,f6ecd8,ffffff,F,u,dn,8a5a34
jp06,꼬마 곰,e8c8a0,fff0dc,R,p,zn,a8744a
jp07,초코 곰,6a4630,a87a58,R,p,zn,3a2414
jp08,꿀곰,f0b84a,fff0b8,R,p,zn,8a5a14
jp09,분홍 곰,ffb8c8,ffe6ec,R,p,zn,ff7aa0
jp10,하늘 곰,a8d0f6,e6f4ff,R,p,zn,5a9ad8
jp11,민트 토끼,a8e6d0,e6fbf2,L,p,n,5ac8a0
jp12,라벤더 토끼,c8b8f0,ece6ff,L,p,n,9a7ae0
jp13,레몬 병아리,fff07a,fffbd0,U,-,k,ffb03a
jp14,딸기 고양이,ffb0c0,ffe6ec,P,l,dn,e8506a,c
jp15,우유 고양이,fffaf0,ffffff,P,l,n,ffc8d8,c
jp16,초코 고양이,7a5440,a88068,P,l,zn,3a2418,c
jp17,밤 다람쥐,a8683a,f6dcb8,P,b,sn,5a3014
jp18,꿀 햄스터,ffd07a,fff6dc,R,n,zn,f09a5a
jp19,크림 여우,f6e0b8,ffffff,P,b,zn,c89a5a
jp20,눈꽃 사슴,e6f0fa,ffffff,D,p,dn,8ab8e0
jp21,솜사탕 양,ffc8e0,fff0f6,F,p,w,8ad0f6
jp22,무지개 유니콘,fff0f6,ffffff,P,b,ghn,8ad0f6
jp23,밤하늘 고양이,2e2e5a,4a4a8a,P,l,dyn,ffe86a,c
jp24,노을 여우,ff8a5a,ffe0b0,P,b,zn,8a2a4a
jp25,새벽 늑대,6a6aa8,c8c8f0,P,b,zn,2e2e5a
jp26,봄 참새,f6c8a0,fff0e0,N,u,k,ff8aa8
jp27,여름 개구리,5ad8a0,e6fbd0,G,-,,ffffff,w
jp28,가을 다람쥐,d8703a,ffe0b0,P,b,szn,7a2a14
jp29,겨울 곰,e6f0fa,ffffff,R,p,zn,8ab8e0
jp30,벚꽃 토끼,ffd8e6,fff6fa,L,p,dn,ff8ab8
jp31,바다 수달,5a8aa8,d8ecf6,T,l,zn,2a4a6a,w
jp32,모래 고양이,e8c898,fff0d8,B,r,sn,8a6a3a,c
jp33,숯 강아지,4a4a52,7a7a84,P,c,zn,2e2e34
jp34,눈 강아지,fbfbff,ffffff,P,b,n,8ab8e0
jp35,구름 양,e6f2ff,ffffff,F,p,w,a8d0f6
jp36,달빛 부엉이,5a5a8a,c8c8f0,P,n,yk,ffe86a
jp37,꽃사슴 아기,f0b888,fff4e6,T,p,dn,ffffff
jp38,콩 병아리,c8e68a,f6fbd0,U,-,k,ffb03a
jp39,팥 다람쥐,8a3a4a,e8b8c0,P,b,sn,4a141e
jp40,깨 고양이,f6f0e0,ffffff,P,l,dn,3a3430,c
jp41,호두 곰,a87a4a,d8b488,R,p,zn,5a3a1a
jp42,밤톨 고슴도치,8a5a3a,f6e6cc,T,-,qn,4a2a14
jp43,유자 병아리,ffc83a,fff0a8,U,-,k,f0803a
jp44,말차 개구리,8ab85a,e0f0c0,G,-,d,ffffff,w
jp45,흑임자 고양이,5a5a62,a8a8b0,P,l,n,2e2e34,c
jp46,인절미 강아지,e8c88a,fff0d0,F,c,zn,a8843a
jp47,곶감 여우,e8703a,ffd8b0,P,b,zn,7a2a0a
jp48,식혜 양,f6f0d8,ffffff,F,p,w,d8c88a
jp49,약과 곰,c8843a,f0c880,R,p,dzn,7a4a14
jp50,송편 토끼,d8f0d0,ffffff,L,p,n,8ac87a
`;
  const shade = (hex, k) => {
    const n = parseInt(hex, 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
  };
  const EAR = { R: "round", L: "long", P: "point", T: "tiny", F: "floppy", G: "frog", K: "koala", D: "deer", S: "spikes", U: "tuft", N: "", B: "big", H: "horn", A: "antenna" };
  const TAIL = { p: "puff", l: "long", b: "bushy", d: "dino", c: "curl", u: "up", n: "nub", r: "ring", f: "fish", "-": "" };
  const LIST = [], BY = {};
  RAW.trim().split("\n").forEach((line, idx) => {
    const r = line.split(",");
    if (r.length < 8 || BY[r[0]]) return;
    const U = "#" + r[2], b = "#" + r[3], x = "#" + r[7], m = r[6] || "";
    const sp = {
      id: r[0], name: r[1], n: idx, ear: EAR[r[4]] || "", tail: TAIL[r[5]] || "", m, fam: r[8] || "",
      c: { U, u: shade(r[2], -0.2), b, i: m.indexOf("e") >= 0 ? x : shade(r[7], 0.25), f: m.indexOf("l") >= 0 ? x : shade(r[2], -0.28), x, k: x, B: x, n: shade(r[7], 0.1), q: shade(r[7], -0.35), g: x, w: "#ffffff", A: x, W: "#ffffff" },
    };
    LIST.push(sp); BY[sp.id] = sp;
  });
  window.Zoo = { LIST, BY, shade };
})();
