// Career & Success OS — Advanced V4 layer
(function(){
  const V4_VERSION=4;
  let deferredInstallPrompt=null;

  function v4DateKey(d){
    const x=d||new Date();
    return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
  }
  function cloneForSnapshot(){
    const copy=JSON.parse(JSON.stringify(state));
    copy.snapshots=[];
    return copy;
  }
  function saveV4(){save()}
  function autoSnapshot(label){
    state.snapshots=Array.isArray(state.snapshots)?state.snapshots:[];
    state.snapshots.unshift({id:uid(),label:label||"Snapshot",createdAt:new Date().toISOString(),data:JSON.stringify(cloneForSnapshot())});
    state.snapshots=state.snapshots.slice(0,5);
  }
  function ensureV4State(){
    state.schemaVersion=V4_VERSION;
    state.inbox=Array.isArray(state.inbox)?state.inbox:[];
    state.snapshots=Array.isArray(state.snapshots)?state.snapshots:[];
    state.lastDailyRollover=state.lastDailyRollover||v4DateKey();
    state.tasks=(state.tasks||[]).map(function(t){
      return Object.assign({recur:"None",estimate:30,recurAnchor:t.due||v4DateKey(),completedAt:""},t);
    });
    saveV4();
  }
  function recurrenceDueToday(task){
    const now=new Date(),day=now.getDay();
    if(task.recur==="Daily")return true;
    if(task.recur==="Weekdays")return day>=1&&day<=5;
    if(task.recur==="Weekly"){
      const a=new Date((task.recurAnchor||task.due||v4DateKey())+"T00:00:00");
      return !Number.isNaN(a.getTime())&&a.getDay()===day;
    }
    return false;
  }
  function dailyRollover(){
    const today=v4DateKey();
    if(state.lastDailyRollover===today)return;
    autoSnapshot("Auto backup before "+today);
    state.habits=(state.habits||[]).map(function(h){return Object.assign({},h,{doneToday:false})});
    state.tasks=(state.tasks||[]).map(function(t){
      if(t.recur!=="None"&&recurrenceDueToday(t)){
        return Object.assign({},t,{done:false,due:today});
      }
      return t;
    });
    state.lastDailyRollover=today;
    saveV4();
  }

  function taskUrgency(task){
    let s=0;
    if(task.done)return -999;
    if(task.priority==="High")s+=45; else if(task.priority==="Medium")s+=24; else s+=10;
    const d=task.due?daysFromToday(task.due):null;
    if(d!==null){
      if(d<0)s+=70+Math.min(30,Math.abs(d)*4);
      else if(d===0)s+=60;
      else if(d<=2)s+=42;
      else if(d<=7)s+=18;
    }
    if(["Career","Client","Project"].includes(task.category))s+=12;
    if(task.recur!=="None")s+=7;
    const est=Number(task.estimate||30);
    if(est<=30)s+=8;
    return s;
  }
  function recommendedTasks(){
    return (state.tasks||[]).filter(function(t){return !t.done}).map(function(t){return {task:t,score:taskUrgency(t)}}).sort(function(a,b){return b.score-a.score}).slice(0,3);
  }
  function smartPlannerCard(){
    const recs=recommendedTasks();
    const overdue=(state.tasks||[]).filter(function(t){return !t.done&&t.due&&daysFromToday(t.due)<0}).length;
    const dueToday=(state.tasks||[]).filter(function(t){return !t.done&&t.due&&daysFromToday(t.due)===0}).length;
    const focusTarget=recs.reduce(function(sum,x){return sum+Number(x.task.estimate||30)},0);
    return '<div class="smart-planner"><div class="card planner-main"><div class="card-head"><div><p class="eyebrow">Smart Daily Planner</p><h3>Next best actions</h3></div><span class="system-badge"><i class="system-dot"></i>Rule-based, no paid AI</span></div><p class="muted">Prioritized from deadlines, importance, category and estimated effort.</p><div class="planner-rank">'+
      (recs.length?recs.map(function(x,i){return '<div class="planner-item"><div class="planner-pos">'+(i+1)+'</div><div><strong>'+esc(x.task.title)+'</strong><small>'+esc(x.task.category)+' • '+esc(x.task.priority)+' • ~'+Number(x.task.estimate||30)+' min'+(x.task.due?' • due '+esc(x.task.due):'')+'</small></div><span class="planner-score">'+x.score+' pts</span></div>'}).join(""):empty("No pending work. Suspiciously efficient."))+
      '</div></div><div class="card"><div class="card-head"><div><p class="eyebrow">Daily Brief</p><h3>Workload snapshot</h3></div></div><div class="daily-brief"><div class="brief-line"><span>Overdue</span><b class="'+(overdue?'danger':'good')+'">'+overdue+'</b></div><div class="brief-line"><span>Due today</span><b>'+dueToday+'</b></div><div class="brief-line"><span>Top-3 focus time</span><b>'+focusTarget+' min</b></div><div class="brief-line"><span>Inbox items</span><b>'+state.inbox.length+'</b></div></div><div class="hero-actions"><button class="btn primary" onclick="navTo(\'today\')">Execute plan</button><button class="btn ghost" onclick="navTo(\'inbox\')">Open inbox</button></div></div></div>';
  }

  function v4TaskRow(t){
    return '<div class="task-v4"><input type="checkbox" '+(t.done?'checked':'')+' onchange="toggleTask('+t.id+')"><div class="list-main"><strong style="'+(t.done?'text-decoration:line-through;opacity:.58':'')+'">'+esc(t.title)+(t.recur!=="None"?'<span class="recurring-chip">↻ '+esc(t.recur)+'</span>':'')+'</strong><small>'+esc(t.category)+' • '+esc(t.priority)+' • ~'+Number(t.estimate||30)+' min'+(t.due?' • due '+esc(t.due):'')+'</small></div><div class="task-actions"><button class="btn ghost" onclick="editTaskModal('+t.id+')">Edit</button><button class="btn ghost danger" onclick="deleteTask('+t.id+')">Delete</button></div></div>';
  }

  window.deleteTask=function(id){
    state.tasks=state.tasks.filter(function(t){return t.id!==id});
    saveV4();render();toast("Task deleted");
  };
  window.editTaskModal=function(id){
    const t=state.tasks.find(function(x){return x.id===id});if(!t)return;
    openModal("Edit task","Execution",
      field("Task","title","text",t.title,"required")+
      selectField("Category","category",["Project","Study","Career","Client","Content","Personal"])+
      selectField("Priority","priority",["High","Medium","Low"])+
      field("Due date","due","date",t.due||"")+
      field("Estimate (minutes)","estimate","number",String(t.estimate||30),'min="5" max="480" step="5"')+
      selectField("Repeat","recur",["None","Daily","Weekdays","Weekly"]),
      function(fd){
        t.title=fd.get("title");t.category=fd.get("category");t.priority=fd.get("priority");t.due=fd.get("due")||"";t.estimate=Math.max(5,+fd.get("estimate")||30);t.recur=fd.get("recur")||"None";t.recurAnchor=t.due||t.recurAnchor||v4DateKey();
        saveV4();render();toast("Task updated");
      }
    );
    setTimeout(function(){
      const cat=form.elements.category,pri=form.elements.priority,rec=form.elements.recur;
      if(cat)cat.value=t.category;if(pri)pri.value=t.priority;if(rec)rec.value=t.recur||"None";
    },0);
  };

  openTaskModal=function(){
    openModal("New task","Execution",
      field("Task","title","text","","required")+
      selectField("Category","category",["Project","Study","Career","Client","Content","Personal"])+
      selectField("Priority","priority",["High","Medium","Low"])+
      field("Due date","due","date")+
      field("Estimate (minutes)","estimate","number","30",'min="5" max="480" step="5"')+
      selectField("Repeat","recur",["None","Daily","Weekdays","Weekly"]),
      function(fd){
        const due=fd.get("due")||"";
        state.tasks.unshift({id:uid(),title:fd.get("title"),category:fd.get("category"),priority:fd.get("priority"),due:due,estimate:Math.max(5,+fd.get("estimate")||30),recur:fd.get("recur")||"None",recurAnchor:due||v4DateKey(),completedAt:"",done:false});
        saveV4();render();toast("Task added");
      }
    );
  };

  const toggleTaskV3=toggleTask;
  toggleTask=function(id){
    const before=state.tasks.find(function(x){return x.id===id});
    const was=before&&before.done;
    toggleTaskV3(id);
    const after=state.tasks.find(function(x){return x.id===id});
    if(after&&!was&&after.done){after.completedAt=new Date().toISOString();saveV4()}
    if(after&&was&&!after.done){after.completedAt="";saveV4()}
  };

  todayView=function(){
    const pending=state.tasks.filter(function(x){return !x.done}).sort(function(a,b){return taskUrgency(b)-taskUrgency(a)});
    const done=state.tasks.filter(function(x){return x.done});
    return sectionTitle("Today","Execute the highest-value work first.","＋ Add Task","openTaskModal()")+
      smartPlannerCard()+
      '<div class="grid grid-4">'+
      stat("Completed",done.length,"Finished work")+
      stat("Pending",pending.length,"Remaining work")+
      stat("Recurring",state.tasks.filter(function(t){return t.recur!=="None"}).length,"Automated tasks")+
      stat("Estimated load",pending.reduce(function(s,t){return s+Number(t.estimate||30)},0)+"m","Pending task time")+
      '</div><div class="card" style="margin-top:18px"><div class="card-head"><div><p class="eyebrow">Execution Queue</p><h3>Prioritized tasks</h3></div><span class="tag">Auto-ranked</span></div><div class="list">'+(pending.map(v4TaskRow).join("")||empty("Nothing pending"))+'</div></div>'+
      (done.length?'<div class="card" style="margin-top:18px"><div class="card-head"><h3>Completed</h3><span class="tag">'+done.length+'</span></div><div class="list">'+done.slice(0,10).map(v4TaskRow).join("")+'</div></div>':'');
  };

  window.captureInbox=function(){
    const input=document.getElementById("inboxCapture");if(!input)return;
    const text=input.value.trim();if(!text)return;
    state.inbox.unshift({id:uid(),text:text,createdAt:new Date().toISOString()});
    input.value="";saveV4();render();toast("Captured to inbox");
  };
  window.deleteInbox=function(id){state.inbox=state.inbox.filter(function(x){return x.id!==id});saveV4();render()};
  window.convertInboxToTask=function(id){
    const item=state.inbox.find(function(x){return x.id===id});if(!item)return;
    state.tasks.unshift({id:uid(),title:item.text,category:"Personal",priority:"Medium",due:"",estimate:30,recur:"None",recurAnchor:v4DateKey(),completedAt:"",done:false});
    state.inbox=state.inbox.filter(function(x){return x.id!==id});saveV4();render();toast("Inbox item converted to task");
  };
  window.inboxView=function(){
    return sectionTitle("Quick Inbox","Capture first. Organize later.")+
      '<div class="inbox-grid"><div class="card capture-box"><div class="card-head"><div><p class="eyebrow">Quick Capture</p><h3>Get it out of your head</h3></div></div><textarea id="inboxCapture" class="capture-input" placeholder="Idea, reminder, client thought, project note..."></textarea><div class="hero-actions"><button class="btn primary" onclick="captureInbox()">Capture</button></div></div><div class="card"><div class="card-head"><div><p class="eyebrow">Unprocessed</p><h3>Inbox</h3></div><span class="tag">'+state.inbox.length+' items</span></div><div class="list">'+
      (state.inbox.length?state.inbox.map(function(x){return '<div class="inbox-item"><div class="list-main"><strong>'+esc(x.text)+'</strong><small>'+new Date(x.createdAt).toLocaleString("en-IN")+'</small></div><div class="task-actions"><button class="btn ghost" onclick="convertInboxToTask('+x.id+')">→ Task</button><button class="btn ghost danger" onclick="deleteInbox('+x.id+')">Delete</button></div></div>'}).join(""):empty("Inbox zero. Brain slightly less crowded."))+
      '</div></div></div>';
  };

  window.createManualSnapshot=function(){
    autoSnapshot("Manual backup");saveV4();render();toast("Local snapshot created");
  };
  window.restoreSnapshot=function(id){
    const snap=state.snapshots.find(function(x){return x.id===id});if(!snap)return;
    if(!confirm("Restore this snapshot? Current data will be replaced."))return;
    const keep=state.snapshots;
    try{state=JSON.parse(snap.data);state.snapshots=keep;ensureV4State();saveV4();render();toast("Snapshot restored")}catch(e){toast("Snapshot could not be restored")}
  };
  window.deleteSnapshot=function(id){state.snapshots=state.snapshots.filter(function(x){return x.id!==id});saveV4();render()};

  function backupSettingsCard(){
    return '<div class="grid grid-2" style="margin-top:18px"><div class="card"><div class="card-head"><div><p class="eyebrow">Safety Net</p><h3>Local snapshots</h3></div><button class="btn primary" onclick="createManualSnapshot()">Create snapshot</button></div><p class="muted">Keeps up to 5 restore points inside this browser. Useful before large edits, because apparently humans enjoy deleting the one thing they meant to keep.</p><div class="backup-list">'+
      (state.snapshots.length?state.snapshots.map(function(s){return '<div class="backup-item"><div><b>'+esc(s.label)+'</b><small class="muted" style="display:block;margin-top:3px">'+new Date(s.createdAt).toLocaleString("en-IN")+'</small></div><div class="task-actions"><button class="btn ghost" onclick="restoreSnapshot('+s.id+')">Restore</button><button class="btn ghost danger" onclick="deleteSnapshot('+s.id+')">Delete</button></div></div>'}).join(""):empty("No snapshots yet"))+
      '</div></div><div class="card install-card"><div class="card-head"><div><p class="eyebrow">App Mode</p><h3>Install & Offline</h3></div><span class="offline-pill">Offline files enabled</span></div><p class="muted">Career & Success OS can work like an installable web app after the browser accepts the PWA install prompt.</p><div class="hero-actions"><button class="btn primary" onclick="installCareerOS()">Install app</button></div><small class="muted">No account, cloud database or paid API is required for this version.</small></div></div>';
  }

  const settingsV4Base=settingsView;
  settingsView=function(){return settingsV4Base()+backupSettingsCard()};

  const dashboardV4Base=dashboard;
  dashboard=function(){return smartPlannerCard()+dashboardV4Base()};

  const commandItemsV4Base=commandItems;
  commandItems=function(){
    return commandItemsV4Base().concat([
      ["Inbox","Open quick capture inbox",function(){navTo("inbox")}],
      ["Create backup","Save a local restore snapshot",function(){createManualSnapshot()}],
      ["Install app","Install Career & Success OS",function(){installCareerOS()}]
    ]);
  };

  window.installCareerOS=async function(){
    if(!deferredInstallPrompt){toast("Install option appears when your browser makes the PWA prompt available");return}
    deferredInstallPrompt.prompt();
    try{await deferredInstallPrompt.userChoice}catch(e){}
    deferredInstallPrompt=null;
  };
  window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredInstallPrompt=e});

  if("serviceWorker" in navigator){
    window.addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(function(){})});
  }

  const renderV4Base=render;
  render=function(){
    if(currentView==="inbox"){
      document.getElementById("viewTitle").textContent="Quick Inbox";
      document.getElementById("viewRoot").innerHTML=inboxView();
      document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view==="inbox")});
      updateLevelUI();updateAdvancedHeader();return;
    }
    renderV4Base();
  };

  ensureV4State();
  dailyRollover();
  render();
})();