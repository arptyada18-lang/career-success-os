// Career & Success OS — Advanced V6 reports & intelligence
(function(){
  const V6_VERSION=6;

  function dkey(d){
    const x=d||new Date();
    return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
  }
  function parseDay(s){const d=new Date(s+"T00:00:00");return Number.isNaN(d.getTime())?null:d}
  function dayDiff(a,b){
    const da=parseDay(a),db=parseDay(b);if(!da||!db)return 0;
    return Math.round((db-da)/86400000);
  }
  function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}
  function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
  function escCsv(v){
    const s=String(v==null?"":v);
    return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }
  function downloadText(name,text,type){
    const blob=new Blob([text],{type:type||"text/plain;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }

  function ensureV6State(){
    state.schemaVersion=V6_VERSION;
    state.skillHistory=state.skillHistory&&typeof state.skillHistory==="object"?state.skillHistory:{};
    state.goalHistory=state.goalHistory&&typeof state.goalHistory==="object"?state.goalHistory:{};
    snapshotTrends();
    save();
  }
  function upsertDaily(arr,obj){
    const i=arr.findIndex(function(x){return x.date===obj.date});
    if(i>=0)arr[i]=obj;else arr.push(obj);
    arr.sort(function(a,b){return a.date.localeCompare(b.date)});
    if(arr.length>180)arr.splice(0,arr.length-180);
  }
  function snapshotTrends(){
    const today=dkey();
    (state.skills||[]).forEach(function(s){
      const k=String(s.id);state.skillHistory[k]=Array.isArray(state.skillHistory[k])?state.skillHistory[k]:[];
      upsertDaily(state.skillHistory[k],{date:today,name:s.name,level:Number(s.level||0)});
    });
    (state.goals||[]).forEach(function(g){
      const k=String(g.id);state.goalHistory[k]=Array.isArray(state.goalHistory[k])?state.goalHistory[k]:[];
      upsertDaily(state.goalHistory[k],{date:today,title:g.title,progress:Number(g.progress||0)});
    });
  }

  function inRange(date,start,end){return date>=start&&date<=end}
  function rangeFor(kind){
    const now=new Date();
    if(kind==="month"){
      const start=new Date(now.getFullYear(),now.getMonth(),1);
      return {start:dkey(start),end:dkey(now),label:now.toLocaleDateString("en-IN",{month:"long",year:"numeric"})};
    }
    const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6);
    return {start:dkey(start),end:dkey(now),label:"Last 7 days"};
  }
  function reportStats(kind){
    const r=rangeFor(kind);
    const acts=(state.activityLog||[]).filter(function(a){return inRange(a.date,r.start,r.end)});
    const taskActs=acts.filter(function(a){return a.type==="task"});
    const focusActs=acts.filter(function(a){return a.type==="focus"});
    const goalActs=acts.filter(function(a){return a.type==="goal"});
    const achievements=acts.filter(function(a){return a.type==="achievement"});
    const xp=acts.reduce(function(s,a){return s+Number(a.xp||0)},0);
    return {range:r,activities:acts.length,tasks:taskActs.length,focus:focusActs.length,goals:goalActs.length,achievements:achievements.length,xp:xp};
  }

  function goalForecast(g){
    const history=(state.goalHistory[String(g.id)]||[]).slice().sort(function(a,b){return a.date.localeCompare(b.date)});
    const latest=history[history.length-1]||{date:dkey(),progress:Number(g.progress||0)};
    let rate=0;
    if(history.length>=2){
      const first=history[0],days=Math.max(1,dayDiff(first.date,latest.date));
      rate=Math.max(0,(Number(latest.progress)-Number(first.progress))/days);
    }
    const remaining=Math.max(0,100-Number(g.progress||0));
    const left=daysFromToday(g.deadline);
    const required=left!==null&&left>0?remaining/left:null;
    let projected=null;
    if(remaining===0)projected=dkey();
    else if(rate>0)projected=dkey(addDays(new Date(),Math.ceil(remaining/rate)));
    let risk="medium",reason="Building baseline";
    if(remaining===0){risk="low";reason="Completed"}
    else if(left!==null&&left<0){risk="high";reason="Deadline passed"}
    else if(left!==null&&left<=7&&remaining>20){risk="high";reason="Little time remaining"}
    else if(required!==null&&rate>0&&rate>=required){risk="low";reason="Recent pace meets deadline"}
    else if(required!==null&&rate>0&&rate<required*.6){risk="high";reason="Recent pace below needed pace"}
    else if(left!==null&&left>30&&Number(g.progress||0)>=40){risk="low";reason="Healthy time buffer"}
    return {risk:risk,reason:reason,daysLeft:left,required:required,rate:rate,projected:projected};
  }

  function activityScore(stats){
    if(!stats)return 0;
    return (stats.events||0)*5+(stats.tasks||0)*8+(stats.habits||0)*5+(stats.focus||0)*10+(stats.xp||0);
  }
  function bestDayInsight(){
    const entries=Object.entries(state.dailyStats||{}).map(function(pair){return {date:pair[0],stats:pair[1],score:activityScore(pair[1])}}).sort(function(a,b){return b.score-a.score});
    if(!entries.length||entries[0].score===0)return {date:"Not enough data",score:0,label:"Use the OS for a few days"};
    const best=entries[0],d=parseDay(best.date);
    return {date:best.date,score:best.score,label:d?d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"}):best.date};
  }
  function bestWeekdayInsight(){
    const buckets={};
    Object.entries(state.dailyStats||{}).forEach(function(pair){
      const d=parseDay(pair[0]);if(!d)return;
      const name=d.toLocaleDateString("en-IN",{weekday:"long"});
      buckets[name]=buckets[name]||{score:0,n:0};buckets[name].score+=activityScore(pair[1]);buckets[name].n++;
    });
    const rows=Object.entries(buckets).map(function(x){return {day:x[0],avg:x[1].score/Math.max(1,x[1].n)}}).sort(function(a,b){return b.avg-a.avg});
    return rows[0]||{day:"Not enough data",avg:0};
  }
  function weakAreaInsight(){
    const by={};
    (state.tasks||[]).forEach(function(t){by[t.category]=by[t.category]||{total:0,done:0};by[t.category].total++;if(t.done)by[t.category].done++});
    const rows=Object.entries(by).filter(function(x){return x[1].total>=1}).map(function(x){return {category:x[0],rate:x[1].done/x[1].total,total:x[1].total}}).sort(function(a,b){return a.rate-b.rate||b.total-a.total});
    if(!rows.length)return {category:"Not enough data",rate:0,total:0};
    return rows[0];
  }
  function pipelineInsight(){
    const apps=state.internships||[];
    const interviews=apps.filter(function(x){return x.status==="Interview"||x.status==="Offer"}).length;
    const clients=state.clients||[];
    const wins=clients.filter(function(x){return x.status==="Won"}).length;
    return {applicationRate:apps.length?Math.round(interviews/apps.length*100):0,clientRate:clients.length?Math.round(wins/clients.length*100):0};
  }

  window.exportActivitiesCsv=function(){
    const rows=[["Date","Time","Type","Activity","XP"]].concat((state.activityLog||[]).map(function(a){return [a.date,a.time,a.type,a.title,a.xp||0]}));
    downloadText("career-os-activities.csv",rows.map(function(r){return r.map(escCsv).join(",")}).join("\n"),"text/csv;charset=utf-8");
    toast("Activities CSV exported");
  };
  window.exportGoalsCsv=function(){
    const rows=[["Goal","Progress","Deadline","Risk","Days Left","Required Pace %/day","Recent Pace %/day","Projected Finish"]];
    (state.goals||[]).forEach(function(g){const f=goalForecast(g);rows.push([g.title,g.progress,g.deadline,f.risk,f.daysLeft==null?"":f.daysLeft,f.required==null?"":f.required.toFixed(2),f.rate.toFixed(2),f.projected||""])});
    downloadText("career-os-goals.csv",rows.map(function(r){return r.map(escCsv).join(",")}).join("\n"),"text/csv;charset=utf-8");
    toast("Goals CSV exported");
  };
  window.exportPipelineCsv=function(){
    const rows=[["Type","Name / Company","Role / Service","Status","Value / Date"]];
    (state.projects||[]).forEach(function(x){rows.push(["Project",x.name,"",x.status,x.progress+"%"])});
    (state.internships||[]).forEach(function(x){rows.push(["Internship",x.company,x.role,x.status,x.date||""])});
    (state.clients||[]).forEach(function(x){rows.push(["Client",x.company,x.role,x.status,x.value||0])});
    downloadText("career-os-pipeline.csv",rows.map(function(r){return r.map(escCsv).join(",")}).join("\n"),"text/csv;charset=utf-8");
    toast("Pipeline CSV exported");
  };

  function reportHtml(kind){
    const s=reportStats(kind),best=bestDayInsight(),weak=weakAreaInsight(),pipe=pipelineInsight();
    const goals=(state.goals||[]).map(function(g){const f=goalForecast(g);return '<tr><td>'+esc(g.title)+'</td><td>'+g.progress+'%</td><td>'+esc(g.deadline)+'</td><td>'+esc(f.risk.toUpperCase())+'</td><td>'+(f.required==null?'—':f.required.toFixed(2)+'%/day')+'</td></tr>'}).join("");
    const topActivities=(state.activityLog||[]).filter(function(a){return inRange(a.date,s.range.start,s.range.end)}).slice(0,12).map(function(a){return '<li><b>'+esc(a.title)+'</b> <span>'+esc(a.date)+' • '+esc(a.type)+'</span></li>'}).join("");
    return '<!doctype html><html><head><meta charset="utf-8"><title>Career OS '+(kind==="month"?"Monthly":"Weekly")+' Report</title><style>body{font-family:Arial,sans-serif;color:#182033;max-width:980px;margin:40px auto;padding:0 24px}h1{margin-bottom:4px}.muted{color:#667085}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:24px 0}.k{border:1px solid #e5e7eb;border-radius:12px;padding:14px}.k b{display:block;font-size:24px}.k span{font-size:12px;color:#667085}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{text-align:left;padding:9px;border-bottom:1px solid #e5e7eb;font-size:12px}h2{margin-top:28px}li{margin:8px 0}li span{color:#667085;font-size:12px}@media print{body{margin:0;max-width:none}}</style></head><body>'+
      '<h1>Career & Success OS</h1><div class="muted">'+(kind==="month"?"Monthly":"Weekly")+' Performance Report • '+esc(s.range.label)+'</div>'+
      '<div class="grid"><div class="k"><b>'+s.activities+'</b><span>Activities</span></div><div class="k"><b>'+s.tasks+'</b><span>Tasks completed</span></div><div class="k"><b>'+s.focus+'</b><span>Focus sessions</span></div><div class="k"><b>'+s.xp+'</b><span>XP earned</span></div></div>'+
      '<h2>Performance insights</h2><p><b>Best day:</b> '+esc(best.label)+'</p><p><b>Weakest tracked task area:</b> '+esc(weak.category)+' ('+Math.round(weak.rate*100)+'% completion)</p><p><b>Application interview/offer signal:</b> '+pipe.applicationRate+'%</p><p><b>Client win rate:</b> '+pipe.clientRate+'%</p>'+
      '<h2>Goal forecast</h2><table><thead><tr><th>Goal</th><th>Progress</th><th>Deadline</th><th>Risk</th><th>Required pace</th></tr></thead><tbody>'+goals+'</tbody></table>'+
      '<h2>Recent evidence</h2><ul>'+topActivities+'</ul>'+
      '<script>window.onload=function(){window.print()}<\/script></body></html>';
  }
  window.printCareerReport=function(kind){
    const w=window.open("","_blank");if(!w){toast("Browser blocked the report window");return}
    w.document.open();w.document.write(reportHtml(kind));w.document.close();
  };

  function skillHistoryHtml(){
    if(!(state.skills||[]).length)return empty("No skills tracked");
    return '<div class="skill-history">'+state.skills.map(function(s){
      const h=(state.skillHistory[String(s.id)]||[]).slice(-14);
      const levels=h.map(function(x){return Number(x.level||0)}),first=levels.length?levels[0]:s.level,last=levels.length?levels[levels.length-1]:s.level,delta=last-first;
      return '<div class="skill-history-row"><strong>'+esc(s.name)+'</strong><div class="skill-spark">'+(levels.length?levels.map(function(v){return '<i style="height:'+Math.max(5,v)+'%" title="'+v+'%"></i>'}).join(""):'<i style="height:'+Math.max(5,s.level)+'%"></i>')+'</div><div class="skill-delta '+(delta>0?'up':'flat')+'">'+(delta>0?'+':'')+delta+'%</div></div>';
    }).join("")+'</div>';
  }
  function goalForecastHtml(){
    if(!(state.goals||[]).length)return empty("No goals tracked");
    return '<div class="forecast-list">'+state.goals.map(function(g){
      const f=goalForecast(g);
      return '<div class="forecast-item"><div class="forecast-head"><div><h4>'+esc(g.title)+'</h4><small>'+esc(f.reason)+'</small></div><span class="forecast-risk '+f.risk+'">'+f.risk.toUpperCase()+'</span></div><div class="forecast-meta"><div><b>'+g.progress+'%</b><span>Current progress</span></div><div><b>'+(f.required==null?'—':f.required.toFixed(2)+'%')+'</b><span>Needed per day</span></div><div><b>'+(f.projected||'Learning pace')+'</b><span>Projected finish</span></div></div></div>';
    }).join("")+'</div>';
  }

  window.reportsView=function(){
    snapshotTrends();
    const week=reportStats("week"),month=reportStats("month"),best=bestDayInsight(),weekday=bestWeekdayInsight(),weak=weakAreaInsight(),pipe=pipelineInsight();
    return sectionTitle("Reports & Intelligence","Export your evidence, review trends and watch deadline risk.")+
      '<div class="report-hero"><div class="card report-card"><div class="card-head"><div><p class="eyebrow">Performance Reports</p><h3>Weekly & monthly evidence</h3></div><span class="system-badge"><i class="system-dot"></i>Local analytics</span></div><div class="grid grid-4">'+
      stat("7-day activity",week.activities,"Recorded actions")+stat("7-day XP",week.xp,"Execution points")+stat("Month activity",month.activities,"Current month")+stat("Month XP",month.xp,"Current month")+
      '</div><div class="report-actions"><button class="btn primary" onclick="printCareerReport(\'week\')">Print Weekly Report</button><button class="btn ghost" onclick="printCareerReport(\'month\')">Print Monthly Report</button></div></div>'+
      '<div class="card"><div class="card-head"><div><p class="eyebrow">Productivity Intelligence</p><h3>What the data says</h3></div></div><div class="insight-stack"><div class="insight-line"><span>Best recorded day</span><b>'+esc(best.label)+'</b></div><div class="insight-line"><span>Strongest weekday</span><b>'+esc(weekday.day)+'</b></div><div class="insight-line"><span>Weakest task category</span><b>'+esc(weak.category)+' • '+Math.round(weak.rate*100)+'%</b></div><div class="insight-line"><span>Internship signal</span><b>'+pipe.applicationRate+'%</b></div><div class="insight-line"><span>Client win rate</span><b>'+pipe.clientRate+'%</b></div></div></div></div>'+
      '<div class="grid grid-2"><div class="card"><div class="card-head"><div><p class="eyebrow">Goal Forecast</p><h3>Deadline pace</h3></div></div>'+goalForecastHtml()+'</div><div class="card"><div class="card-head"><div><p class="eyebrow">Skill Trends</p><h3>Growth history</h3></div></div>'+skillHistoryHtml()+'<div class="report-note" style="margin-top:16px">Trend history starts when V6 begins recording snapshots. Earlier progress is not fabricated.</div></div></div>'+
      '<div class="card" style="margin-top:18px"><div class="card-head"><div><p class="eyebrow">Data Export</p><h3>Download CSV files</h3></div></div><div class="csv-grid"><div class="csv-card"><strong>Activity history</strong><small>Dates, actions, types and XP.</small><button class="btn ghost" onclick="exportActivitiesCsv()">Download CSV</button></div><div class="csv-card"><strong>Goals & forecasts</strong><small>Progress, risk, pace and projection.</small><button class="btn ghost" onclick="exportGoalsCsv()">Download CSV</button></div><div class="csv-card"><strong>Career pipelines</strong><small>Projects, internships and clients.</small><button class="btn ghost" onclick="exportPipelineCsv()">Download CSV</button></div></div></div>';
  };

  const bumpSkillV6Base=bumpSkill;
  bumpSkill=function(id,n){bumpSkillV6Base(id,n);snapshotTrends();save()};
  const renderV6Base=render;
  render=function(){
    snapshotTrends();
    if(currentView==="reports"){
      document.getElementById("viewTitle").textContent="Reports & Intelligence";
      document.getElementById("profileName").textContent=state.profile.name.split(" ")[0];
      document.getElementById("profileInitials").textContent=state.profile.name.split(" ").map(function(x){return x[0]}).join("").slice(0,2).toUpperCase();
      document.getElementById("viewRoot").innerHTML=reportsView();
      document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view==="reports")});
      updateLevelUI();updateAdvancedHeader();return;
    }
    renderV6Base();
  };

  const commandItemsV6Base=commandItems;
  commandItems=function(){return commandItemsV6Base().concat([
    ["Reports","Open reports and intelligence",function(){navTo("reports")}],
    ["Weekly report","Print the last 7 days report",function(){printCareerReport("week")}],
    ["Monthly report","Print the current month report",function(){printCareerReport("month")}],
    ["Export activities CSV","Download activity history",function(){exportActivitiesCsv()}]
  ])};

  ensureV6State();
  render();
})();