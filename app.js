const form=document.getElementById('checkoutForm');
const email=document.getElementById('email');
const emailConfirm=document.getElementById('emailConfirm');
const nameInput=document.getElementById('name');
const phone=document.getElementById('phone');
const taxId=document.getElementById('taxId');
const formMessage=document.getElementById('formMessage');
const generateBtn=document.getElementById('generatePixBtn');
const copyInlineBtn=document.getElementById('copyInlineBtn');
const modal=document.getElementById('pixModal');
const modalQr=document.getElementById('modalQr');
const pixCodeField=document.getElementById('pixCode');
const copyModalBtn=document.getElementById('copyModalBtn');
const detailsToggle=document.getElementById('detailsToggle');
const detailsPanel=document.getElementById('detailsPanel');
let currentPixCode='';

function digits(v=''){return String(v).replace(/\D/g,'')}
function validEmail(v=''){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
function normalizePhone(v=''){let p=digits(v);if((p.length===12||p.length===13)&&p.startsWith('55'))p=p.slice(2);return p}
function setMessage(m=''){formMessage.textContent=m}
function validate(){
  const e=email.value.trim().toLowerCase();
  const ec=emailConfirm.value.trim().toLowerCase();
  const n=nameInput.value.trim();
  const p=normalizePhone(phone.value);
  const t=digits(taxId.value);
  if(!validEmail(e))return{error:'Informe um e-mail válido.'};
  if(e!==ec)return{error:'Os e-mails informados não são iguais.'};
  if(n.length<3||!n.includes(' '))return{error:'Informe seu nome completo.'};
  if(![10,11].includes(p.length))return{error:'Informe um celular válido com DDD.'};
  if(![11,14].includes(t.length))return{error:'Informe um CPF ou CNPJ válido.'};
  return{email:e,name:n,phone:p,taxId:t};
}
function formatDetails(details){if(!details)return'';if(Array.isArray(details))return details.map(i=>typeof i==='string'?i:i?.message||i?.field||JSON.stringify(i)).filter(Boolean).join(' | ');if(typeof details==='object')return Object.entries(details).map(([k,v])=>`${k}: ${typeof v==='string'?v:JSON.stringify(v)}`).join(' | ');return String(details)}
function openModal(){modal.classList.remove('hidden');document.body.style.overflow='hidden'}
function closeModal(){modal.classList.add('hidden');document.body.style.overflow=''}
function renderQr(code){modalQr.innerHTML='';if(typeof QRCode!=='function')throw new Error('Não foi possível carregar o gerador de QR Code.');new QRCode(modalQr,{text:code,width:230,height:230,correctLevel:QRCode.CorrectLevel.M})}
async function copyText(text,button){if(!text)return;try{await navigator.clipboard.writeText(text)}catch{const h=document.createElement('textarea');h.value=text;h.style.position='fixed';h.style.opacity='0';document.body.appendChild(h);h.select();document.execCommand('copy');h.remove()}const old=button.textContent;button.textContent='Código Pix copiado!';setTimeout(()=>button.textContent=old,1800)}

detailsToggle.addEventListener('click',()=>{const open=detailsToggle.getAttribute('aria-expanded')==='true';detailsToggle.setAttribute('aria-expanded',String(!open));detailsPanel.classList.toggle('hidden',open)});
phone.addEventListener('input',()=>{phone.value=digits(phone.value).slice(0,11)});
taxId.addEventListener('input',()=>{taxId.value=digits(taxId.value).slice(0,14)});
form.addEventListener('submit',async e=>{e.preventDefault();setMessage('');const data=validate();if(data.error){setMessage(data.error);return}const old=generateBtn.textContent;generateBtn.disabled=true;generateBtn.textContent='Gerando Pix...';try{const response=await fetch('/api/create-pix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json().catch(()=>({}));if(!response.ok||!result.success){const details=formatDetails(result.details);const gateway=result.gatewayStatus?`gateway ${result.gatewayStatus}`:'';throw new Error([result.message||'Não foi possível gerar o Pix.',gateway,details].filter(Boolean).join(' — '))}currentPixCode=result.pixCode;pixCodeField.value=currentPixCode;renderQr(currentPixCode);copyInlineBtn.disabled=false;openModal()}catch(err){setMessage(err.message||'Erro ao gerar o Pix.')}finally{generateBtn.disabled=false;generateBtn.textContent=old}});
copyInlineBtn.addEventListener('click',()=>copyText(currentPixCode,copyInlineBtn));
copyModalBtn.addEventListener('click',()=>copyText(currentPixCode,copyModalBtn));
document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
