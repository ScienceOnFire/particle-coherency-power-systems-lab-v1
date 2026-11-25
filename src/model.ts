export const dt=.01, end=1200;
export type Edge=[number,number,number];
export type Frame={w:number[],d:number[],flow:number[],fault:boolean};
export function simulate(n:number,scenario:string,h:number,c:number){
 const pos:number[][]=n===3?[[300,280],[55,45],[545,45],[300,215],[145,160],[455,160],[145,45],[300,45],[455,45]]:Array.from({length:n},(_,i)=>{const a=i<3?0:i<7?1:2,j=i-(a===0?0:a===1?3:7);return [65+a*200+(j%2)*85,70+Math.floor(j/2)*145]});
 const edges:Edge[]=n===3?[[0,3,12],[1,6,12],[2,8,12],[3,4,5],[3,5,5],[4,6,5],[5,8,5],[6,7,3],[7,8,3]]:[];
 const area=(i:number)=>i<3?0:i<7?1:2;
 if(n===10)for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(area(i)===area(j)||i===2&&j===3||i===6&&j===7)edges.push([i,j,area(i)===area(j)?7:1.3]);
 const faultEdge=n===3?5:edges.findIndex(e=>e[0]===2&&e[1]===3);
 const H=Array.from({length:n},(_,i)=>(3.5+i%3*1.1)*h);
 let d=Array(n).fill(0) as number[],w=d.slice();const frames:Frame[]=[];
 function network(d:number[],t:number){const z=Array(pos.length).fill(0) as number[];d.forEach((v,i)=>z[i]=v);const fault=scenario==='fault'&&t>=.01&&t<.05;
 const links=edges.map(([a,b,v],i)=>[a,b,v*(n===3?(i>=3?c:1):(area(a)!==area(b)?c:1))*(fault&&i===faultEdge?.04:1)*(scenario==='weak'&&t>=.1&&i===faultEdge?.12:1)]);
 for(let q=0;q<40;q++)for(let i=n;i<z.length;i++){let s=0,b=0;for(const [a,j,v] of links){if(a===i){s+=v*z[j];b+=v}if(j===i){s+=v*z[a];b+=v}}z[i]=s/b;}
 const flow=links.map(([a,b,v])=>v*(z[a]-z[b])),p=Array(n).fill(0) as number[];links.forEach(([a,b],i)=>{if(a<n)p[a]+=flow[i];if(b<n)p[b]-=flow[i]});return {p,flow,fault};}
 function deriv(d:number[],w:number[],t:number){const r=network(d,t),u=Array(n).fill(0);if(r.fault){u[n===3?1:2]=1.8;u[n===3?2:3]=-.6}if(scenario==='load'&&t>=.1)u[n-1]=-.08;if(scenario==='weak'&&t>=.1&&t<.3){u[0]=.35;u[n-1]=-.35}return {d:w.map(v=>314.159*v),w:w.map((v,i)=>(u[i]-r.p[i]-3*v)/(2*H[i]))};}
 for(let k=0;k<=end;k++){const t=k*dt,r=network(d,t);frames.push({d:d.slice(),w:w.slice(),flow:r.flow,fault:r.fault});const a=deriv(d,w,t),b=deriv(d.map((v,i)=>v+dt*a.d[i]/2),w.map((v,i)=>v+dt*a.w[i]/2),t+dt/2);d=d.map((v,i)=>v+dt*b.d[i]);w=w.map((v,i)=>v+dt*b.w[i]);}return {frames,pos,edges,faultEdge,H};}
export function cluster(frames:Frame[],k:number,mode:'w'|'d',eps:number,gamma:number,win:number,strict:boolean){const x=frames[k][mode],n=x.length,start=Math.max(0,k-win),parent=x.map((_,i)=>i),find=(i:number):number=>parent[i]===i?i:(parent[i]=find(parent[i]));const adj=x.map(()=>x.map(()=>false)),dist=x.map(a=>x.map(b=>Math.abs(a-b)));for(let i=0;i<n;i++){adj[i][i]=true;for(let j=i+1;j<n;j++){let bad=0,near=true;for(let s=start;s<=k;s++){const a=frames[s][mode],b=frames[Math.max(0,s-1)][mode];if(Math.abs(a[i]-a[j])>eps)near=false;if(s>start&&Math.sign(a[i]-b[i])!==Math.sign(a[j]-b[j]))bad++;}if(dist[i][j]<=eps&&(!strict||near)&&bad/Math.max(1,k-start)<=gamma){adj[i][j]=adj[j][i]=true;parent[find(j)]=find(i)}}}const ids=x.map((_,i)=>find(i));const groups=[...new Set(ids)].map(r=>ids.flatMap((v,i)=>v===r?[i]:[]));return {ids,groups,adj,dist};}
