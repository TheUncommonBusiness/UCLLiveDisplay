import {TEMPLATES} from './model.js';
export const TITLE_SCENE_IDS=['editorial-opening','big-type-opening','night-rodeo-opening'];
export const SCREEN_CATEGORIES=[['titles','Titles'],['agendas','Agendas'],['holds','Holds'],['countdowns','Countdowns'],['saved','Saved']];
export function screenCategory(p){
 if(p.layout==='daily-agenda')return 'agendas';
 if(p.layout==='presentation')return TITLE_SCENE_IDS.includes(p.sceneId)?'titles':null;
 if(p.layout==='session')return 'titles';
 if(p.kind==='countdown')return 'countdowns';
 if(['logo','range','badge','pattern','media'].includes(p.layout))return 'holds';
 return null;
}
export const WEB_TEMPLATES=TEMPLATES.filter(p=>screenCategory(p));
