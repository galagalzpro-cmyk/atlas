const MAX_MESSAGE_LENGTH=1500;
const allowedOrigins=(process.env.ATLAS_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);

const json=(res,status,payload)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(payload));};
const extractText=data=>{
  if(typeof data.output_text==='string'&&data.output_text.trim())return data.output_text.trim();
  const parts=[];
  for(const item of data.output||[])for(const content of item.content||[])if(content.type==='output_text'&&content.text)parts.push(content.text);
  return parts.join('\n').trim();
};

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Méthode non autorisée'});
  const origin=req.headers.origin;
  if(origin&&allowedOrigins.length&&!allowedOrigins.includes(origin))return json(res,403,{error:'Origine non autorisée'});
  if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)return json(res,503,{error:'Le service IA n’est pas encore configuré.'});
  const message=String(req.body?.message||'').trim();
  if(!message||message.length>MAX_MESSAGE_LENGTH)return json(res,400,{error:'Message invalide'});
  const state=req.body?.state||{};
  const history=Array.isArray(req.body?.history)?req.body.history.slice(-8):[];
  const input=[...history.map(item=>({role:item.role==='assistant'?'assistant':'user',content:String(item.text||'').slice(0,1500)})),{role:'user',content:message}];
  const instructions=`Tu es ATLAS, une aide numérique francophone de clarification et de soutien émotionnel. Tu n'es ni médecin, ni psychologue, ni humain. Ne pose jamais de diagnostic, ne promets jamais la confidentialité absolue ou une guérison, et n'invente aucune donnée biométrique. Réponds avec chaleur, précision et sobriété. Pose au maximum une question à la fois. Propose au besoin une action simple, la page Comprendre, la page Apaiser ou le relais humain. Si le message évoque suicide, automutilation, violence, danger immédiat ou incapacité à rester en sécurité, recommande sans détour une aide humaine immédiate et la page Aide urgente; ne poursuis pas comme si une conversation ordinaire suffisait. Contexte déclaré facultatif: émotion=${String(state.emotion||'non indiquée')}, intensité=${String(state.intensity||'non indiquée')}/10, contexte=${String(state.context||'non indiqué')}.`;
  try{
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL,instructions,input,max_output_tokens:420})});
    const data=await response.json();
    if(!response.ok){console.error('OpenAI error',response.status,data?.error?.code);return json(res,502,{error:'Le service IA est temporairement indisponible.'});}
    const reply=extractText(data);
    if(!reply)return json(res,502,{error:'Réponse vide du service IA.'});
    return json(res,200,{reply});
  }catch(error){console.error('ATLAS chat error',error?.message);return json(res,502,{error:'Impossible de joindre le service IA.'});}
}
