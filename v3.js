// Career & Success OS — Advanced V3 layer
(function(){
  function localDateKey(date){
    const d=date||new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }

  function ensureV3State(){
    state.theme=state.theme||"midnight";
    state.activityLog=Array.isArray(state.activityLog)?state.activityLog:[];
    state.dailyStats=state.dailyStats&&typeof state.dailyStats==="object"?state.dailyStats:{};
    state.goals=(state.goals||[]).map(function(g){return Object.assign({},g,{milestones:Array.isArray(g.milestones)?g.milestones:[]})});
    state.habits=(state.habits||[]).map(function(h){return Object.assign({},h,{history:Array.isArray(h.history)?h.history:[]})});
    state.unlockedBadges=Array.isArray(state.unlockedBadges)?state.unlockedBadges:[];
    save();
  }

  function applyTheme(){
    document.documentElement.dataset.theme=state.theme||"midnight";
  }

  function dayStats(key){
    const k=key||localDateKey();
    if(!state.dailyStats[k]) state.dailyStats[k]={tasks:0,habits:0,focus:0,xp:0,events:0};
    return state.dailyStats[k];
  }

  function recordActivity(type,title,xp){
    const now=new Date();
    state.activityLog.unshift({
      id:uid(),
      type:type,
      title:title,
      xp:Number(xp||0),
      date:localDateKey(now),
      time:now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})
    });
    state.activityLog=state.activityLog.slice(0,250);
    const ds=dayStats(localDateKey(now));
    ds.events=(ds.events||0)+1;
    ds.xp=(ds.xp||0)+Number(xp||0);
    if(type==="task") ds.tasks=(ds.tasks||0)+1;
    if(type==="habit") ds.habits=(ds.habits||0)+1;
    if(type==="focus") ds.focus=(ds.focus||0)+1;
    save();
  }

  function maybeRefreshV3(){
    if(["dashboard","analytics","activity","habits","goals","badges"].includes(currentView)) render();
  }

  function weeklyPerformanceScore(){
    const taskTotal=Math.max(1,state.tasks.length);
    const taskScore=state.tasks.filter(function(t){return t.done}).length/taskTotal*100;
    const habitTotal=Math.max(1,state.habits.length);
    const habitScore=state.habits.filter(function(h){return h.doneToday}).length/habitTotal*100;
    const goalScore=state.goals.length?state.goals.reduce(function(a,g){return a+Number(g.progress||0)},0)/state.goals.length:0;
    const focusScore=Math.min(100,(state.focus&&state.focus.totalMinutes||0)/180*100);
    return Math.round(taskScore*.32+habitScore*.25+goalScore*.25+focusScore*.18);
  }

  function heatLevel(stats){
    if(!stats) return 0;
    const value=(stats.tasks||0)*2+(stats.habits||0)+(stats.focus||0)*2+Math.min(4,Math.floor((stats.xp||0)/10));
    if(value<=0)return 0;
    if(value<=2)return 1;
    if(value<=5)return 2;
    if(value<=8)return 3;
    return 4;
  }

  function heatmapHtml(days){
    const count=days||84, cells=[];
    const today=new Date();
    for(let i=count-1;i>=0;i--){
      const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i);
      const k=localDateKey(d),s=state.dailyStats[k],level=heatLevel(s);
      const tip=k+" • "+((s&&s.events)||0)+" actions • "+((s&&s.xp)||0)+" XP";
      cells.push('<span class="heat-cell" data-l="'+level+'" data-tip="'+esc(tip)+'"></span>');
    }
    return '<div class="heatmap">'+cells.join("")+'</div>';
  }

  function recentActivityHtml(limit,filter){
    const list=(state.activityLog||[]).filter(function(x){return !filter||filter==="all"||x.type===filter}).slice(0,limit||8);
    if(!list.length) return empty("No activity recorded yet. The system is ready. Humanity must now provide the activity.");
    return '<div class="timeline">'+list.map(function(x){
      return '<div class="timeline-item"><span class="timeline-dot"></span><strong>'+esc(x.title)+'</strong><small>'+esc(x.type)+' • '+esc(x.date)+' '+esc(x.time)+(x.xp?' • +'+x.xp+' XP':'')+'</small></div>';
    }).join("")+'</div>';
  }

  let activityFilter="all";
  window.setActivityFilter=function(type){activityFilter=type;render()};

  window.activityView=function(){
    const types=["all","task","habit","focus","goal","project","skill","achievement"];
    return sectionTitle("Activity Log","A factual timeline of what actually moved forward.")+
      '<div class="activity-filters">'+types.map(function(t){return '<button class="btn '+(activityFilter===t?'primary':'ghost')+'" onclick="setActivityFilter(\''+t+'\')">'+t.charAt(0).toUpperCase()+t.slice(1)+'</button>'}).join("")+'</div>'+
      '<div class="card">'+recentActivityHtml(80,activityFilter)+'</div>';
  };

  function goalHealth(g){
    const d=daysFromToday(g.deadline);
    if(d===null)return {label:"No deadline",cls:""};
    if(g.progress>=100)return {label:"Completed",cls:"safe"};
    if(d<0)return {label:"Overdue",cls:"risk"};
    if(d<=14&&g.progress<70)return {label:"At risk • "+d+"d left",cls:"risk"};
    if(d<=30&&g.progress<45)return {label:"Needs attention • "+d+"d left",cls:"risk"};
    return {label:"On track • "+d+"d left",cls:"safe"};
  }

  function syncGoalFromMilestones(g){
    if(!g.milestones||!g.milestones.length)return;
    const done=g.milestones.filter(function(m){return m.done}).length;
    g.progress=Math.round(done/g.milestones.length*100);
  }

  window.openMilestoneModal=function(goalId){
    const g=state.goals.find(function(x){return x.id===goalId});
    if(!g)return;
    openModal("Add milestone","Break the goal into evidence",field("Milestone","title","text","","required"),function(fd){
      g.milestones.push({id:uid(),title:fd.get("title"),done:false});
      syncGoalFromMilestones(g);
      recordActivity("goal","Added milestone to "+g.title,0);
      save();render();toast("Milestone added");
    });
  };

  window.toggleMilestone=function(goalId,milestoneId){
    const g=state.goals.find(function(x){return x.id===goalId}); if(!g)return;
    const m=g.milestones.find(function(x){return x.id===milestoneId}); if(!m)return;
    const was=m.done;m.done=!m.done;
    syncGoalFromMilestones(g);
    if(!was&&m.done){state.xp+=7;recordActivity("goal","Milestone completed: "+m.title,7);toast("Milestone complete • +7 XP")}
    else save();
    render();
  };

  const goalsV2=goalsView;
  goalsView=function(){
    return sectionTitle("Career Goals","Big outcomes broken into measurable milestones.","＋ Add Goal","openGoalModal()")+
      '<div class="grid grid-3">'+(state.goals.map(function(g){
        const health=goalHealth(g);
        return '<div class="card"><div class="card-head"><h3>'+esc(g.title)+'</h3><span class="tag">'+g.progress+'%</span></div>'+
          '<p class="muted">Deadline: '+esc(g.deadline)+'</p>'+progress(g.progress)+
          '<div class="goal-health"><span>Goal health</span><b class="'+health.cls+'">'+esc(health.label)+'</b></div>'+
          '<div class="milestones">'+((g.milestones&&g.milestones.length)?g.milestones.map(function(m){
            return '<div class="milestone '+(m.done?'done':'')+'"><input type="checkbox" '+(m.done?'checked':'')+' onchange="toggleMilestone('+g.id+','+m.id+')"><span>'+esc(m.title)+'</span></div>';
          }).join(""):'<small class="muted">No milestones yet.</small>')+'</div>'+
          '<div class="hero-actions"><button class="btn ghost" onclick="openMilestoneModal('+g.id+')">＋ Milestone</button><button class="btn ghost" onclick="bumpGoal('+g.id+',10)">+10%</button><button class="btn ghost danger" onclick="removeItem(\'goals\','+g.id+')">Delete</button></div></div>';
      }).join("")||empty("No goals yet"))+'</div>';
  };

  const habitsV2=habitsView;
  habitsView=function(){
    const days=[];
    const now=new Date();
    for(let i=6;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i);days.push({k:localDateKey(d),label:d.toLocaleDateString("en-IN",{weekday:"short"}).slice(0,1)})}
    return sectionTitle("Habit Tracker","Consistency with visible seven-day history.","＋ Add Habit","openHabitModal()")+
      '<div class="grid grid-3">'+state.habits.map(function(h){
        return '<div class="card"><div class="split"><h3>'+esc(h.name)+'</h3><span class="tag">'+(h.doneToday?"Done today":"Pending")+'</span></div><div class="big-number" style="margin-top:14px">'+h.streak+'</div><span class="muted">day streak</span><div class="habit-grid" style="margin-top:16px">'+days.map(function(d){
          const done=(h.history||[]).includes(d.k)||(d.k===localDateKey()&&h.doneToday);
          return '<div><div class="habit-day '+(done?'done':'')+'" title="'+d.k+'"></div><small class="muted" style="display:block;text-align:center;margin-top:4px">'+d.label+'</small></div>';
        }).join("")+'</div><div class="hero-actions"><button class="btn '+(h.doneToday?'ghost':'primary')+'" onclick="toggleHabit('+h.id+')">'+(h.doneToday?'Undo today':'Complete today')+'</button></div></div>';
      }).join("")+'</div>';
  };

  const settingsV2=settingsView;
  settingsView=function(){
    return settingsV2()+
      '<div class="card" style="margin-top:18px"><div class="card-head"><div><p class="eyebrow">Appearance</p><h3>Theme customization</h3></div></div><div class="theme-grid">'+
      [["midnight","Midnight"],["light","Light"],["ocean","Ocean"],["graphite","Graphite"]].map(function(t){
        return '<button class="theme-option '+(state.theme===t[0]?'active':'')+'" onclick="setTheme(\''+t[0]+'\')"><div class="theme-swatch '+t[0]+'"></div><b>'+t[1]+'</b></button>';
      }).join("")+'</div></div>';
  };

  window.setTheme=function(theme){
    state.theme=theme;save();applyTheme();render();toast("Theme changed to "+theme);
  };

  function weeklyScoreCard(){
    const sc=weeklyPerformanceScore();
    const taskPct=Math.round(state.tasks.filter(function(t){return t.done}).length/Math.max(1,state.tasks.length)*100);
    const habitPct=Math.round(state.habits.filter(function(h){return h.doneToday}).length/Math.max(1,state.habits.length)*100);
    const goalPct=Math.round(state.goals.length?state.goals.reduce(function(a,g){return a+g.progress},0)/state.goals.length:0);
    const focusPct=Math.min(100,Math.round((state.focus&&state.focus.totalMinutes||0)/180*100));
    return '<div class="card"><div class="card-head"><div><p class="eyebrow">Weekly Performance</p><h3>Execution Score</h3></div><span class="tag">'+(sc>=75?'Strong':sc>=50?'Building':'Needs focus')+'</span></div><div class="week-score"><div class="score-orb" style="--p:'+sc+'%"><b>'+sc+'</b></div><div>'+
      [["Tasks",taskPct],["Habits",habitPct],["Goals",goalPct],["Focus",focusPct]].map(function(x){return '<div class="trend-row"><span>'+x[0]+'</span><div class="trend-track"><i style="width:'+x[1]+'%"></i></div><b>'+x[1]+'%</b></div>'}).join("")+
      '</div></div></div>';
  }

  const dashboardV2=dashboard;
  dashboard=function(){
    return dashboardV2()+
      '<div class="grid grid-2" style="margin-top:18px">'+weeklyScoreCard()+
      '<div class="card"><div class="card-head"><div><p class="eyebrow">84-Day Record</p><h3>Productivity Heatmap</h3></div><button class="btn ghost" onclick="navTo(\'activity\')">Activity log</button></div>'+heatmapHtml(84)+'</div></div>'+
      '<div class="card" style="margin-top:18px"><div class="card-head"><div><p class="eyebrow">Evidence Feed</p><h3>Recent progress</h3></div></div>'+recentActivityHtml(6,"all")+'</div>';
  };

  const analyticsV2=analyticsView;
  analyticsView=function(){
    const last7=[];
    const now=new Date();
    for(let i=6;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i),k=localDateKey(d),s=state.dailyStats[k]||{};last7.push({label:d.toLocaleDateString("en-IN",{weekday:"short"}),value:(s.events||0)*10+(s.xp||0)})}
    const max=Math.max(1,...last7.map(function(x){return x.value}));
    return analyticsV2()+
      '<div class="grid grid-2" style="margin-top:18px"><div class="card"><div class="card-head"><div><p class="eyebrow">Consistency</p><h3>84-day productivity heatmap</h3></div></div>'+heatmapHtml(84)+'</div>'+
      '<div class="card"><div class="card-head"><div><p class="eyebrow">Last 7 Days</p><h3>Activity intensity</h3></div></div><div class="chart-bars">'+last7.map(function(x){return '<i title="'+esc(x.label)+'" style="height:'+Math.max(6,Math.round(x.value/max*100))+'%"></i>'}).join("")+'</div><div class="split muted">'+last7.map(function(x){return '<small>'+esc(x.label.slice(0,1))+'</small>'}).join("")+'</div></div></div>';
  };

  const oldToggleTask=toggleTask;
  toggleTask=function(id){
    const before=state.tasks.find(function(x){return x.id===id});const was=before&&before.done;
    oldToggleTask(id);
    const after=state.tasks.find(function(x){return x.id===id});
    if(after&&!was&&after.done){recordActivity("task","Completed task: "+after.title,10);maybeRefreshV3()}
  };

  const oldToggleHabit=toggleHabit;
  toggleHabit=function(id){
    const h0=state.habits.find(function(x){return x.id===id});const was=h0&&h0.doneToday;
    oldToggleHabit(id);
    const h=state.habits.find(function(x){return x.id===id});if(!h)return;
    const today=localDateKey();
    if(!was&&h.doneToday){
      if(!h.history.includes(today))h.history.push(today);
      recordActivity("habit","Completed habit: "+h.name,8);
    } else if(was&&!h.doneToday){
      h.history=h.history.filter(function(k){return k!==today});save();
    }
    maybeRefreshV3();
  };

  const oldBumpGoal=bumpGoal;
  bumpGoal=function(id,n){
    oldBumpGoal(id,n);
    const g=state.goals.find(function(x){return x.id===id});
    if(g){recordActivity("goal","Goal progress: "+g.title+" → "+g.progress+"%",5);maybeRefreshV3()}
  };

  const oldBumpSkill=bumpSkill;
  bumpSkill=function(id,n){
    oldBumpSkill(id,n);
    const s=state.skills.find(function(x){return x.id===id});
    if(s){recordActivity("skill","Skill improved: "+s.name+" → "+s.level+"%",3);maybeRefreshV3()}
  };

  const oldBumpProject=bumpProject;
  bumpProject=function(id,n){
    oldBumpProject(id,n);
    const p=state.projects.find(function(x){return x.id===id});
    if(p){recordActivity("project","Project progress: "+p.name+" → "+p.progress+"%",6);maybeRefreshV3()}
  };

  openAchievementModal=function(){
    openModal("New achievement","Milestone",field("Title","title","text","","required")+field("Detail","detail","text")+field("Date","date","date"),function(fd){
      const title=fd.get("title");
      state.achievements.unshift({id:uid(),title:title,detail:fd.get("detail"),date:fd.get("date")||localDateKey()});
      state.xp+=20;recordActivity("achievement","Achievement unlocked: "+title,20);save();render();toast("Achievement saved • +20 XP");
    });
  };

  startFocus=function(){
    if(focusRunning)return;
    focusRunning=true;refreshFocusDom();
    focusInterval=setInterval(function(){
      focusSeconds--;refreshFocusDom();
      if(focusSeconds<=0){
        clearInterval(focusInterval);focusInterval=null;focusRunning=false;
        state.focus.sessions=(state.focus.sessions||0)+1;
        state.focus.totalMinutes=(state.focus.totalMinutes||0)+focusPreset;
        state.focus.lastCompleted=new Date().toISOString();
        state.xp+=15;
        recordActivity("focus","Completed "+focusPreset+" minute focus session",15);
        focusSeconds=focusPreset*60;save();render();toast("Focus session complete • +15 XP");
      }
    },1000);
  };

  function syncBadgeState(){
    if(typeof badgeDefs==="undefined")return;
    badgeDefs.forEach(function(b,index){
      const key=b.title;
      if(b.ok()&&!state.unlockedBadges.includes(key)){
        state.unlockedBadges.push(key);
        recordActivity("achievement","Badge unlocked: "+key,0);
      }
    });
  }

  const renderV2=render;
  render=function(){
    applyTheme();
    syncBadgeState();
    const titles={dashboard:"Command Center",today:"Today",goals:"Career Goals",skills:"Skills",projects:"Project Launchpad",learning:"Learning Roadmap",study:"Study",internships:"Internships",clients:"Client CRM",content:"Creator Tracker",linkedin:"LinkedIn Growth",habits:"Habits",achievements:"Achievements",activity:"Activity Log",analytics:"Analytics",calendar:"Calendar",focus:"Focus Mode",badges:"Badges",reviews:"Reviews",settings:"Settings"};
    document.getElementById("viewTitle").textContent=titles[currentView]||"Career & Success OS";
    document.getElementById("profileName").textContent=state.profile.name.split(" ")[0];
    document.getElementById("profileInitials").textContent=state.profile.name.split(" ").map(function(x){return x[0]}).join("").slice(0,2).toUpperCase();
    const map={dashboard:dashboard,today:todayView,goals:goalsView,skills:skillsView,projects:projectsView,learning:learningView,study:studyView,internships:internshipsView,clients:clientsView,content:contentView,linkedin:linkedinView,habits:habitsView,achievements:achievementsView,activity:activityView,analytics:analyticsView,calendar:calendarView,focus:focusView,badges:badgesView,reviews:reviewsView,settings:settingsView};
    document.getElementById("viewRoot").innerHTML=(map[currentView]||dashboard)();
    updateLevelUI();updateAdvancedHeader();
  };

  ensureV3State();
  applyTheme();
  syncBadgeState();
  render();
})();