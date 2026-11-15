import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESENTATION_TEMPLATES,sanitizePreset,sanitizeState,defaultState,itemFromPreset} from '../src/model.js';
import {PRESENTATION_SCENES} from '../assets/presentation-system/scenes.js';
import {sessionFromURL,sessionURL} from '../src/session-context.js';

test('all selected layouts survive saved shows and loop round trips',()=>{
 assert.equal(PRESENTATION_TEMPLATES.length,26);
 const state=defaultState(0);state.presets=PRESENTATION_TEMPLATES.map(sanitizePreset);
 state.loops=[{id:'matched-loop',name:'Matched',timerSeconds:0,items:state.presets.map(p=>itemFromPreset(p))}];
 const restored=sanitizeState(JSON.parse(JSON.stringify(state)),0);
 assert.equal(restored.presets.length,26);
 for(let i=0;i<26;i++)assert.deepEqual(restored.presets[i].fields,PRESENTATION_TEMPLATES[i].fields);
});
test('presentation fields reject unknown layouts and bound untrusted values',()=>{
 const template=PRESENTATION_TEMPLATES[0],scene=PRESENTATION_SCENES[0],field=scene.editableFields.find(f=>f.key.startsWith('headline'));
 assert.throws(()=>sanitizePreset({...template,sceneId:'unknown'}));
 const safe=sanitizePreset({...template,fields:{...template.fields,[field.key]:'x'.repeat(10000),injected:'bad'},theme:'dark',motion:'wild'});
 assert.equal(safe.fields[field.key].length,field.maxLength);assert.equal(safe.fields.injected,undefined);assert.equal(safe.theme,'light');assert.equal(safe.motion,'normal');
});
test('chart edits keep labels and numeric series within supported limits',()=>{
 const template=PRESENTATION_TEMPLATES.find(p=>PRESENTATION_SCENES.find(s=>s.id===p.sceneId).editableFields.some(f=>f.type==='chart'));
 const key=PRESENTATION_SCENES.find(s=>s.id===template.sceneId).editableFields.find(f=>f.type==='chart').key;
 const safe=sanitizePreset({...template,fields:{...template.fields,[key]:{labels:Array(20).fill('Category'),series:Array(5).fill({name:'Test',values:[NaN,Infinity,-20,42]})}}});
 assert.equal(safe.fields[key].labels.length,12);assert.equal(safe.fields[key].series.length,3);assert.deepEqual(safe.fields[key].series[0].values.slice(0,4),[0,0,-20,42]);
});
test('session capabilities stay in fragments and controller/display links remain distinct',()=>{
 const id='room_123456789',token='a'.repeat(43);
 const display=sessionURL({id,token,displayId:'main-display'},'https://theuncommonbusiness.github.io/UCLLiveDisplay/');
 const parsed=new URL(display);assert.equal(parsed.search,'?display=main-display');assert.ok(!parsed.search.includes(token));assert.deepEqual(sessionFromURL(display),{id,token,role:'view'});
 const control=sessionURL({id,token,role:'control'},display);assert.deepEqual(sessionFromURL(control),{id,token,role:'control'});assert.equal(new URL(control).search,'');
 assert.equal(sessionFromURL('https://example.com/#room=../bad&control='+token),null);
});
