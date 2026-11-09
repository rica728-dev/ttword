(function(){
  const API_URL=window.GAS_WEB_APP_URL||'';
  const USER_NAME=window.SINGLE_USER_NAME||'태태';
  const tabs=[...document.querySelectorAll('.diary-tabs button')];
  const writeView=document.getElementById('writeView');
  const calendarView=document.getElementById('calendarView');
  const content=document.getElementById('diaryContent');
  const count=document.getElementById('characterCount');
  const saveBtn=document.getElementById('saveDiaryBtn');
  const saveStatus=document.getElementById('saveStatus');
  const toast=document.getElementById('toast');
  let shownMonth=new Date();
  let monthEntries=[];
  let selectedEntry=null;

  function api(action,args){return new Promise((resolve,reject)=>{const callback='diaryCallback_'+Date.now()+'_'+Math.random().toString(36).slice(2);const script=document.createElement('script');const timer=setTimeout(()=>finish(new Error('서버 응답이 늦어지고 있어요. 다시 시도해 주세요.')),30000);function cleanup(){clearTimeout(timer);delete window[callback];script.remove()}function finish(error,value){cleanup();error?reject(error):resolve(value)}window[callback]=response=>response&&response.ok?finish(null,response.result):finish(new Error(response&&response.error||'요청에 실패했습니다.'));script.onerror=()=>finish(new Error('감사일기 서버를 불러오지 못했습니다.'));script.src=API_URL+'?'+new URLSearchParams({action,payload:JSON.stringify(args||[]),callback});document.body.appendChild(script)})}
  function localDateText(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
  function monthText(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`}
  function prettyDate(value){const [y,m,d]=value.split('-').map(Number);return `${y}년 ${m}월 ${d}일`}
  function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
  function updateCount(){const length=content.value.trim().length;count.textContent=`${length} / 30자 이상`;count.classList.toggle('ready',length>=30);saveBtn.disabled=length<30}
  async function loadToday(){const today=localDateText();document.getElementById('todayLabel').textContent=prettyDate(today);try{const entry=await api('getGratitudeDiaryEntry',[USER_NAME,today]);if(entry){content.value=entry.content;saveStatus.textContent='오늘 쓴 일기를 다시 고칠 수 있어요.';updateCount()}}catch(error){saveStatus.textContent=error.message}}
  async function saveDiary(){saveBtn.disabled=true;saveBtn.textContent='저장하는 중...';saveStatus.textContent='';try{const result=await api('saveGratitudeDiary',[{userName:USER_NAME,content:content.value}]);document.getElementById('todayLabel').textContent=prettyDate(result.date);saveStatus.textContent=result.updated?'오늘의 일기를 고쳤어요.':'오늘의 감사일기를 저장했어요!';showToast('🌼 참 잘했어요! 감사일기를 저장했어요.')}catch(error){saveStatus.textContent=error.message}finally{saveBtn.textContent='감사일기 저장하기';updateCount()}}
  async function loadMonth(){const key=monthText(shownMonth);document.getElementById('calendarTitle').textContent=`${shownMonth.getFullYear()}년 ${shownMonth.getMonth()+1}월`;const grid=document.getElementById('calendarGrid');grid.innerHTML='<p style="grid-column:1/-1;text-align:center">일기를 불러오는 중...</p>';try{monthEntries=await api('getGratitudeDiaryMonth',[USER_NAME,key]);renderCalendar()}catch(error){grid.innerHTML=`<p style="grid-column:1/-1;text-align:center">${error.message}</p>`}}
  function renderCalendar(){const grid=document.getElementById('calendarGrid');grid.innerHTML='';const y=shownMonth.getFullYear(),m=shownMonth.getMonth();const first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate();for(let i=0;i<first;i++){const blank=document.createElement('button');blank.className='calendar-day empty';grid.appendChild(blank)}for(let day=1;day<=last;day++){const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const entry=monthEntries.find(item=>item.date===date);const button=document.createElement('button');button.className='calendar-day'+(entry?' has-entry':'')+(date===localDateText()?' today':'');button.textContent=day;button.disabled=!entry;if(entry)button.addEventListener('click',()=>showEntry(entry));grid.appendChild(button)}}
  function showEntry(entry){selectedEntry=entry;const preview=document.getElementById('entryPreview');preview.innerHTML='';const title=document.createElement('h3');title.textContent='🌼 '+prettyDate(entry.date);const text=document.createElement('p');text.textContent=entry.content;preview.append(title,text);document.getElementById('deleteDiaryBtn').hidden=false}
  async function deleteDiary(){if(!selectedEntry)return;const deletedDate=selectedEntry.date;if(!confirm(`${prettyDate(deletedDate)} 감사일기를 삭제할까요?\n삭제한 일기는 되돌릴 수 없어요.`))return;const button=document.getElementById('deleteDiaryBtn');button.disabled=true;button.textContent='삭제하는 중...';try{await api('deleteGratitudeDiary',[{userName:USER_NAME,date:deletedDate}]);showToast('감사일기를 삭제했어요.');selectedEntry=null;button.hidden=true;document.getElementById('entryPreview').innerHTML='<p>꽃이 표시된 날짜를 눌러 일기를 읽어 보세요.</p>';await loadMonth();if(localDateText()===deletedDate){content.value='';saveStatus.textContent='';updateCount()}}catch(error){showToast(error.message)}finally{button.disabled=false;button.textContent='이 일기 삭제하기'}}
  function switchView(view){tabs.forEach(tab=>tab.classList.toggle('active',tab.dataset.view===view));writeView.classList.toggle('active',view==='write');calendarView.classList.toggle('active',view==='calendar');if(view==='calendar')loadMonth()}
  tabs.forEach(tab=>tab.addEventListener('click',()=>switchView(tab.dataset.view)));
  content.addEventListener('input',updateCount);saveBtn.addEventListener('click',saveDiary);
  document.getElementById('prevMonthBtn').addEventListener('click',()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()-1,1);loadMonth()});
  document.getElementById('nextMonthBtn').addEventListener('click',()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,1);loadMonth()});
  document.getElementById('deleteDiaryBtn').addEventListener('click',deleteDiary);
  updateCount();loadToday();
})();
