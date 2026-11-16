// Small labeled controls use one consistent, local outline icon set.
const paths={
 title:'M4 5h16M12 5v14M8 19h8M4 5v3M20 5v3',
 agenda:'M8 5h12M8 12h12M8 19h12M3 5h.01M3 12h.01M3 19h.01',
 hold:'M9 7v10M15 7v10',
 phone:'M7 2h10v20H7zM10 5h4M11 19h2',
 timer:'M9 2h6M12 2v3M18 5l2 2M12 10v4l3 2|circle:12,14,8',
 bookmark:'M6 3h12v18l-6-4-6 4z',
 screen:'M3 4h18v13H3zM12 17v4M8 21h8',
 loop:'M20 8a8 8 0 0 0-14-3L3 8M3 3v5h5M4 16a8 8 0 0 0 14 3l3-3M21 21v-5h-5',
 upload:'M12 16V3M7 8l5-5 5 5M4 16v5h16v-5',
 cloud:'M7 18H6a4 4 0 1 1 1-8 6 6 0 0 1 11-2 5 5 0 0 1 0 10h-1M12 21V12M9 15l3-3 3 3',
 settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
 edit:'M15 4l5 5M4 20l5-1L21 7l-5-5L4 14z',
 play:'M7 4l14 8-14 8z',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z|circle:12,12,3',
 save:'M4 3h13l4 4v14H3V3h1M7 3v6h10V3M7 21v-8h10v8',
 download:'M12 3v13M7 11l5 5 5-5M4 17v4h16v-4',
 help:'M9 8a3 3 0 1 1 5 2c-1 1-2 1-2 3M12 17h.01|circle:12,12,10',
 blackout:'M3 4h18v16H3zM4 19L20 5',
 next:'M5 5l10 7-10 7zM19 5v14',
 link:'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2'
};
const style=document.createElement('style');style.id='ui-icons';
style.textContent=Object.entries(paths).map(([name,data])=>{const parts=data.split('|'),body='<path d="'+parts[0]+'"/>'+parts.slice(1).map(part=>{const [cx,cy,r]=part.split(':')[1].split(',');return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>'}).join('');const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';return '[data-icon="'+name+'"]{--control-icon:url("data:image/svg+xml,'+encodeURIComponent(svg)+'")}'}).join('\n');document.head.append(style);
