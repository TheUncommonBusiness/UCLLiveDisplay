import {TEMPLATES} from './model.js';
import {PRODUCTION_MEDIA} from '../assets/production/catalog.js';
export const TITLE_SCENE_IDS=['editorial-opening','big-type-opening','night-rodeo-opening'];
export const SCREEN_CATEGORIES=[['titles','Titles'],['agendas','Agendas'],['holds','Holds'],['apps','Event app'],['countdowns','Countdowns'],['saved','Saved']];
export function screenCategory(p){
 if(PRODUCTION_MEDIA.find(m=>m.id===p.assetId)?.category==='apps')return 'apps';
 if(p.layout==='daily-agenda')return 'agendas';
 if(p.layout==='presentation')return TITLE_SCENE_IDS.includes(p.sceneId)?'titles':null;
 if(p.layout==='session')return 'titles';
 if(p.kind==='countdown')return 'countdowns';
 if(['logo','range','badge','pattern','media'].includes(p.layout))return 'holds';
 return null;
}
const filmOrder=p=>{const i=PRODUCTION_MEDIA.findIndex(m=>m.id===p.assetId);return i<0?100:i};
export const WEB_TEMPLATES=TEMPLATES.filter(p=>screenCategory(p)).sort((a,b)=>filmOrder(a)-filmOrder(b));
