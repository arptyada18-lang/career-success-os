// Career & Success OS — Advanced V5 management layer
(function(){
  const projectStatuses=["Idea","Planning","Building","Live","Complete"];
  const internshipStatuses=["Applied","Follow-up","Interview","Offer","Rejected"];
  const clientStatuses=["Lead","Contacted","Replied","Proposal","Won","Lost"];
  let boardType="projects";

  function v5NowKey(){
    const d=new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  function v5Log(type,title){
    state.activityLog=Array.isArray(state.activityLog)?state.activityLog:[];
    const now=new Date();
    state.activityLog.unshift({id:uid(),type:type,title:title,xp:0,date:v5NowKey(),time:now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})});
    state.activityLog=state.activityLog.slice(0,250);
    state.dailyStats=state.dailyStats&&typeof state.dailyStats==="object"?state.dailyStats:{};
    if(!state.dailyStats[v5NowKey()])state.dailyStats[v5NowKey()]={tasks:0,habits:0,focus:0,xp:0,events:0};
    state.dailyStats[v5NowKey()].events=(state.dailyStats[v5NowKey()].events||0)+1;
  }
  function v5Save(msg){
    save();
    if(msg)toast(msg);
  }
  function v5Select(label,name,opts,current){
    return '<div class="field"><label>'+esc(label)+'</label><select name="'+esc(name)+'">'+opts.map(function(x){return '<option '+(x===current?'selected':'')+'>'+esc(x)+'</option>'}).join("")+'</select></div>';
  }
  function v5ActionButtons(editCall,deleteCall){
    return '<div class="data-row-actions"><button class="btn ghost" onclick="'+editCall+'">Edit</button><button class="btn ghost danger" onclick="'+deleteCall+'">Delete</button></div>';
  }
  function deleteRecord(key,id,label){
    state[key]=(state[key]||[]).filter(function(x){return x.id!==id});
    v5Log(key.slice(0,-1)||key,"Deleted "+label);
    v5Save("Deleted");
    render();
  }
  window.v5Delete=function(key,id,label){deleteRecord(key,id,label)};

  window.editGoalModal=function(id){
    const g=state.goals.find(function(x){return x.id===id});if(!g)return;
    openModal("Edit goal","Direction",
      field("Goal","title","text",g.title,"required")+
      field("Deadline","deadline","date",/^\d{4}-\d{2}-\d{2}$/.test(g.deadline||"")?g.deadline:"")+
      field("Progress %","progress","number",String(g.progress||0),'min="0" max="100"'),
      function(fd){
        g.title=fd.get("title");g.deadline=fd.get("deadline")||"No deadline";g.progress=Math.min(100,Math.max(0,+fd.get("progress")||0));
        v5Log("goal","Edited goal: "+g.title);v5Save("Goal updated");render();
      }
    );
  };
  window.editSkillModal=function(id){
    const s=state.skills.find(function(x){return x.id===id});if(!s)return;
    openModal("Edit skill","Capability",
      field("Skill name","name","text",s.name,"required")+field("Level %","level","number",String(s.level||0),'min="0" max="100"'),
      function(fd){s.name=fd.get("name");s.level=Math.min(100,Math.max(0,+fd.get("level")||0));v5Log("skill","Edited skill: "+s.name);v5Save("Skill updated");render()}
    );
  };
  window.editProjectModal=function(id){
    const p=state.projects.find(function(x){return x.id===id});if(!p)return;
    openModal("Edit project","Proof of work",
      field("Project name","name","text",p.name,"required")+
      v5Select("Status","status",projectStatuses,p.status)+
      field("Progress %","progress","number",String(p.progress||0),'min="0" max="100"')+
      field("Live / GitHub link","link","url",p.link||""),
      function(fd){
        p.name=fd.get("name");p.status=fd.get("status");p.progress=Math.min(100,Math.max(0,+fd.get("progress")||0));p.link=fd.get("link")||"";
        if(p.status==="Complete")p.progress=100;
        v5Log("project","Edited project: "+p.name);v5Save("Project updated");render();
      }
    );
  };
  window.editInternshipModal=function(id){
    const x=state.internships.find(function(i){return i.id===id});if(!x)return;
    openModal("Edit application","Career pipeline",
      field("Company","company","text",x.company,"required")+field("Role","role","text",x.role,"required")+
      v5Select("Status","status",internshipStatuses,x.status)+field("Applied date","date","date",x.date||""),
      function(fd){x.company=fd.get("company");x.role=fd.get("role");x.status=fd.get("status");x.date=fd.get("date")||x.date;v5Log("internship","Edited application: "+x.company+" • "+x.role);v5Save("Application updated");render()}
    );
  };
  window.editClientModal=function(id){
    const x=state.clients.find(function(i){return i.id===id});if(!x)return;
    openModal("Edit client lead","Freelance pipeline",
      field("Client / Company","company","text",x.company,"required")+field("Service","role","text",x.role,"required")+
      v5Select("Stage","status",clientStatuses,x.status)+field("Estimated value ₹","value","number",String(x.value||0),'min="0"'),
      function(fd){x.company=fd.get("company");x.role=fd.get("role");x.status=fd.get("status");x.value=Math.max(0,+fd.get("value")||0);v5Log("client","Edited client: "+x.company);v5Save("Client updated");render()}
    );
  };
  window.editContentModal=function(id){
    const x=state.content.find(function(i){return i.id===id});if(!x)return;
    openModal("Edit content","Creator tracker",
      field("Title","title","text",x.title,"required")+v5Select("Platform","platform",["YouTube","Instagram","LinkedIn","Other"],x.platform)+
      v5Select("Status","status",["Idea","Script","Editing","Ready","Posted"],x.status)+field("Views","views","number",String(x.views||0),'min="0"'),
      function(fd){x.title=fd.get("title");x.platform=fd.get("platform");x.status=fd.get("status");x.views=Math.max(0,+fd.get("views")||0);v5Log("content","Edited content: "+x.title);v5Save("Content updated");render()}
    );
  };
  window.editLinkedinModal=function(id){
    const x=state.linkedin.find(function(i){return i.id===id});if(!x)return;
    openModal("Edit LinkedIn activity","Growth tracker",
      field("Activity","title","text",x.title,"required")+v5Select("Type","type",["Post","Networking","Application","Profile"],x.type)+
      v5Select("Status","status",["Planned","Done"],x.status)+field("Date","date","date",x.date||""),
      function(fd){x.title=fd.get("title");x.type=fd.get("type");x.status=fd.get("status");x.date=fd.get("date")||x.date;v5Log("linkedin","Edited LinkedIn activity: "+x.title);v5Save("LinkedIn activity updated");render()}
    );
  };
  window.editProgressModal=function(key,id){
    const x=(state[key]||[]).find(function(i){return i.id===id});if(!x)return;
    openModal("Edit item","Progress tracker",
      field("Title","title","text",x.title,"required")+field("Progress %","progress","number",String(x.progress||0),'min="0" max="100"'),
      function(fd){x.title=fd.get("title");x.progress=Math.min(100,Math.max(0,+fd.get("progress")||0));v5Log(key,"Edited "+key+" item: "+x.title);v5Save("Progress item updated");render()}
    );
  };

  goalsView=function(){
    return sectionTitle("Career Goals","Outcomes, milestones, deadlines and health.","＋ Add Goal","openGoalModal()")+
      '<div class="grid grid-3">'+(state.goals.map(function(g){
        const d=daysFromToday(g.deadline),health=g.progress>=100?"Completed":d!==null&&d<0?"Overdue":d!==null&&d<=14&&g.progress<70?"At risk":"On track";
        return '<div class="card manage-card"><div class="card-head"><h3>'+esc(g.title)+'</h3><span class="tag">'+g.progress+'%</span></div><p class="muted">Deadline: '+esc(g.deadline)+'</p>'+progress(g.progress)+
          '<div class="goal-health"><span>Health</span><b class="'+(health==="Overdue"||health==="At risk"?"risk":"safe")+'">'+health+'</b></div>'+
          '<div class="milestones">'+((g.milestones&&g.milestones.length)?g.milestones.map(function(m){return '<div class="milestone '+(m.done?'done':'')+'"><input type="checkbox" '+(m.done?'checked':'')+' onchange="toggleMilestone('+g.id+','+m.id+')"><span>'+esc(m.title)+'</span></div>'}).join(""):'<small class="muted">No milestones yet.</small>')+'</div>'+
          '<div class="manage-actions"><button class="btn ghost" onclick="editGoalModal('+g.id+')">Edit</button><button class="btn ghost" onclick="openMilestoneModal('+g.id+')">＋ Milestone</button><button class="btn ghost danger" onclick="v5Delete(\'goals\','+g.id+',\''+esc(g.title).replace(/'/g,"&#39;")+'\')">Delete</button></div></div>';
      }).join("")||empty("No goals yet"))+'</div>';
  };

  skillsView=function(){
    return sectionTitle("Skills","Track and edit the capabilities that raise your value.","＋ Add Skill","openSkillModal()")+
      '<div class="grid grid-3">'+state.skills.map(function(s){return '<div class="card skill-card"><div class="skill-meta"><h3>'+esc(s.name)+'</h3><span class="tag">'+s.level+'%</span></div><div class="metric-bar"><i style="width:'+s.level+'%"></i></div><div class="split"><span class="kpi">Current proficiency</span><div class="data-row-actions"><button class="btn ghost" onclick="editSkillModal('+s.id+')">Edit</button><button class="btn ghost" onclick="bumpSkill('+s.id+',5)">+5</button><button class="btn ghost danger" onclick="v5Delete(\'skills\','+s.id+',\'skill\')">Delete</button></div></div></div>'}).join("")+'</div>';
  };

  projectsView=function(){
    return sectionTitle("Project Launchpad","Manage proof of work from idea to shipped.","＋ Add Project","openProjectModal()")+
      '<div class="edit-summary"><div class="mini-box"><strong>'+state.projects.length+'</strong><span>Total projects</span></div><div class="mini-box"><strong>'+state.projects.filter(function(p){return p.status==="Building"}).length+'</strong><span>Building</span></div><div class="mini-box"><strong>'+state.projects.filter(function(p){return p.status==="Live"||p.status==="Complete"}).length+'</strong><span>Live / complete</span></div></div>'+
      '<div class="grid grid-3">'+(state.projects.map(function(p){return '<div class="card manage-card"><div class="card-head"><h3>'+esc(p.name)+'</h3>'+tag(p.status)+'</div><div>'+progress(p.progress)+'</div><div class="split"><span class="muted">'+p.progress+'% complete</span>'+(p.link?'<a href="'+esc(p.link)+'" target="_blank" rel="noopener">Open ↗</a>':'')+'</div><div class="manage-actions"><button class="btn ghost" onclick="editProjectModal('+p.id+')">Edit</button><button class="btn ghost" onclick="bumpProject('+p.id+',10)">+10%</button><button class="btn ghost" onclick="navTo(\'boards\')">Board</button><button class="btn ghost danger" onclick="v5Delete(\'projects\','+p.id+',\'project\')">Delete</button></div></div>'}).join("")||empty("No projects yet"))+'</div>';
  };

  internshipsView=function(){
    return sectionTitle("Internship Tracker","Track every application, follow-up and interview.","＋ Add Application","openPipelineModal('internships')")+
      table(["Company","Role","Status","Applied","Actions"],state.internships.map(function(x){return [esc(x.company),esc(x.role),tag(x.status),esc(x.date),v5ActionButtons("editInternshipModal("+x.id+")","v5Delete('internships',"+x.id+",'application')")]}));
  };
  clientsView=function(){
    return sectionTitle("Client CRM","Manage leads from first contact to won work.","＋ Add Lead","openPipelineModal('clients')")+
      table(["Client","Service","Stage","Value","Actions"],state.clients.map(function(x){return [esc(x.company),esc(x.role),tag(x.status),"₹"+esc(x.value||0),v5ActionButtons("editClientModal("+x.id+")","v5Delete('clients',"+x.id+",'client')")]}));
  };
  contentView=function(){
    return sectionTitle("Content Creator Tracker","Edit ideas, production status and performance.","＋ Add Content","openContentModal()")+
      table(["Title","Platform","Status","Views","Actions"],state.content.map(function(x){return [esc(x.title),esc(x.platform),tag(x.status),esc(x.views||0),v5ActionButtons("editContentModal("+x.id+")","v5Delete('content',"+x.id+",'content')")]}));
  };
  linkedinView=function(){
    return sectionTitle("LinkedIn Growth","Manage posts, networking and profile work.","＋ Add Activity","openLinkedinModal()")+
      table(["Activity","Type","Status","Date","Actions"],state.linkedin.map(function(x){return [esc(x.title),esc(x.type),tag(x.status),esc(x.date),v5ActionButtons("editLinkedinModal("+x.id+")","v5Delete('linkedin',"+x.id+",'activity')")]}));
  };
  genericProgress=function(title,sub,arr,key){
    return sectionTitle(title,sub,"＋ Add","openSimpleProgressModal('"+key+"')")+
      '<div class="grid grid-3">'+(arr.map(function(x){return '<div class="card manage-card"><div class="split"><h3>'+esc(x.title)+'</h3><span class="tag">'+x.progress+'%</span></div>'+progress(x.progress)+'<div class="manage-actions"><button class="btn ghost" onclick="editProgressModal(\''+key+'\','+x.id+')">Edit</button><button class="btn ghost" onclick="bumpGeneric(\''+key+'\','+x.id+',10)">+10%</button><button class="btn ghost danger" onclick="v5Delete(\''+key+'\','+x.id+',\'item\')">Delete</button></div></div>'}).join("")||empty("Nothing added yet"))+'</div>';
  };

  function boardConfig(){
    if(boardType==="internships")return {key:"internships",title:"Internship Pipeline",statuses:internshipStatuses,label:function(x){return x.company+" • "+x.role},meta:function(x){return x.date||"No date"},add:"openPipelineModal('internships')"};
    if(boardType==="clients")return {key:"clients",title:"Client Pipeline",statuses:clientStatuses,label:function(x){return x.company+" • "+x.role},meta:function(x){return "₹"+(x.value||0)},add:"openPipelineModal('clients')"};
    return {key:"projects",title:"Project Board",statuses:projectStatuses,label:function(x){return x.name},meta:function(x){return (x.progress||0)+"% complete"},add:"openProjectModal()"};
  }
  window.setBoardType=function(type){boardType=type;render()};
  window.boardDragStart=function(e,type,id){
    e.dataTransfer.setData("text/plain",type+"|"+id);
    e.dataTransfer.effectAllowed="move";
    e.currentTarget.classList.add("dragging");
  };
  window.boardDragEnd=function(e){e.currentTarget.classList.remove("dragging");document.querySelectorAll(".kanban-col").forEach(function(c){c.classList.remove("drag-over")})};
  window.boardDragOver=function(e){e.preventDefault();e.currentTarget.classList.add("drag-over");e.dataTransfer.dropEffect="move"};
  window.boardDragLeave=function(e){e.currentTarget.classList.remove("drag-over")};
  window.boardDrop=function(e,status){
    e.preventDefault();e.currentTarget.classList.remove("drag-over");
    const raw=e.dataTransfer.getData("text/plain"),parts=raw.split("|");if(parts.length!==2)return;
    moveBoardItem(parts[0],+parts[1],status);
  };
  window.moveBoardItem=function(type,id,status){
    const cfg=type==="projects"?{key:"projects"}:type==="internships"?{key:"internships"}:{key:"clients"};
    const item=(state[cfg.key]||[]).find(function(x){return x.id===id});if(!item)return;
    item.status=status;
    if(type==="projects"&&status==="Complete")item.progress=100;
    if(type==="projects"&&status==="Live"&&item.progress<90)item.progress=90;
    v5Log(type.slice(0,-1),"Moved "+(item.name||item.company||"item")+" → "+status);
    save();render();toast("Moved to "+status);
  };
  function boardCard(type,item,statuses,cfg){
    const title=cfg.label(item),meta=cfg.meta(item);
    const edit=type==="projects"?"editProjectModal("+item.id+")":type==="internships"?"editInternshipModal("+item.id+")":"editClientModal("+item.id+")";
    return '<article class="kanban-card" draggable="true" ondragstart="boardDragStart(event,\''+type+'\','+item.id+')" ondragend="boardDragEnd(event)"><h4>'+esc(title)+'</h4><p>'+esc(meta)+'</p><div class="kanban-meta">'+(type==="projects"?tag((item.progress||0)+"%"):tag(item.status))+'</div><select class="kanban-select" onchange="moveBoardItem(\''+type+'\','+item.id+',this.value)">'+statuses.map(function(s){return '<option '+(s===item.status?'selected':'')+'>'+esc(s)+'</option>'}).join("")+'</select><div class="kanban-actions"><button class="btn ghost" onclick="'+edit+'">Edit</button></div></article>';
  }
  window.boardsView=function(){
    const cfg=boardConfig(),items=state[cfg.key]||[];
    return sectionTitle("Career Boards","Drag cards between stages or use the status dropdown.","＋ Add",cfg.add)+
      '<div class="board-toolbar"><button class="btn '+(boardType==="projects"?"primary":"ghost")+'" onclick="setBoardType(\'projects\')">Projects</button><button class="btn '+(boardType==="internships"?"primary":"ghost")+'" onclick="setBoardType(\'internships\')">Internships</button><button class="btn '+(boardType==="clients"?"primary":"ghost")+'" onclick="setBoardType(\'clients\')">Clients</button></div>'+
      '<div class="card" style="padding:14px"><div class="card-head"><div><p class="eyebrow">Kanban</p><h3>'+esc(cfg.title)+'</h3></div><span class="tag">'+items.length+' cards</span></div><div class="kanban">'+cfg.statuses.map(function(status){
        const group=items.filter(function(x){return x.status===status});
        return '<section class="kanban-col" ondragover="boardDragOver(event)" ondragleave="boardDragLeave(event)" ondrop="boardDrop(event,\''+status+'\')"><div class="kanban-head"><h3><span class="status-dot"></span>'+esc(status)+'</h3><span class="kanban-count">'+group.length+'</span></div><div class="kanban-list">'+(group.map(function(item){return boardCard(cfg.key,item,cfg.statuses,cfg)}).join("")||'<small class="muted">Drop items here</small>')+'</div></section>';
      }).join("")+'</div></div>';
  };

  const commandItemsV5Base=commandItems;
  commandItems=function(){return commandItemsV5Base().concat([["Career Boards","Open project, internship and client Kanban boards",function(){navTo("boards")}]]);};

  const renderV5Base=render;
  render=function(){
    if(currentView==="boards"){
      document.getElementById("viewTitle").textContent="Career Boards";
      document.getElementById("profileName").textContent=state.profile.name.split(" ")[0];
      document.getElementById("profileInitials").textContent=state.profile.name.split(" ").map(function(x){return x[0]}).join("").slice(0,2).toUpperCase();
      document.getElementById("viewRoot").innerHTML=boardsView();
      document.querySelectorAll("[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view==="boards")});
      updateLevelUI();updateAdvancedHeader();return;
    }
    renderV5Base();
  };

  render();
})();