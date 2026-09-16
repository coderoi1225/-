/* Student UI. State is confined to this browser history entry; no server requests. */
(function(){
  'use strict';
  const {VERSION,ORDER,TYPES,QUESTIONS}=LAB_DATA,logic=LAB_LOGIC;
  const $=id=>document.getElementById(id);
  const state={answers:Array(15).fill(null),current:0,screen:'intro',own:true,editing:false,result:null,field:'전체'};
  let locked=false,toastTimer;
  const brand=window.LAB_BRAND;
  if(brand&&Array.isArray(brand.logos)){
    const slot=$('client-brand');
    brand.logos.filter(item=>typeof item.src==='string'&&item.src.trim()).forEach(item=>{
      const logo=document.createElement('img');logo.alt=item.alt||'사업 로고';
      logo.width=item.width;logo.height=item.height;logo.hidden=true;
      logo.addEventListener('load',()=>{logo.hidden=false;slot.hidden=false;});
      logo.addEventListener('error',()=>{logo.hidden=true;slot.hidden=![...slot.children].some(img=>!img.hidden);});
      slot.append(logo);logo.src=item.src;
    });
  }
  function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
  function character(type){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 100 100');s.setAttribute('aria-hidden','true');s.style.color=TYPES[type].color;const use=document.createElementNS(s.namespaceURI,'use');use.setAttribute('href','#ch-'+type);s.append(use);return s;}
  function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
  function remember(hash){try{history.replaceState({lab:{version:VERSION,answers:state.answers,current:state.current,screen:state.screen,own:state.own,editing:state.editing}},'',location.pathname+location.search+(hash===undefined?location.hash:hash));}catch(e){/* file:// browsers may restrict history changes; sharing still encodes state. */}}
  function show(screen,focusId){state.screen=screen;['intro','quiz','review','result'].forEach(id=>$(id).hidden=id!==screen);window.scrollTo(0,0);if(focusId)$(focusId).focus({preventScroll:true});}
  ORDER.forEach(t=>{const item=node('div','crew-item');item.append(character(t),node('span','',TYPES[t].short));$('crew').append(item);});
  function start(){state.answers=Array(15).fill(null);state.current=0;state.own=true;state.editing=false;state.result=null;state.field='전체';$('entry-message').hidden=true;renderQuestion();remember('');}
  function renderQuestion(){const q=QUESTIONS[state.current];$('counter').textContent=(state.current+1)+' / 15';$('progress-fill').style.width=(state.current/15*100)+'%';document.querySelector('.progress').setAttribute('aria-valuenow',state.current);$('question').textContent=q.prompt;$('previous').disabled=state.current===0&&!state.editing;$('previous').textContent=state.editing?'← 선택 목록으로':'← 이전';$('saved-note').textContent=state.editing?'바꾸면 선택 목록으로 돌아가요':'';$('choices').replaceChildren();const index=state.current;
    q.options.forEach((o,i)=>{const b=node('button','choice');b.type='button';b.dataset.option=o.id;b.setAttribute('aria-pressed',String(state.answers[index]===o.id));const tag=node('span','choice-tag',i===0?'A':'B');tag.setAttribute('aria-hidden','true');b.append(tag,node('span','',o.text));b.addEventListener('click',()=>{
      if(locked||state.screen!=='quiz'||state.current!==index)return;locked=true;setTimeout(()=>locked=false,260);state.answers[index]=o.id;
      if(state.editing||index===14){state.editing=false;renderReview();}else{state.current++;renderQuestion();}
      remember('');
    });$('choices').append(b);});show('quiz','question');
  }
  function renderReview(){if(!logic.validate(state.answers)){renderQuestion();return;}$('review-list').replaceChildren();QUESTIONS.forEach((q,i)=>{const o=q.options.find(o=>o.id===state.answers[i]);const b=node('button','review-row');b.append(node('span','row-number',String(i+1).padStart(2,'0')),node('span','row-text',o.text),node('span','row-change','바꾸기'));b.addEventListener('click',()=>{state.current=i;state.editing=true;renderQuestion();remember('');});$('review-list').append(b);});show('review','review-title');}
  function renderEvidence(r){$('evidence-list').replaceChildren();r.interests.forEach(t=>{const examples=r.evidence[t],box=node('div','evidence-item'),label=node('p','evidence-label',TYPES[t].name+' · '+r.counts[t]+'번 선택');label.style.color=TYPES[t].color;box.append(label,node('p','evidence-question',examples[0].number+'번 문항에서'),node('p','evidence-quote','“'+examples[0].text+'”'));
    if(examples.length>1){const more=node('details');more.append(node('summary','','같은 관심의 다른 선택 '+(examples.length-1)+'개'));examples.slice(1).forEach(e=>more.append(node('p','evidence-extra',e.number+'번 · '+e.text)));box.append(more);}$('evidence-list').append(box);});}
  function renderResult(){const r=logic.score(state.answers);state.result=r;state.field='전체';$('share-banner').hidden=state.own;$('result-title').replaceChildren(document.createTextNode('이번에 그린'),document.createElement('br'),document.createTextNode(state.own?'나의 관심 지도':'관심 지도'));$('result-chars').replaceChildren(...r.interests.map(character));$('interest-title').textContent=r.interests.map(t=>TYPES[t].short).join(' + ');$('interest-description').textContent=r.interests.length>2?'여러 활동에 관심이 함께 나타났어요. 아래에서 내 선택을 돌아보고, 더 궁금한 배움을 찾아보세요.':'이 활동들을 다른 활동보다 더 자주 골랐어요. 어떤 선택이 모였는지 함께 돌아볼까요?';$('tie-note').textContent=r.tied?'같은 횟수로 고른 관심은 함께 담았어요. 표시된 순서가 우열을 뜻하지 않아요.':'이번 15개 선택에서 보인 경향이에요. 잘하는 일이나 앞으로의 가능성을 정하는 결과는 아니에요.';
    $('score-bars').replaceChildren();ORDER.forEach(t=>{const row=node('div','score-row'),track=node('div','score-track'),bar=node('div','score-fill');bar.style.width=r.counts[t]/5*100+'%';bar.style.background=TYPES[t].color;track.append(bar);row.append(node('span','',TYPES[t].short),track,node('span','',r.counts[t]+'회'));$('score-bars').append(row);});renderEvidence(r);
    $('candidate-count').textContent=r.candidates.length+'개 전공';$('candidate-note').textContent='더 자주 고른 관심 두 가지와 연결해 둔 전공들이에요. 선택 횟수가 같은 관심도 모두 포함했어요. 가나다순이며, 추천 순위나 적합도는 아니에요.';
    const fields=['전체',...new Set(r.candidates.map(m=>m.field))];$('field-filters').replaceChildren();fields.forEach(field=>{const b=node('button','filter',field);b.setAttribute('aria-pressed',String(field===state.field));b.addEventListener('click',()=>{state.field=field;document.querySelectorAll('.filter').forEach(x=>x.setAttribute('aria-pressed',String(x.textContent===field)));renderMajors();});$('field-filters').append(b);});renderMajors();$('restart').textContent=state.own?'다시 해보기':'나도 해보기';show('result','result-title');
  }
  function renderMajors(){const selected=state.result.candidates.filter(m=>state.field==='전체'||m.field===state.field).slice().sort((a,b)=>a.name.localeCompare(b.name,'ko'));$('major-list').replaceChildren();selected.forEach(m=>{const b=node('button','major-card');b.dataset.major=m.id;b.append(node('span','major-field',m.field+' · '+m.group),node('h3','',m.name),node('p','major-summary',m.learn.split('. ')[0]+(m.learn.includes('. ')?'.':'')));const tags=node('div','major-tags');m.interests.forEach(t=>tags.append(node('span','',TYPES[t].short)));b.append(tags,node('span','major-link','배우는 내용 살펴보기 ↗'));b.addEventListener('click',()=>openMajor(m));$('major-list').append(b);});}
  function openMajor(m){$('major-field').textContent=m.field+' · '+m.group;$('major-title').textContent=m.name;$('major-learn').textContent=m.learn;$('major-why').textContent='“'+TYPES[m.interests[0]].name+'”와 “'+TYPES[m.interests[1]].name+'” 관심에 연결해 둔 전공이에요. 위의 배우는 내용에서 내가 해보고 싶은 활동을 찾아보세요.';$('major-careers').replaceChildren(...m.careers.map(c=>node('span','',c)));$('major-dialog').showModal();}
  function allAnswers(){if(!state.result)return;$('all-answers').replaceChildren();QUESTIONS.forEach((q,i)=>{const box=node('div','all-answer'),o=q.options.find(o=>o.id===state.answers[i]);box.append(node('p','',(i+1)+'. '+q.prompt),node('p','',o.text));$('all-answers').append(box);});$('edit-answers').hidden=!state.own;$('answers-dialog').showModal();}
  function share(){const link=location.href.split('#')[0]+logic.encode(state.answers);$('share-url').value=link;$('share-status').textContent='링크를 직접 선택해서 복사할 수도 있어요.';$('local-share-note').hidden=!(location.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(location.hostname));$('share-dialog').showModal();}
  async function copy(){const link=$('share-url').value;try{await navigator.clipboard.writeText(link);$('share-status').textContent='링크를 복사했어요.';}catch(e){$('share-url').focus();$('share-url').select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}$('share-status').textContent=ok?'링크를 복사했어요.':'링크를 선택했어요. 직접 복사해 주세요.';}}
  function saveImage(){try{
    const r=state.result,cv=document.createElement('canvas');cv.width=1080;const g=cv.getContext('2d');if(!g)throw Error('canvas');
    const font='"Malgun Gothic","Apple SD Gothic Neo",sans-serif';
    function lines(text,size,weight,width=920){g.font=weight+' '+size+'px '+font;const result=[];let line='';for(const ch of text){if(ch==='\n'){result.push(line);line='';continue;}if(line&&g.measureText(line+ch).width>width){result.push(line);line=ch;}else line+=ch;}if(line)result.push(line);return result;}
    const blocks=[];function block(text,size,color,gap=24,weight=400){const ls=lines(text,size,weight);blocks.push({ls,size,color,gap,weight});}
    block('나의 관심 지도',58,'#c8ff4d',22,800);block('이번 15개 선택에서 더 자주 고른 활동',30,'#b4bac4');block(r.interests.map(t=>TYPES[t].short).join(' + '),48,'#f4f5f1',36,750);
    block('내가 고른 활동',36,'#c8ff4d',20,700);r.interests.forEach(t=>block(TYPES[t].short+' · '+r.counts[t]+'회\n“'+r.evidence[t][0].text+'”',30,'#e0e6ef',28));
    block('함께 살펴볼 전공',36,'#c8ff4d',15,700);block(r.candidates.slice().sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(m=>m.name).join(' · '),31,'#e0e6ef',25);
    block('전공은 가나다순이며 추천 순위가 아니에요. 같은 점수의 관심도 모두 담았어요.',26,'#b4bac4',25);block('관심과 전공 연결은 탐색을 위한 초안입니다.\n적성이나 능력을 측정하는 검사는 아니에요.',26,'#b4bac4',20);block('PROJECT LAB · 관심 지도 '+VERSION,24,'#b4bac4',0,700);
    cv.height=Math.max(1350,160+blocks.reduce((sum,b)=>sum+b.ls.length*b.size*1.55+b.gap,0));g.fillStyle='#0c0e12';g.fillRect(0,0,cv.width,cv.height);let y=85;g.textBaseline='top';blocks.forEach(b=>{g.fillStyle=b.color;g.font=b.weight+' '+b.size+'px '+font;b.ls.forEach(l=>{g.fillText(l,80,y);y+=b.size*1.55;});y+=b.gap;});const url=cv.toDataURL('image/png');$('result-image').src=url;$('download-image').href=url;$('image-dialog').showModal();
  }catch(e){notify('이미지를 저장하지 못했어요. 링크로 공유해 주세요.');}}
  $('start').addEventListener('click',start);$('previous').addEventListener('click',()=>{if(state.editing){state.editing=false;renderReview();}else if(state.current>0){state.current--;renderQuestion();}remember('');});$('finish').addEventListener('click',()=>{if(!logic.validate(state.answers))return;state.own=true;renderResult();remember(logic.encode(state.answers));});$('view-answers').addEventListener('click',allAnswers);$('edit-answers').addEventListener('click',()=>{$('answers-dialog').close();renderReview();remember('');});$('restart').addEventListener('click',()=>{state.answers=Array(15).fill(null);state.result=null;state.own=true;state.current=0;$('entry-message').hidden=true;show('intro');remember('');});$('copy').addEventListener('click',share);$('copy-link').addEventListener('click',copy);$('save-image').addEventListener('click',saveImage);$('close-share').addEventListener('click',()=>$('share-dialog').close());$('close-image').addEventListener('click',()=>$('image-dialog').close());
  $('close-major').addEventListener('click',()=>$('major-dialog').close());$('close-major-bottom').addEventListener('click',()=>$('major-dialog').close());$('close-answers').addEventListener('click',()=>$('answers-dialog').close());
  for(const id of ['major-dialog','answers-dialog','share-dialog','image-dialog'])$(id).addEventListener('click',e=>{if(e.target===$(id)){const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$(id).close();}});
  function boot(){const saved=history.state&&history.state.lab;$('entry-message').hidden=true;
    if(location.hash){const parsed=logic.decode(location.hash);if(parsed.answers){state.answers=parsed.answers;state.own=!!(saved&&saved.version===VERSION&&saved.own&&logic.validate(saved.answers)&&logic.encode(saved.answers)===location.hash);renderResult();return;}show('intro');$('entry-message').hidden=false;$('entry-message').textContent=parsed.error==='version'?'다른 버전의 관심 지도예요. 이 버전에서 새로 참여해 주세요.':'링크의 선택 정보를 읽지 못했어요. 처음부터 참여할 수 있어요.';return;}
    if(saved&&saved.version===VERSION&&Array.isArray(saved.answers)&&saved.answers.length===15&&saved.answers.every((id,i)=>id===null||QUESTIONS[i].options.some(o=>o.id===id))&&['quiz','review'].includes(saved.screen)){
      state.answers=saved.answers;state.current=Math.max(0,Math.min(14,saved.current||0));state.editing=!!saved.editing;state.own=true;if(saved.screen==='review'&&logic.validate(state.answers))renderReview();else renderQuestion();return;
    }show('intro');
  }
  window.addEventListener('hashchange',boot);boot();
})();
