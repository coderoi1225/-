/* V2.1 student-language draft. Stable question + option identities; display position never affects scoring.
 * Text or mapping changes require a new VERSION and old-version retention for old links.
 */
(function(root){
  const VERSION='2.1';
  const ORDER=['R','I','A','S','E','C'];
  const TYPES={
    R:{name:'직접 만들기',short:'만들기',color:'#FF966A',desc:'손으로 만들고, 물건이나 도구를 다루는 활동'},
    I:{name:'원리 탐구하기',short:'탐구하기',color:'#43DDD2',desc:'질문을 떠올리고, 근거를 찾아 원리를 알아보는 활동'},
    A:{name:'나답게 표현하기',short:'표현하기',color:'#C6A0FF',desc:'글·그림·소리 등으로 생각과 느낌을 표현하는 활동'},
    S:{name:'함께 돕기',short:'돕기',color:'#FF8EB7',desc:'누군가의 이야기를 듣거나 배움을 돕는 활동'},
    E:{name:'기획하고 이끌기',short:'기획하기',color:'#87B6FF',desc:'아이디어를 제안하고, 사람들과 일을 추진하는 활동'},
    C:{name:'정리하고 관리하기',short:'정리하기',color:'#87E5A4',desc:'자료·물품·일정을 정리하고 관리하는 활동'}
  };
  // Pair order retained for comparison with v1; wording is a new, unvalidated draft.
  const raw=[
  [
    "한 시간의 여유가 생겼어요. 더 해보고 싶은 것은?",
    "종이를 접어 휴대전화 받침대 만들기",
    "R",
    "소리의 높낮이가 달라지는 이유 알아보기",
    "I"
  ],
  [
    "빈 상자를 새롭게 쓴다면, 더 해보고 싶은 것은?",
    "안에 칸을 만들어 물건을 나눠 담기",
    "R",
    "좋아하는 색과 그림으로 겉면 꾸미기",
    "A"
  ],
  [
    "친구들과 함께 쓸 공간을 꾸민다면?",
    "앉을 자리나 작은 선반을 직접 만들어 보기",
    "R",
    "친구들이 편하게 쉴 수 있게 이야기를 듣고 돕기",
    "S"
  ],
  [
    "친구들과 쉬는 시간에 놀 준비를 한다면?",
    "놀이에 쓸 간단한 도구 만들어 보기",
    "R",
    "함께 하면 재미있을 놀이 제안하기",
    "E"
  ],
  [
    "내 책상을 바꿔본다면, 더 해보고 싶은 것은?",
    "간단한 책꽂이를 직접 조립해 보기",
    "R",
    "책과 물건을 종류별로 나누어 정리하기",
    "C"
  ],
  [
    "재미있게 본 영상이 있어요. 더 해보고 싶은 것은?",
    "궁금했던 장면을 어떻게 찍었는지 알아보기",
    "I",
    "떠오른 생각을 글이나 그림으로 표현하기",
    "A"
  ],
  [
    "새로운 보드게임을 배운다면, 더 해보고 싶은 것은?",
    "규칙 하나를 바꾸면 어떻게 달라질지 비교하기",
    "I",
    "방법을 익혀 친구에게 차근차근 알려주기",
    "S"
  ],
  [
    "주말에 친구들과 만난다면, 더 해보고 싶은 것은?",
    "갈 만한 장소를 찾아 좋은 점과 아쉬운 점 비교하기",
    "I",
    "친구들의 의견을 모아 함께 할 일 정하기",
    "E"
  ],
  [
    "반 친구들이 좋아하는 간식을 물어봤어요. 그다음에는?",
    "답을 보며 친구들이 좋아하는 간식의 공통점 찾기",
    "I",
    "답을 간식 종류별로 나누어 표로 정리하기",
    "C"
  ],
  [
    "쉬는 시간에 더 해보고 싶은 것은?",
    "떠오르는 이야기나 멜로디를 자유롭게 만들어 보기",
    "A",
    "친구의 이야기를 듣고 고민을 함께 생각해 보기",
    "S"
  ],
  [
    "반 친구들과 소풍을 간다면, 더 해보고 싶은 것은?",
    "추억을 담을 그림이나 짧은 영상 만들기",
    "A",
    "다 같이 할 만한 활동을 친구들에게 제안하기",
    "E"
  ],
  [
    "친구들과 찍은 사진을 모았어요. 더 해보고 싶은 것은?",
    "사진마다 재미있는 제목이나 짧은 이야기 붙이기",
    "A",
    "사진을 날짜나 주제별로 나누어 정리하기",
    "C"
  ],
  [
    "친구들과 새로운 놀이를 한다면, 더 해보고 싶은 것은?",
    "어려워하는 친구와 함께 방법을 익혀보기",
    "S",
    "더 재미있게 놀 방법을 제안하고 의견 모으기",
    "E"
  ],
  [
    "친구들과 작은 모임을 준비한다면?",
    "처음 오는 친구에게 함께 할 활동 알려주기",
    "S",
    "필요한 준비물을 목록으로 적고 확인하기",
    "C"
  ],
  [
    "친구들과 짧은 영상을 만든다면?",
    "어떤 내용을 찍을지 제안하고 의견 모으기",
    "E",
    "찍을 순서와 각자 할 일을 정리하기",
    "C"
  ]
];
  // A/B exposure is balanced (2 or 3 per type) using a fixed, reviewable orientation.
  let orientation=0;
  for(let mask=0;mask<32768;mask++){
    const count=Object.fromEntries(ORDER.map(t=>[t,0]));
    raw.forEach((q,i)=>count[q[(mask>>i)&1?4:2]]++);
    if(ORDER.every(t=>count[t]>=2&&count[t]<=3)){orientation=mask;break;}
  }
  const QUESTIONS=raw.map((q,i)=>{
    const id='q'+String(i+1).padStart(2,'0');
    const options=[{id:id+'-'+q[2],text:q[1],type:q[2]},{id:id+'-'+q[4],text:q[3],type:q[4]}];
    if((orientation>>i)&1)options.reverse();
    return {id,prompt:q[0],options};
  });
  const data={VERSION,ORDER,TYPES,QUESTIONS};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.LAB_DATA=data;
})(typeof globalThis!=='undefined'?globalThis:this);
