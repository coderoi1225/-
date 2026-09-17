/* Pure, deterministic scoring. No answer-bit seed, random selection, or hidden tie-break. */
(function(root){
  const data=typeof module!=='undefined'&&module.exports?require('./data.js'):root.LAB_DATA;
  const majors=typeof module!=='undefined'&&module.exports?require('./majors.js'):root.LAB_MAJORS;
  function validate(answers){
    return Array.isArray(answers)&&answers.length===data.QUESTIONS.length&&data.QUESTIONS.every((q,i)=>q.options.some(o=>o.id===answers[i]));
  }
  function score(answers){
    if(!validate(answers))throw new Error('완료되지 않은 응답입니다.');
    const counts=Object.fromEntries(data.ORDER.map(t=>[t,0]));
    const evidence=Object.fromEntries(data.ORDER.map(t=>[t,[]]));
    data.QUESTIONS.forEach((q,i)=>{
      const o=q.options.find(o=>o.id===answers[i]);counts[o.type]++;
      evidence[o.type].push({questionId:q.id,number:i+1,question:q.prompt,optionId:o.id,text:o.text});
    });
    const rankedScores=Object.values(counts).sort((a,b)=>b-a),cutoff=rankedScores[1];
    const highest=rankedScores[0];
    const interests=data.ORDER.filter(t=>counts[t]>=cutoff);
    // All best pairs are retained. A tie produces more candidates, never an invented winner.
    const bestPairScore=rankedScores[0]+rankedScores[1];
    const candidates=majors.filter(m=>counts[m.interests[0]]+counts[m.interests[1]]===bestPairScore)
      .map(m=>({...m,matched:m.interests.slice()}));
    return {version:data.VERSION,counts,evidence,interests,highest,cutoff,bestPairScore,candidates,
      tied:interests.length>2||rankedScores[0]===rankedScores[1],answers:answers.slice()};
  }
  function encode(answers){
    if(!validate(answers))throw new Error('완료되지 않은 응답입니다.');
    return '#map='+data.VERSION+'.'+answers.map((id,i)=>data.QUESTIONS[i].options.find(o=>o.id===id).type).join('');
  }
  function decodePayload(hash){
    if(typeof hash!=='string'||!hash.startsWith('#map='))return {error:'invalid'};
    const payload=hash.slice(5),lastDot=payload.lastIndexOf('.');
    if(lastDot<0)return {error:'invalid'};
    const version=payload.slice(0,lastDot),bits=payload.slice(lastDot+1);
    if(version!==data.VERSION)return {error:'version'};
    if(!/^[RIASEC]{15}$/.test(bits))return {error:'invalid'};
    const answers=data.QUESTIONS.map((q,i)=>{const o=q.options.find(o=>o.type===bits[i]);return o?o.id:null;});
    return validate(answers)?{answers}:{error:'invalid'};
  }
  const api={validate,score,encode,decode:decodePayload};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LAB_LOGIC=api;
})(typeof globalThis!=='undefined'?globalThis:this);
