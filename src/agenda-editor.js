const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayOf=p=>p.schedule.days.find(d=>d.id===p.schedule.dayId)||p.schedule.days[0];
export function agendaInspector(p){
 const day=dayOf(p);
 return `<label class="field"><span>Screen title</span><textarea data-field="title" maxlength="110">${esc(p.title)}</textarea></label><label class="field"><span>Day to show</span><select data-agenda-day>${p.schedule.days.map(d=>`<option value="${esc(d.id)}" ${d.id===day.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></label><button class="edit-loop" data-agenda-edit data-icon="edit">Edit daily agendas <span aria-hidden="true">↗</span></button><label class="field"><span>Highlight a session</span><select data-agenda-current><option value="">Full agenda · no highlight</option>${day.items.map(item=>`<option value="${esc(item.id)}" ${item.id===day.activeItemId?'selected':''}>${esc((item.time?item.time+' · ':'')+(item.title||'Untitled session'))}</option>`).join('')}</select><small>Your selection stays in Preview until you launch.</small></label><label class="field"><span>Agenda design</span><select data-agenda-style><option value="editorial" ${p.agendaStyle==='editorial'?'selected':''}>Light timetable</option><option value="night" ${p.agendaStyle==='night'?'selected':''}>Night rodeo</option></select></label>`;
}
export function initializeAgendaEditor({getPreset,onChange,onNotice}){
 const dialog=document.createElement('dialog');dialog.id='agenda-dialog';dialog.className='wide-dialog agenda-dialog';
 dialog.innerHTML='<div class="dialog-head"><div><span class="overline">DAILY SCHEDULES · PREVIEW ONLY</span><h2>Edit the agenda.</h2></div><button class="icon-button" data-agenda-close aria-label="Close agenda editor">×</button></div><p>Add times, session titles, and optional speakers. These edits stay in Preview until you launch.</p><div class="agenda-day-toolbar"><div id="agenda-day-tabs" class="feed-tabs"></div><button id="agenda-add-day">＋ Add day</button></div><div class="agenda-day-name"><label>Day name<input id="agenda-day-name" maxlength="60" placeholder="Day 1 · Monday"></label><label class="agenda-date-field">Date (optional)<input id="agenda-day-date" type="date"></label><button id="agenda-remove-day" class="quiet danger">Remove day</button></div><div class="agenda-column-labels"><span>Start time</span><span>Session title</span><span>Speaker / detail</span><span>Order</span></div><div id="agenda-rows"></div><button id="agenda-add-item" class="agenda-add-item">＋ Add session</button><div class="dialog-footer"><span class="fine-print">Six sessions per page. The full agenda changes pages every 15 seconds.<br>A highlighted session stays in view until you choose another.</span><button class="primary" data-agenda-close data-icon="eye">Done · back to preview</button></div>';
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s),valid=()=>getPreset()?.layout==='daily-agenda';
 const changed=()=>{onChange();};
 function draw(){
  if(!valid())return;const p=getPreset(),day=dayOf(p);
  $('#agenda-day-tabs').innerHTML=p.schedule.days.map(d=>`<button data-edit-day="${esc(d.id)}" class="${d.id===day.id?'active':''}" aria-pressed="${d.id===day.id}">${esc(d.name)}</button>`).join('');
  $('#agenda-day-name').value=day.name;$('#agenda-day-date').value=day.date||'';$('#agenda-add-day').disabled=p.schedule.days.length>=7;$('#agenda-remove-day').disabled=p.schedule.days.length<=1;$('#agenda-add-item').disabled=day.items.length>=30;
  $('#agenda-rows').innerHTML=day.items.map((item,i)=>`<div class="agenda-edit-row" data-agenda-item="${esc(item.id)}"><label><span class="sr-only">Start time for session ${i+1}</span><input type="time" data-agenda-item-field="time" value="${esc(item.time)}"></label><label><span class="sr-only">Session ${i+1} title</span><input data-agenda-item-field="title" maxlength="110" placeholder="Session title" value="${esc(item.title)}"></label><label><span class="sr-only">Speaker or detail for session ${i+1}</span><input data-agenda-item-field="speaker" maxlength="90" placeholder="Optional" value="${esc(item.speaker)}"></label><div class="reorder"><button data-agenda-action="up" aria-label="Move session ${i+1} up" ${i===0?'disabled':''}>↑</button><button data-agenda-action="down" aria-label="Move session ${i+1} down" ${i===day.items.length-1?'disabled':''}>↓</button><button data-agenda-action="remove" aria-label="Remove session ${i+1}">×</button></div></div>`).join('')||'<p class="empty">Add the first session for this day.</p>';
 }
 document.querySelector('#inspector-fields').addEventListener('click',e=>{if(e.target.closest('[data-agenda-edit]')&&valid()){draw();dialog.showModal()}});
 document.querySelector('#inspector-fields').addEventListener('change',e=>{
  if(!valid())return;const p=getPreset();
  if(e.target.matches('[data-agenda-day]'))p.schedule.dayId=e.target.value;
  else if(e.target.matches('[data-agenda-current]'))dayOf(p).activeItemId=e.target.value;
  else if(e.target.matches('[data-agenda-style]')){p.agendaStyle=e.target.value;p.theme=p.agendaStyle==='night'?'dark':'light'}else return;
  changed();
 });
 dialog.addEventListener('click',e=>{
  if(e.target.closest('[data-agenda-close]')){dialog.close();return}if(!valid())return;
  const p=getPreset(),day=dayOf(p),button=e.target.closest('button');if(!button)return;
  if(button.dataset.editDay){p.schedule.dayId=button.dataset.editDay;draw();changed()}
  if(button.id==='agenda-add-day'&&p.schedule.days.length<7){const id='day-'+crypto.randomUUID();p.schedule.days.push({id,name:'Day '+(p.schedule.days.length+1),date:'',activeItemId:'',items:[]});p.schedule.dayId=id;draw();changed();$('#agenda-day-name').focus();$('#agenda-day-name').select()}
  if(button.id==='agenda-remove-day'&&p.schedule.days.length>1){if(!confirm('Remove '+day.name+' and its sessions from this preview?'))return;p.schedule.days=p.schedule.days.filter(d=>d.id!==day.id);p.schedule.dayId=p.schedule.days[0].id;draw();changed()}
  if(button.id==='agenda-add-item'&&day.items.length<30){day.items.push({id:'session-'+crypto.randomUUID(),time:'',title:'',speaker:''});draw();changed();$('#agenda-rows .agenda-edit-row:last-child [data-agenda-item-field="title"]').focus()}
  if(button.dataset.agendaAction){const row=button.closest('[data-agenda-item]'),i=day.items.findIndex(x=>x.id===row?.dataset.agendaItem);if(i<0)return;const action=button.dataset.agendaAction;
   if(action==='remove'){if(day.activeItemId===day.items[i].id)day.activeItemId='';day.items.splice(i,1)}else{const to=i+(action==='up'?-1:1);if(to<0||to>=day.items.length)return;[day.items[i],day.items[to]]=[day.items[to],day.items[i]]}draw();changed();
  }
 });
 $('#agenda-day-name').addEventListener('input',e=>{if(!valid())return;dayOf(getPreset()).name=e.target.value;const tab=$('#agenda-day-tabs .active');if(tab)tab.textContent=e.target.value||'Untitled day';changed()});
 $('#agenda-day-date').addEventListener('change',e=>{if(valid()){dayOf(getPreset()).date=e.target.value;changed()}});
 $('#agenda-rows').addEventListener('input',e=>{if(!valid())return;const key=e.target.dataset.agendaItemField,row=e.target.closest('[data-agenda-item]');if(!key||!row)return;const item=dayOf(getPreset()).items.find(i=>i.id===row.dataset.agendaItem);if(item){item[key]=e.target.value;changed()}});
}
