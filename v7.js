// Career & Success OS — Advanced V7 release-quality UX layer
(function(){
  const V7_VERSION=7;
  const LAST_GOOD_KEY="career-success-os-last-good-v7";
  let calendarMode="month";

  const widgetDefs=[
    {id:"overview",title:"Overview"},
    {id:"tasks",title:"Priority Tasks"},
    {id:"goals",title:"Goal Radar"},
    {id:"habits",title:"Habit Snapshot"},
    {id:"deadlines",title:"Deadline Radar"},
    {id:"pipeline",title:"Career Pipeline"},
    {id:"momentum",title:"Momentum & Motivation"}
  ];

  function v7DateKey(d){
    const x=d||new Date();
    return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
  }
  function safeArray(v){return Array.isArray(v)?v:[]}
  function validateStateObject(s){
    const issues=[];
    if(!s||typeof s!=="object")return {fatal:true,issues:["State is not an object"]};
    ["tasks","goals","skills","projects","internships","clients","habits","achievements","content","linkedin","learning","study","activityLog","inbox","snapshots"].forEach(function(k){
      if(!Array.isArray(s[k]))issues.push(k+" should be an array");
    });
    if(typeof s.xp!=="number"||!Number.isFinite(s.xp))issues.push("xp should be a finite number");
    if(!s.profile||typeof s.profile!=="object")issues.push("profile is missing");
    return {fatal:false,issues:issues};
  }
  function repairStateObject(s){
    const base=typeof structuredClone==="function"?structuredClone(defaultState):JSON.parse(JSON.stringify(defaultState));
    const out=Object.assign(base,(s&&typeof s==="object")?s:{});
    ["tasks","goals","skills","projects","internships","clients","habits","achievements","content","linkedin","learning","study","activityLog","inbox","snapshots"].forEach(function(k){
      out[k]=safeArray(out[k]);
    });
    out.xp=Number.isFinite(Number(out.xp))?Number(out.xp):0;
    out.profile=out.profile&&typeof out.profile==="object"?out.profile:{name:"Arpit",title:"",target:""};
    out.profile.name=String(out.profile.name||"Arpit");
    out.profile.title=String(out.profile.title||"");
    out.profile.target=String(out.profile.target||"");
    out.schemaVersion=V7_VERSION;
    return out;
  }
  function storeLastGood(){
    const check=validateStateObject(state);
    if(!check.fatal&&!check.issues.length){
      try{localStorage.setItem(LAST_GOOD_KEY,JSON.stringify(state))}catch(e){}
    }
  }
  const saveV7Base=save;
  save=function(){
    state=repairStateObject(state);
    saveV7Base();
    storeLastGood();
  };

  function ensureV7State(){
    state=repairStateObject(state);
    state.dashboardWidgets=Array.isArray(state.dashboardWidgets)?state.dashboardWidgets:widgetDefs.map(function(w){return w.id});
    state.dashboardHidden=state.dashboardHidden&&typeof state.dashboardHidden==="object"?state.dashboardHidden:{};
    widgetDefs.forEach(function(w){if(!state.dashboardWidgets.includes(w.id))state.dashboardWidgets.push(w.id)});
    state.accessibility=Object.assign({reducedMotion:false,largeText:false,highContrast:false},state.accessibility||{});
    state.schemaVersion=V7_VERSION;
    save();
  }

  function applyAccessibility(){
    document.documentElement.classList.toggle("reduced-motion",!!state.accessibility.reducedMotion);
    document.documentElement.classList.toggle("large-text",!!state.accessibility.largeText);
    document.documentElement.classList.toggle("high-contrast",!!state.accessibility.highContrast);
  }
  window.toggleAccessibility=function(key){
    state.accessibility[key]=!state.accessibility[key];
    applyAccessibility();save();render();toast("Accessibility preference updated");
  };

  function topTasks(){
    return (state.tasks||[]).filter(function(t){return !t.done}).sort(function(a,b){
      const p={High:3,Medium:2,Low:1};
      const ad=a.due?daysFromToday(a.due):999,bd=b.due?daysFromToday(b.due):999;
      return (p[b.priority]||0)-(p[a.priority]||0) || ad-bd;
    }).slice(0,5);
  }
  function widgetOverview(){
    const done=state.tasks.filter(function(t){return t.done}).length;
    return '<div class="card widget-card full"><div class="card-head"><div><p class="eyebrow">Command Center</p><h3>'+esc(state.profile.name)+' • Career & Success OS</h3></div><span class="release-badge">V7 RELEASE</span></div><div class="grid grid-4">'+
      stat("Career score",score()+"/100","Composite progress")+
      stat("Tasks",done+"/"+state.tasks.length,"Completed")+
      stat("Projects",state.projects.length,"Tracked proof of work")+
      stat("XP",state.xp,"Lifetime execution points")+
      '</div></div>';
  }
  function widgetTasks(){
    const list=topTasks();
    return '<div class="card widget-card"><div class="card-head"><div><p class="eyebrow">Priority</p><h3>Next tasks</h3></div><button class="btn ghost" onclick="navTo(\'today\')">Today</button></div><div class="list">'+(list.length?list.map(taskRow).join(""):empty("No pending tasks"))+'</div></div>';
  }
  function widgetGoals(){
    return '<div class="card widget-card"><div class="card-head"><div><p class="eyebrow">Direction</p><h3>Goal radar</h3></div><button class="btn ghost" onclick="navTo(\'goals\')">Goals</button></div><div class="list">'+
      (state.goals.slice(0,4).map(function(g){return '<div class="list-item"><div class="list-main"><div class="split"><strong>'+esc(g.title)+'</strong><span class="tag">'+g.progress+'%</span></div><small>'+esc(g.deadline)+'</small>'+progress(g.progress)+'</div></div>'}).join("")||empty("No goals"))+
      '</div></div>';
  }
  function widgetHabits(){
    return '<div class="card widget-card"><div class="card-head"><div><p class="eyebrow">Consistency</p><h3>Habit snapshot</h3></div><button class="btn ghost" onclick="navTo(\'habits\')">Habits</button></div><div class="list">'+
      (state.habits.slice(0,5).map(function(h){return '<div class="list-item"><span>'+(h.doneToday?"●":"○")+'</span><div class="list-main"><strong>'+esc(h.name)+'</strong><small>'+Number(h.streak||0)+' day streak</small></div><span class="tag">'+(h.doneToday?"Done":"Pending")+'</span></div>'}).join("")||empty("No habits"))+
      '</div></div>';
  }
  function widgetDeadlines(){
    const items=deadlineItems().slice(0,5);
    return '<div class="card widget-card"><div class="card-head"><div><p class="eyebrow">Time</p><h3>Deadline radar</h3></div><button class="btn ghost" onclick="navTo(\'calendar\')">Calendar</button></div><div class="deadline-strip">'+
      (items.length?items.map(function(x){const d=daysFromToday(x.date);return '<div class="deadline-chip '+(d<0?"overdue":d<=3?"soon":"")+'"><strong>'+esc(x.title)+'</strong><small>'+esc(x.type)+' • '+esc(x.date)+(d<0?" • overdue":d===0?" • today":"")+'</small></div>'}).join(""):empty("No upcoming deadlines"))+
      '</div></div>';
  }
  function widgetPipeline(){
    const interviews=state.internships.filter(function(x){return x.status==="Interview"||x.status==="Offer"}).length;
    const wins=state.clients.filter(function(x){return x.status==="Won"}).length;
    const live=state.projects.filter(function(x){return x.status==="Live"||x.status==="Complete"}).length;
    return '<div class="card widget-card"><div class="card-head"><div><p class="eyebrow">Pipeline</p><h3>Career movement</h3></div><button class="btn ghost" onclick="navTo(\'boards\')">Boards</button></div><div class="mini-grid"><div class="mini-box"><strong>'+live+'</strong><span>Live / complete projects</span></div><div class="mini-box"><strong>'+interviews+'</strong><span>Interviews / offers</span></div><div class="mini-box"><strong>'+wins+'</strong><span>Clients won</span></div><div class="mini-box"><strong>'+state.inbox.length+'</strong><span>Inbox items</span></div></div></div>';
  }
  function widgetMomentum(){
    const best=Math.max(0,...state.habits.map(function(h){return Number(h.streak||0)}));
    return '<div class="card widget-card"><div class="card-head"><div><p class="eyebrow">Momentum</p><h3>Keep moving</h3></div><button class="btn ghost" onclick="navTo(\'reports\')">Reports</button></div><div class="quote">“Evidence beats intention. Ship something, track it, improve it.”<small>Career & Success OS</small></div><div class="mini-grid" style="margin-top:16px"><div class="mini-box"><strong>'+state.achievements.length+'</strong><span>Achievements</span></div><div class="mini-box"><strong>'+best+'</strong><span>Best streak</span></div></div></div>';
  }
  const widgetRenderers={overview:widgetOverview,tasks:widgetTasks,goals:widgetGoals,habits:widgetHabits,deadlines:widgetDeadlines,pipeline:widgetPipeline,momentum:widgetMomentum};

  function dashboardV7(){
    const visible=state.dashboardWidgets.filter(function(id){return !state.dashboardHidden[id]&&widgetRenderers[id]});
    return sectionTitle("Command Center","A customizable dashboard built around the work that matters.","Customize","openWidgetManager()")+
      '<div class="dashboard-controls"><button class="btn ghost" onclick="navTo(\'today\')">✓ Today</button><button class="btn ghost" onclick="navTo(\'focus\')">◉ Focus</button><button class="btn ghost" onclick="navTo(\'inbox\')">⌑ Inbox</button><button class="btn ghost" onclick="navTo(\'reports\')">▧ Reports</button></div>'+
      '<div class="widget-grid">'+visible.map(function(id){return widgetRenderers[id]();}).join("")+'</div>';
  }
  dashboard=dashboardV7;

  window.toggleDashboardWidget=function(id){
    state.dashboardHidden[id]=!state.dashboardHidden[id];save();render();
  };
  window.moveDashboardWidget=function(id,dir){
    const i=state.dashboardWidgets.indexOf(id),j=i+dir;if(i<0||j<0||j>=state.dashboardWidgets.length)return;
    const tmp=state.dashboardWidgets[i];state.dashboardWidgets[i]=state.dashboardWidgets[j];state.dashboardWidgets[j]=tmp;save();render();
  };
  window.resetDashboardWidgets=function(){
    state.dashboardWidgets=widgetDefs.map(function(w){return w.id});state.dashboardHidden={};save();render();toast("Dashboard reset");
  };
  window.openWidgetManager=function(){
    openModal("Dashboard widgets","Show, hide and reorder",
      '<div class="widget-manager">'+state.dashboardWidgets.map(function(id){
        const w=widgetDefs.find(function(x){return x.id===id});if(!w)return "";
        return '<div class="widget-manager-row"><input type="checkbox" '+(!state.dashboardHidden[id]?'checked':'')+' onchange="toggleDashboardWidget(\''+id+'\')"><div><strong>'+esc(w.title)+'</strong><small class="muted" style="display:block;margin-top:3px">'+esc(id)+'</small></div><div class="widget-order-actions"><button type="button" class="btn ghost" onclick="moveDashboardWidget(\''+id+'\',-1)">↑</button><button type="button" class="btn ghost" onclick="moveDashboardWidget(\''+id+'\',1)">↓</button></div></div>';
      }).join("")+'</div><div class="hero-actions"><button type="button" class="btn ghost" onclick="resetDashboardWidgets()">Reset layout</button></div>',
      function(){}
    );
    document.getElementById("modalSave").style.display="none";
    modal.addEventListener("close",function(){document.getElementById("modalSave").style.display=""},{once:true});
  };

  const calendarV7Base=calendarView;
  window.setCalendarMode=function(mode){calendarMode=mode;render()};
  function agendaHtml(){
    const items=deadlineItems().slice().filter(function(x){const d=daysFromToday(x.date);return d>=-7&&d<=45});
    const groups={};
    items.forEach(function(x){groups[x.date]=groups[x.date]||[];groups[x.date].push(x)});
    const keys=Object.keys(groups).sort();
    if(!keys.length)return '<div class="card agenda-empty">No deadlines in the current agenda window.</div>';
    return '<div class="agenda-list">'+keys.map(function(date){
      const d=parseDaySafe(date),label=d?d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}):date;
      return '<section class="agenda-day"><div class="agenda-day-head"><strong>'+esc(label)+'</strong><span class="tag">'+groups[date].length+' item(s)</span></div><div class="agenda-items">'+groups[date].map(function(x){
        const edit=x.type==="Task"?"editTaskModal("+Number(String(x.id).replace("task-",""))+")":"editGoalModal("+Number(String(x.id).replace("goal-",""))+")";
        return '<div class="agenda-item"><small>'+esc(x.type)+'</small><div><strong>'+esc(x.title)+'</strong><small>'+esc(x.date)+'</small></div><button class="btn ghost" onclick="'+edit+'">Edit</button></div>';
      }).join("")+'</div></section>';
    }).join("")+'</div>';
  }
  function parseDaySafe(s){const d=new Date(s+"T00:00:00");return Number.isNaN(d.getTime())?null:d}
  calendarView=function(){
    const toggle='<div class="board-toolbar"><button class="btn '+(calendarMode==="month"?"primary":"ghost")+'" onclick="setCalendarMode(\'month\')">Month</button><button class="btn '+(calendarMode==="agenda"?"primary":"ghost")+'" onclick="setCalendarMode(\'agenda\')">Agenda</button><button class="btn ghost" onclick="openTaskModal()">＋ Task</button></div>';
    if(calendarMode==="month")return toggle+calendarV7Base();
    return sectionTitle("Calendar Agenda","Upcoming tasks and goal deadlines with direct editing.")+toggle+agendaHtml();
  };

  function dataHealth(){
    const check=validateStateObject(state);
    const bytes=new Blob([JSON.stringify(state)]).size;
    return {issues:check.issues,sizeKB:Math.round(bytes/1024),hasBackup:!!localStorage.getItem(LAST_GOOD_KEY)};
  }
  window.repairCareerOSData=function(){
    state=repairStateObject(state);save();render();toast("Data structure repaired");
  };
  window.restoreLastGoodData=function(){
    const raw=localStorage.getItem(LAST_GOOD_KEY);if(!raw){toast("No recovery copy available");return}
    if(!confirm("Restore the last known-good local copy?"))return;
    try{state=repairStateObject(JSON.parse(raw));saveV7Base();render();toast("Recovery copy restored")}catch(e){toast("Recovery copy is invalid")}
  };
  window.exportRawData=function(){
    const raw=localStorage.getItem(STORAGE_KEY)||JSON.stringify(state);
    const blob=new Blob([raw],{type:"application/json"}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download="career-os-raw-recovery.json";a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},500);
  };

  function accessibilitySettings(){
    const h=dataHealth();
    return '<div class="grid grid-2" style="margin-top:18px"><div class="card"><div class="card-head"><div><p class="eyebrow">Accessibility</p><h3>Comfort & keyboard use</h3></div></div><div class="access-grid">'+
      accessOption("Reduced motion","Cuts animations and transitions.","reducedMotion")+
      accessOption("Larger text","Increases the interface base text size.","largeText")+
      accessOption("Higher contrast","Strengthens borders and secondary text.","highContrast")+
      '</div><div class="shortcut-grid" style="margin-top:14px">'+
      shortcut("Command palette","Ctrl / Cmd + K")+shortcut("Dashboard","Alt + D")+shortcut("Today","Alt + T")+shortcut("Goals","Alt + G")+shortcut("Reports","Alt + R")+shortcut("Shortcut help","?")+
      '</div></div><div class="card"><div class="card-head"><div><p class="eyebrow">Data Health</p><h3>Validation & recovery</h3></div><span class="'+(h.issues.length?"health-warn":"health-ok")+'">'+(h.issues.length?h.issues.length+" issue(s)":"Healthy")+'</span></div><div class="health-list"><div class="health-row"><span>Stored data size</span><b>'+h.sizeKB+' KB</b></div><div class="health-row"><span>Last-good recovery copy</span><b class="'+(h.hasBackup?"health-ok":"health-warn")+'">'+(h.hasBackup?"Available":"Not yet")+'</b></div><div class="health-row"><span>Schema</span><b>V'+V7_VERSION+'</b></div></div><div class="hero-actions"><button class="btn ghost" onclick="repairCareerOSData()">Repair structure</button><button class="btn ghost" onclick="restoreLastGoodData()">Restore last-good</button><button class="btn ghost" onclick="exportRawData()">Export raw data</button></div></div></div>';
  }
  function accessOption(title,desc,key){
    return '<div class="access-option"><label><span>'+esc(title)+'</span><input type="checkbox" '+(state.accessibility[key]?'checked':'')+' onchange="toggleAccessibility(\''+key+'\')"></label><p>'+esc(desc)+'</p></div>';
  }
  function shortcut(name,key){return '<div class="shortcut"><span>'+esc(name)+'</span><kbd>'+esc(key)+'</kbd></div>'}
  const settingsV7Base=settingsView;
  settingsView=function(){return settingsV7Base()+accessibilitySettings()};

  window.openShortcutHelp=function(){
    openModal("Keyboard shortcuts","Faster navigation",
      '<div class="shortcut-grid">'+shortcut("Dashboard","Alt + D")+shortcut("Today","Alt + T")+shortcut("Goals","Alt + G")+shortcut("Projects","Alt + P")+shortcut("Reports","Alt + R")+shortcut("Calendar","Alt + C")+shortcut("Command palette","Ctrl / Cmd + K")+shortcut("This help","?")+'</div>',
      function(){}
    );
    document.getElementById("modalSave").style.display="none";
    modal.addEventListener("close",function(){document.getElementById("modalSave").style.display=""},{once:true});
  };

  document.addEventListener("keydown",function(e){
    const tag=(e.target&&e.target.tagName||"").toLowerCase();
    if(["input","textarea","select"].includes(tag))return;
    if(e.key==="?"&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();openShortcutHelp();return}
    if(!e.altKey)return;
    const k=e.key.toLowerCase(),map={d:"dashboard",t:"today",g:"goals",p:"projects",r:"reports",c:"calendar"};
    if(map[k]){e.preventDefault();navTo(map[k])}
  });

  const commandItemsV7Base=commandItems;
  commandItems=function(){return commandItemsV7Base().concat([
    ["Customize dashboard","Show, hide and reorder dashboard widgets",function(){openWidgetManager()}],
    ["Calendar agenda","Open agenda view",function(){calendarMode="agenda";navTo("calendar")}],
    ["Accessibility","Open accessibility and recovery settings",function(){navTo("settings")}],
    ["Keyboard shortcuts","Show shortcut help",function(){openShortcutHelp()}]
  ])};

  const renderV7Base=render;
  render=function(){
    applyAccessibility();
    renderV7Base();
    applyAccessibility();
  };

  ensureV7State();
  applyAccessibility();
  storeLastGood();
  render();
})();