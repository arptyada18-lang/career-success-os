const STORAGE_KEY="career-success-os-v1";
const defaultState={
  profile:{name:"Arpit",title:"B.Com (Hons) • AI Creator • Web Developer",target:"Build a strong career through skills, projects, internships and client work."},
  xp:35,
  tasks:[
    {id:1,title:"Finish Career & Success OS core build",category:"Project",priority:"High",done:false},
    {id:2,title:"Study 45 minutes",category:"Study",priority:"Medium",done:false},
    {id:3,title:"Apply to 2 internships",category:"Career",priority:"High",done:false}
  ],
  goals:[
    {id:1,title:"Build 10 strong portfolio projects",progress:40,deadline:"2026-12-31"},
    {id:2,title:"Land a remote internship",progress:25,deadline:"2026-11-30"},
    {id:3,title:"Get first consistent freelance client",progress:20,deadline:"2026-12-15"}
  ],
  skills:[
    {id:1,name:"Web Development",level:58},
    {id:2,name:"AI / Prompt Engineering",level:66},
    {id:3,name:"Graphic Design",level:62},
    {id:4,name:"Video Editing",level:55},
    {id:5,name:"AI / ML",level:18}
  ],
  projects:[
    {id:1,name:"Career & Success OS",status:"Building",progress:15,link:""},
    {id:2,name:"AI Thumbnail Portfolio",status:"Live",progress:100,link:"https://arptyada18-lang.github.io/ai-thumbnail-portfolio/"},
    {id:3,name:"Smart Home Lab",status:"Live",progress:100,link:""}
  ],
  internships:[],
  clients:[],
  habits:[
    {id:1,name:"Study",streak:3,doneToday:false},
    {id:2,name:"Coding / Building",streak:5,doneToday:true},
    {id:3,name:"Outreach",streak:2,doneToday:false}
  ],
  achievements:[
    {id:1,title:"Builder Started",detail:"Started building Career & Success OS",date:"2026-09-21"}
  ],
  content:[],
  linkedin:[],
  learning:[
    {id:1,title:"AI & ML Roadmap",progress:8},
    {id:2,title:"Advanced Web Development",progress:35}
  ],
  study:[
    {id:1,title:"Financial Accounting",progress:22},
    {id:2,title:"Business Organisation",progress:10}
  ],
  weekly:[42,58,51,66,72,64,78]
};
let state=load();
let currentView="dashboard";

function load(){try{return {...structuredClone(defaultState),...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));updateLevelUI()}
function uid(){return Date.now()+Math.floor(Math.random()*1000)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
function addXp(n,msg="Progress saved"){state.xp+=n;save();toast(`${msg} • +${n} XP`)}
function levelInfo(){const level=Math.floor(state.xp/100)+1,inside=state.xp%100;return{level,inside,next:100}}
function score(){
  const task=state.tasks.length?state.tasks.filter(x=>x.done).length/state.tasks.length:0;
  const goals=state.goals.length?state.goals.reduce((a,b)=>a+b.progress,0)/(state.goals.length*100):0;
  const skills=state.skills.length?state.skills.reduce((a,b)=>a+b.level,0)/(state.skills.length*100):0;
  const habits=state.habits.length?state.habits.filter(x=>x.doneToday).length/state.habits.length:0;
  return Math.round((task*.3+goals*.25+skills*.25+habits*.2)*100)
}
function updateLevelUI(){
  const li=levelInfo();
  document.getElementById("sidebarLevel").textContent=`Level ${li.level}`;
  document.getElementById("sidebarXpText").textContent=`${li.inside} / 100 XP`;
  document.getElementById("sidebarXpBar").style.width=li.inside+"%";
}
function setDate(){
  const d=new Date();
  document.getElementById("todayLabel").textContent=d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
}
function navTo(view){
  currentView=view;
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  document.getElementById("sidebar").classList.remove("open");
  render();
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-view]");if(b)navTo(b.dataset.view);
});
document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("mobileMore").onclick=()=>document.getElementById("sidebar").classList.add("open");
document.getElementById("quickAddBtn").onclick=()=>openTaskModal();
document.getElementById("profileBtn").onclick=()=>navTo("settings");

function sectionTitle(title,subtitle,buttonText="",onclick=""){
  return `<div class="section-title"><div><h2>${title}</h2><p>${subtitle}</p></div>${buttonText?`<button class="btn primary" onclick="${onclick}">${buttonText}</button>`:""}</div>`
}
function progress(p){return `<div class="progress"><i style="width:${Math.max(0,Math.min(100,p))}%"></i></div>`}
function dashboard(){
  const li=levelInfo(),done=state.tasks.filter(t=>t.done).length,total=state.tasks.length;
  const activeProjects=state.projects.filter(p=>p.progress<100).length;
  const mission=state.tasks.find(t=>!t.done)?.title||"Plan your next meaningful move";
  return `
  <div class="hero">
    <div class="card hero-main">
      <p class="eyebrow">Today's Mission</p>
      <h2>${esc(mission)}</h2>
      <p>${esc(state.profile.target)}</p>
      <div class="hero-actions">
        <button class="btn primary" onclick="navTo('today')">Open Today's Plan</button>
        <button class="btn ghost" onclick="openTaskModal()">＋ Add Task</button>
      </div>
    </div>
    <div class="card level-card">
      <div class="card-head"><div><p class="eyebrow">Career Score</p><h3>Momentum</h3></div><span class="tag">Level ${li.level}</span></div>
      <div class="level-ring" style="--p:${score()}%"><strong>${score()}</strong></div>
      <div><div class="split"><span class="muted">XP to next level</span><b>${li.inside}/100</b></div>${progress(li.inside)}</div>
    </div>
  </div>
  <div class="grid grid-4">
    ${stat("Tasks done",`${done}/${total}`,"Daily execution")}
    ${stat("Active goals",state.goals.length,"Long-term direction")}
    ${stat("Projects building",activeProjects,"Portfolio growth")}
    ${stat("Applications",state.internships.length,"Career pipeline")}
  </div>
  <div class="grid grid-2" style="margin-top:18px">
    <div class="card">
      <div class="card-head"><div><p class="eyebrow">Focus</p><h3>Today's tasks</h3></div><button class="btn ghost" onclick="navTo('today')">View all</button></div>
      <div class="list">${state.tasks.slice(0,5).map(taskRow).join("")||empty("No tasks yet")}</div>
    </div>
    <div class="card">
      <div class="card-head"><div><p class="eyebrow">Direction</p><h3>Goal progress</h3></div><button class="btn ghost" onclick="navTo('goals')">Manage</button></div>
      <div class="list">${state.goals.slice(0,4).map(g=>`<div class="list-item"><div class="list-main"><div class="split"><strong>${esc(g.title)}</strong><span class="tag">${g.progress}%</span></div><small>Target: ${esc(g.deadline)}</small>${progress(g.progress)}</div></div>`).join("")}</div>
    </div>
  </div>
  <div class="grid grid-3" style="margin-top:18px">
    <div class="card"><div class="card-head"><div><p class="eyebrow">Consistency</p><h3>Habits</h3></div></div>
      <div class="list">${state.habits.map(h=>`<div class="list-item clickable" onclick="toggleHabit(${h.id})"><span>${h.doneToday?"●":"○"}</span><div class="list-main"><strong>${esc(h.name)}</strong><small>${h.streak} day streak</small></div><span class="tag">${h.doneToday?"Done":"Pending"}</span></div>`).join("")}</div>
    </div>
    <div class="card"><div class="card-head"><div><p class="eyebrow">This week</p><h3>Momentum trend</h3></div></div>
      <div class="chart-bars">${state.weekly.map(v=>`<i style="height:${v}%"></i>`).join("")}</div>
      <small class="muted">Your weekly consistency trend. Keep the line moving upward.</small>
    </div>
    <div class="card"><div class="card-head"><div><p class="eyebrow">Mindset</p><h3>Motivation center</h3></div></div>
      <div class="quote">“Small wins become a career when repeated long enough.”<small>Career & Success OS</small></div>
      <div class="mini-grid" style="margin-top:18px">
        <div class="mini-box"><strong>${state.achievements.length}</strong><span>Achievements</span></div>
        <div class="mini-box"><strong>${Math.max(...state.habits.map(h=>h.streak),0)}</strong><span>Best streak</span></div>
      </div>
    </div>
  </div>`;
}
function stat(label,value,note){return `<div class="card stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`}
function taskRow(t){return `<label class="list-item"><input type="checkbox" ${t.done?"checked":""} onchange="toggleTask(${t.id})"><div class="list-main"><strong style="${t.done?"text-decoration:line-through;opacity:.6":""}">${esc(t.title)}</strong><small>${esc(t.category)} • ${esc(t.priority)} priority</small></div><span class="tag">${esc(t.category)}</span></label>`}
function empty(msg){return `<div class="empty">${esc(msg)}</div>`}

function todayView(){
 return sectionTitle("Today","Turn intention into visible progress.","＋ Add Task","openTaskModal()")+
 `<div class="grid grid-4">
 ${stat("Completed",state.tasks.filter(x=>x.done).length,"Tasks finished today")}
 ${stat("Pending",state.tasks.filter(x=>!x.done).length,"Still on your plate")}
 ${stat("Focus score",score()+"/100","Based on your current system")}
 ${stat("XP",state.xp,"Earned through execution")}
 </div>
 <div class="card" style="margin-top:18px"><div class="card-head"><h3>Today's execution list</h3><span class="tag">Click checkbox to complete</span></div><div class="list">${state.tasks.map(taskRow).join("")||empty("Add your first task")}</div></div>`;
}
function goalsView(){
 return sectionTitle("Career Goals","Big outcomes broken into measurable progress.","＋ Add Goal","openGoalModal()")+
 `<div class="grid grid-3">${state.goals.map(g=>`<div class="card"><div class="card-head"><h3>${esc(g.title)}</h3><span class="tag">${g.progress}%</span></div><p class="muted">Deadline: ${esc(g.deadline)}</p>${progress(g.progress)}<div class="hero-actions"><button class="btn ghost" onclick="bumpGoal(${g.id},10)">+10%</button><button class="btn ghost danger" onclick="removeItem('goals',${g.id})">Delete</button></div></div>`).join("")||empty("No goals yet")}</div>`;
}
function skillsView(){
 return sectionTitle("Skills","Track the capabilities that increase your career value.","＋ Add Skill","openSkillModal()")+
 `<div class="grid grid-3">${state.skills.map(s=>`<div class="card skill-card"><div class="skill-meta"><h3>${esc(s.name)}</h3><span class="tag">${s.level}%</span></div><div class="metric-bar"><i style="width:${s.level}%"></i></div><div class="split"><span class="kpi">Current proficiency</span><button class="btn ghost" onclick="bumpSkill(${s.id},5)">+5</button></div></div>`).join("")}</div>`;
}
function projectsView(){
 return sectionTitle("Project Launchpad","Build proof of work, not just claims.","＋ Add Project","openProjectModal()")+
 table(["Project","Status","Progress","Link",""],state.projects.map(p=>[`<b>${esc(p.name)}</b>`,tag(p.status),p.progress+"%",p.link?`<a href="${esc(p.link)}" target="_blank">Open</a>`:"—",`<button class="btn ghost" onclick="bumpProject(${p.id},10)">+10%</button>`]));
}
function internshipsView(){
 return sectionTitle("Internship Tracker","Track every application and follow-up.","＋ Add Application","openPipelineModal('internships')")+
 table(["Company","Role","Status","Applied",""],state.internships.map(x=>[esc(x.company),esc(x.role),tag(x.status),esc(x.date),`<button class="btn ghost danger" onclick="removeItem('internships',${x.id})">Delete</button>`]));
}
function clientsView(){
 return sectionTitle("Client CRM","Your freelance pipeline from lead to paid work.","＋ Add Lead","openPipelineModal('clients')")+
 table(["Client","Service","Stage","Value",""],state.clients.map(x=>[esc(x.company),esc(x.role),tag(x.status),"₹"+esc(x.value||0),`<button class="btn ghost danger" onclick="removeItem('clients',${x.id})">Delete</button>`]));
}
function learningView(){return genericProgress("Learning Roadmap","Structured learning paths and course progress.",state.learning,"learning")}
function studyView(){return genericProgress("Study","College subjects and academic progress.",state.study,"study")}
function genericProgress(title,sub,arr,key){
 return sectionTitle(title,sub,"＋ Add","openSimpleProgressModal('"+key+"')")+`<div class="grid grid-3">${arr.map(x=>`<div class="card"><div class="split"><h3>${esc(x.title)}</h3><span class="tag">${x.progress}%</span></div><div style="margin-top:16px">${progress(x.progress)}</div><div class="hero-actions"><button class="btn ghost" onclick="bumpGeneric('${key}',${x.id},10)">+10%</button><button class="btn ghost danger" onclick="removeItem('${key}',${x.id})">Delete</button></div></div>`).join("")||empty("Nothing added yet")}</div>`
}
function contentView(){
 return sectionTitle("Content Creator Tracker","Plan ideas, publishing and performance.","＋ Add Content","openContentModal()")+
 table(["Title","Platform","Status","Views",""],state.content.map(x=>[esc(x.title),esc(x.platform),tag(x.status),esc(x.views||0),`<button class="btn ghost danger" onclick="removeItem('content',${x.id})">Delete</button>`]));
}
function linkedinView(){
 return sectionTitle("LinkedIn Growth","Track posts, networking and opportunities.","＋ Add Activity","openLinkedinModal()")+
 table(["Activity","Type","Status","Date",""],state.linkedin.map(x=>[esc(x.title),esc(x.type),tag(x.status),esc(x.date),`<button class="btn ghost danger" onclick="removeItem('linkedin',${x.id})">Delete</button>`]));
}
function habitsView(){
 return sectionTitle("Habit Tracker","Consistency compounds when you can see it.","＋ Add Habit","openHabitModal()")+
 `<div class="grid grid-3">${state.habits.map(h=>`<div class="card clickable" onclick="toggleHabit(${h.id})"><div class="split"><h3>${esc(h.name)}</h3><span class="tag">${h.doneToday?"Done today":"Tap to complete"}</span></div><div class="big-number" style="margin-top:16px">${h.streak}</div><span class="muted">day streak</span></div>`).join("")}</div>`
}
function achievementsView(){
 return sectionTitle("Achievements","A timeline of evidence that you are moving forward.","＋ Add Achievement","openAchievementModal()")+
 `<div class="list">${state.achievements.map(a=>`<div class="list-item"><div class="list-main"><strong>★ ${esc(a.title)}</strong><small>${esc(a.detail)} • ${esc(a.date)}</small></div></div>`).join("")}</div>`
}
function analyticsView(){
 const avgSkill=Math.round(state.skills.reduce((a,b)=>a+b.level,0)/Math.max(1,state.skills.length));
 const avgGoal=Math.round(state.goals.reduce((a,b)=>a+b.progress,0)/Math.max(1,state.goals.length));
 return sectionTitle("Analytics","Your system translated into numbers.")+
 `<div class="grid grid-4">${stat("Career score",score()+"/100","Composite progress")}${stat("Average skill",avgSkill+"%","Across tracked skills")}${stat("Goal progress",avgGoal+"%","Average completion")}${stat("Total XP",state.xp,"Lifetime execution points")}</div>
 <div class="grid grid-2" style="margin-top:18px">
 <div class="card"><div class="card-head"><h3>Weekly momentum</h3><span class="tag">7 days</span></div><div class="chart-bars">${state.weekly.map(v=>`<i style="height:${v}%"></i>`).join("")}</div></div>
 <div class="card"><div class="card-head"><h3>Skill portfolio</h3></div><div class="list">${state.skills.map(s=>`<div><div class="split"><span>${esc(s.name)}</span><b>${s.level}%</b></div><div class="metric-bar"><i style="width:${s.level}%"></i></div></div>`).join("")}</div></div></div>`
}
function reviewsView(){
 return sectionTitle("Weekly & Monthly Reviews","Reflect, reset and choose the next priority.")+
 `<div class="grid grid-2"><div class="card"><h3>Weekly Review</h3><p class="muted">What moved forward?</p><textarea class="field-review" id="weeklyReview" style="width:100%;min-height:180px;background:#111d30;color:white;border:1px solid var(--line);border-radius:14px;padding:12px">${esc(state.weeklyReview||"")}</textarea><div class="hero-actions"><button class="btn primary" onclick="saveReview('weeklyReview')">Save review</button></div></div>
 <div class="card"><h3>Monthly Review</h3><p class="muted">Wins, misses and next month's focus.</p><textarea class="field-review" id="monthlyReview" style="width:100%;min-height:180px;background:#111d30;color:white;border:1px solid var(--line);border-radius:14px;padding:12px">${esc(state.monthlyReview||"")}</textarea><div class="hero-actions"><button class="btn primary" onclick="saveReview('monthlyReview')">Save review</button></div></div></div>`
}
function settingsView(){
 return sectionTitle("Settings","Profile, backup and data controls.")+
 `<div class="grid grid-2"><div class="card"><h3>Profile</h3><div class="modal-body" style="padding:16px 0 0"><div class="field"><label>Name</label><input id="setName" value="${esc(state.profile.name)}"></div><div class="field"><label>Title</label><input id="setTitle" value="${esc(state.profile.title)}"></div><div class="field"><label>Main target</label><textarea id="setTarget">${esc(state.profile.target)}</textarea></div><button class="btn primary" onclick="saveSettings()">Save profile</button></div></div>
 <div class="card"><h3>Data tools</h3><p class="muted">Your data stays in this browser using LocalStorage unless you export it.</p><div class="hero-actions"><button class="btn ghost" onclick="exportData()">Export backup</button><label class="btn ghost">Import backup<input type="file" accept=".json" hidden onchange="importData(event)"></label><button class="btn ghost danger" onclick="resetData()">Reset all data</button></div></div></div>`
}
function table(headers,rows){
 return `<div class="card table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${headers.length}">${empty("No entries yet")}</td></tr>`}</tbody></table></div>`
}
function tag(s){return `<span class="tag">${esc(s)}</span>`}
function render(){
 const titles={dashboard:"Command Center",today:"Today",goals:"Career Goals",skills:"Skills",projects:"Project Launchpad",learning:"Learning Roadmap",study:"Study",internships:"Internships",clients:"Client CRM",content:"Creator Tracker",linkedin:"LinkedIn Growth",habits:"Habits",achievements:"Achievements",analytics:"Analytics",reviews:"Reviews",settings:"Settings"};
 document.getElementById("viewTitle").textContent=titles[currentView]||"Career & Success OS";
 document.getElementById("profileName").textContent=state.profile.name.split(" ")[0];
 document.getElementById("profileInitials").textContent=state.profile.name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
 const map={dashboard, today:todayView, goals:goalsView, skills:skillsView, projects:projectsView,learning:learningView,study:studyView,internships:internshipsView,clients:clientsView,content:contentView,linkedin:linkedinView,habits:habitsView,achievements:achievementsView,analytics:analyticsView,reviews:reviewsView,settings:settingsView};
 document.getElementById("viewRoot").innerHTML=(map[currentView]||dashboard)();
 updateLevelUI();
}

function toggleTask(id){const t=state.tasks.find(x=>x.id===id);if(!t)return;const before=t.done;t.done=!t.done;if(!before&&t.done)state.xp+=10;save();render();toast(t.done?"Task completed • +10 XP":"Task reopened")}
function toggleHabit(id){const h=state.habits.find(x=>x.id===id);if(!h)return;h.doneToday=!h.doneToday;if(h.doneToday){h.streak++;state.xp+=8}else h.streak=Math.max(0,h.streak-1);save();render();toast(h.doneToday?"Habit completed • +8 XP":"Habit unchecked")}
function bumpGoal(id,n){const g=state.goals.find(x=>x.id===id);if(!g)return;g.progress=Math.min(100,g.progress+n);state.xp+=5;save();render();toast("Goal progressed • +5 XP")}
function bumpSkill(id,n){const s=state.skills.find(x=>x.id===id);if(!s)return;s.level=Math.min(100,s.level+n);state.xp+=3;save();render();toast("Skill updated • +3 XP")}
function bumpProject(id,n){const p=state.projects.find(x=>x.id===id);if(!p)return;p.progress=Math.min(100,p.progress+n);if(p.progress===100)p.status="Complete";state.xp+=6;save();render();toast("Project moved forward • +6 XP")}
function bumpGeneric(key,id,n){const x=state[key].find(x=>x.id===id);if(!x)return;x.progress=Math.min(100,x.progress+n);state.xp+=4;save();render();toast("Progress updated • +4 XP")}
function removeItem(key,id){state[key]=state[key].filter(x=>x.id!==id);save();render();toast("Entry removed")}

const modal=document.getElementById("modal"),body=document.getElementById("modalBody"),titleEl=document.getElementById("modalTitle"),eyebrow=document.getElementById("modalEyebrow"),form=document.getElementById("modalForm");
let modalHandler=null;
function openModal(title,sub,html,handler){titleEl.textContent=title;eyebrow.textContent=sub;body.innerHTML=html;modalHandler=handler;modal.showModal()}
form.addEventListener("submit",e=>{e.preventDefault();if(modalHandler){modalHandler(new FormData(form));modal.close();modalHandler=null}})
function field(label,name,type="text",value="",extra=""){return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`}
function selectField(label,name,opts){return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>`}
function openTaskModal(){openModal("New task","Execution",field("Task","title","text","","required")+selectField("Category","category",["Project","Study","Career","Client","Content","Personal"])+selectField("Priority","priority",["High","Medium","Low"]),fd=>{state.tasks.unshift({id:uid(),title:fd.get("title"),category:fd.get("category"),priority:fd.get("priority"),done:false});save();render();toast("Task added")})}
function openGoalModal(){openModal("New goal","Direction",field("Goal","title","text","","required")+field("Deadline","deadline","date")+field("Starting progress %","progress","number","0",'min="0" max="100"'),fd=>{state.goals.push({id:uid(),title:fd.get("title"),deadline:fd.get("deadline")||"No deadline",progress:+fd.get("progress")||0});save();render();toast("Goal added")})}
function openSkillModal(){openModal("New skill","Capability",field("Skill name","name","text","","required")+field("Current level %","level","number","10",'min="0" max="100"'),fd=>{state.skills.push({id:uid(),name:fd.get("name"),level:+fd.get("level")||0});save();render();toast("Skill added")})}
function openProjectModal(){openModal("New project","Proof of work",field("Project name","name","text","","required")+selectField("Status","status",["Idea","Planning","Building","Live","Complete"])+field("Progress %","progress","number","0",'min="0" max="100"')+field("Live / GitHub link","link","url"),fd=>{state.projects.unshift({id:uid(),name:fd.get("name"),status:fd.get("status"),progress:+fd.get("progress")||0,link:fd.get("link")||""});save();render();toast("Project added")})}
function openPipelineModal(key){
 const client=key==="clients";
 openModal(client?"New client lead":"New internship application",client?"Freelance pipeline":"Career pipeline",
 field(client?"Client / Company":"Company","company","text","","required")+field(client?"Service":"Role","role","text","","required")+selectField("Status","status",client?["Lead","Contacted","Replied","Proposal","Won","Lost"]:["Applied","Follow-up","Interview","Offer","Rejected"])+(client?field("Estimated value ₹","value","number","0"):field("Applied date","date","date")),
 fd=>{state[key].unshift({id:uid(),company:fd.get("company"),role:fd.get("role"),status:fd.get("status"),value:fd.get("value")||0,date:fd.get("date")||new Date().toISOString().slice(0,10)});save();render();toast(client?"Lead added":"Application added")})
}
function openSimpleProgressModal(key){openModal("Add item","Progress tracker",field("Title","title","text","","required")+field("Progress %","progress","number","0",'min="0" max="100"'),fd=>{state[key].push({id:uid(),title:fd.get("title"),progress:+fd.get("progress")||0});save();render();toast("Added")})}
function openContentModal(){openModal("New content","Creator tracker",field("Title","title","text","","required")+selectField("Platform","platform",["YouTube","Instagram","LinkedIn","Other"])+selectField("Status","status",["Idea","Script","Editing","Ready","Posted"])+field("Views","views","number","0"),fd=>{state.content.unshift({id:uid(),title:fd.get("title"),platform:fd.get("platform"),status:fd.get("status"),views:+fd.get("views")||0});save();render();toast("Content added")})}
function openLinkedinModal(){openModal("LinkedIn activity","Growth tracker",field("Activity","title","text","","required")+selectField("Type","type",["Post","Networking","Application","Profile"])+selectField("Status","status",["Planned","Done"])+field("Date","date","date"),fd=>{state.linkedin.unshift({id:uid(),title:fd.get("title"),type:fd.get("type"),status:fd.get("status"),date:fd.get("date")||new Date().toISOString().slice(0,10)});save();render();toast("LinkedIn activity added")})}
function openHabitModal(){openModal("New habit","Consistency",field("Habit name","name","text","","required"),fd=>{state.habits.push({id:uid(),name:fd.get("name"),streak:0,doneToday:false});save();render();toast("Habit added")})}
function openAchievementModal(){openModal("New achievement","Milestone",field("Title","title","text","","required")+field("Detail","detail","text")+field("Date","date","date"),fd=>{state.achievements.unshift({id:uid(),title:fd.get("title"),detail:fd.get("detail"),date:fd.get("date")||new Date().toISOString().slice(0,10)});state.xp+=20;save();render();toast("Achievement saved • +20 XP")})}
function saveReview(key){state[key]=document.getElementById(key).value;save();toast("Review saved")}
function saveSettings(){state.profile.name=document.getElementById("setName").value.trim()||"Arpit";state.profile.title=document.getElementById("setTitle").value.trim();state.profile.target=document.getElementById("setTarget").value.trim();save();render();toast("Profile updated")}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="career-success-os-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup exported")}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();render();toast("Backup imported")}catch{toast("Invalid backup file")}};r.readAsText(f)}
function resetData(){if(confirm("Reset all Career & Success OS data?")){state=structuredClone(defaultState);save();render();toast("Data reset")}}
document.getElementById("globalSearch").addEventListener("input",e=>{
 const q=e.target.value.trim().toLowerCase();if(!q){render();return}
 const pools=[...state.tasks.map(x=>({type:"Task",title:x.title})),...state.goals.map(x=>({type:"Goal",title:x.title})),...state.projects.map(x=>({type:"Project",title:x.name})),...state.skills.map(x=>({type:"Skill",title:x.name}))];
 const hits=pools.filter(x=>x.title.toLowerCase().includes(q));
 document.getElementById("viewRoot").innerHTML=sectionTitle("Search results",`Matches for “${esc(q)}”`)+`<div class="card search-results">${hits.length?hits.map(x=>`<div class="search-result"><b>${esc(x.title)}</b><small> • ${x.type}</small></div>`).join(""):empty("No matching items")}</div>`;
});
setDate();updateLevelUI();render();
