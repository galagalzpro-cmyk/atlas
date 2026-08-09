"use client";

import { useEffect, useRef } from "react";
import { ATLAS_PRESENCE_PRESETS, ATLAS_PRESENCE_QUALITY } from "./presence.config";
import type { AtlasPresenceQuality, AtlasPresenceState } from "./presence.types";

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uDensity;
uniform float uCohesion;
uniform float uTurbulence;
uniform float uGlow;
uniform float uWarmth;
uniform float uAttention;
uniform float uVoice;
uniform float uLookX;
uniform float uLookY;
uniform int uSteps;

float saturate(float x){return clamp(x,0.,1.);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float smin(float a,float b,float k){float h=saturate(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1.-h);}

float hash31(vec3 p){
  p=fract(p*.1031);
  p+=dot(p,p.yzx+33.33);
  return fract((p.x+p.y)*p.z);
}
float hash41(vec4 p){
  p=fract(p*vec4(.1031,.1030,.0973,.1099));
  p+=dot(p,p.wzxy+33.33);
  return fract((p.x+p.y)*(p.z+p.w));
}
float noise4(vec4 p){
  vec4 i=floor(p); vec4 f=fract(p); f=f*f*(3.-2.*f);
  float n0000=hash41(i+vec4(0,0,0,0)); float n1000=hash41(i+vec4(1,0,0,0));
  float n0100=hash41(i+vec4(0,1,0,0)); float n1100=hash41(i+vec4(1,1,0,0));
  float n0010=hash41(i+vec4(0,0,1,0)); float n1010=hash41(i+vec4(1,0,1,0));
  float n0110=hash41(i+vec4(0,1,1,0)); float n1110=hash41(i+vec4(1,1,1,0));
  float n0001=hash41(i+vec4(0,0,0,1)); float n1001=hash41(i+vec4(1,0,0,1));
  float n0101=hash41(i+vec4(0,1,0,1)); float n1101=hash41(i+vec4(1,1,0,1));
  float n0011=hash41(i+vec4(0,0,1,1)); float n1011=hash41(i+vec4(1,0,1,1));
  float n0111=hash41(i+vec4(0,1,1,1)); float n1111=hash41(i+vec4(1,1,1,1));
  float a0=mix(mix(mix(n0000,n1000,f.x),mix(n0100,n1100,f.x),f.y),mix(mix(n0010,n1010,f.x),mix(n0110,n1110,f.x),f.y),f.z);
  float a1=mix(mix(mix(n0001,n1001,f.x),mix(n0101,n1101,f.x),f.y),mix(mix(n0011,n1011,f.x),mix(n0111,n1111,f.x),f.y),f.z);
  return mix(a0,a1,f.w);
}
float fbm4(vec4 p){
  float v=0.; float a=.5;
  for(int i=0;i<4;i++){v+=a*noise4(p);p.xyz=p.xyz*2.03+vec3(.73,-.41,.29);p.w*=1.91;a*=.5;}
  return v;
}

float sdEllipsoid(vec3 p,vec3 r){
  float k0=length(p/r);
  float k1=length(p/(r*r));
  return k0*(k0-1.)/max(k1,.0001);
}
float sdRoundBox(vec3 p,vec3 b,float r){
  vec3 q=abs(p)-b+r;
  return min(max(q.x,max(q.y,q.z)),0.)+length(max(q,0.))-r;
}
float sdBox(vec3 p,vec3 b){
  vec3 q=abs(p)-b;
  return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);
}
float sdOcta(vec3 p,float s){p=abs(p);return (p.x+p.y+p.z-s)*.57735027;}
float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float gaussian(vec3 p,vec3 c,vec3 s){vec3 q=(p-c)/s;return exp(-dot(q,q)*2.2);}

vec3 pose(vec3 p){
  p.x-=uLookX*.085;
  p.y+=uLookY*.052;
  p.xz*=rot(uLookX*.105);
  p.yz*=rot(-uLookY*.068);
  return p;
}

float baseFaceSdf(vec3 raw){
  vec3 p=pose(raw);
  float skull=sdEllipsoid(p-vec3(0.,.09,-.01),vec3(.72,.94,.58));
  float jaw=sdEllipsoid(p-vec3(0.,-.49,.045),vec3(.52,.46,.47));
  float chin=sdRoundBox(p-vec3(0.,-.78,.16),vec3(.25,.16,.24),.16);
  float form=smin(skull,jaw,.22);
  form=smin(form,chin,.13);

  vec3 lc=p-vec3(-.43,-.11,.285); lc.xy*=rot(-.22); lc.xz*=rot(.13);
  vec3 rc=p-vec3(.43,-.11,.285); rc.xy*=rot(.22); rc.xz*=rot(-.13);
  form=smin(form,sdRoundBox(lc,vec3(.21,.31,.085),.105),.08);
  form=smin(form,sdRoundBox(rc,vec3(.21,.31,.085),.105),.08);

  vec3 lt=p-vec3(-.57,.31,.09); lt.xy*=rot(-.18);
  vec3 rt=p-vec3(.57,.31,.09); rt.xy*=rot(.18);
  form=smin(form,sdRoundBox(lt,vec3(.12,.30,.14),.08),.075);
  form=smin(form,sdRoundBox(rt,vec3(.12,.30,.14),.08),.075);

  vec3 browL=p-vec3(-.28,.31,.42); browL.xy*=rot(-.10);
  vec3 browR=p-vec3(.28,.31,.42); browR.xy*=rot(.10);
  form=smin(form,sdRoundBox(browL,vec3(.24,.06,.08),.035),.055);
  form=smin(form,sdRoundBox(browR,vec3(.24,.06,.08),.035),.055);

  vec3 crownP=p-vec3(0.,.65,-.02);
  crownP.xz*=rot(.785);
  form=smin(form,sdOcta(crownP/vec3(1.,.84,1.12),.62),.11);

  vec3 la=p-vec3(-.29,.18,.49); la.xy*=rot(-.05);
  vec3 ra=p-vec3(.29,.18,.49); ra.xy*=rot(.05);
  float apertureL=sdRoundBox(la,vec3(.18,.043,.11),.043);
  float apertureR=sdRoundBox(ra,vec3(.18,.043,.11),.043);
  form=max(form,-min(apertureL,apertureR));

  vec3 central=p-vec3(0.,.01,.53);
  form=max(form,-sdRoundBox(central,vec3(.035,.49,.07),.026)*.74);

  vec3 mouthChannel=p-vec3(0.,-.48,.49);
  form=max(form,-sdRoundBox(mouthChannel,vec3(.22,.024,.06),.024)*.62);
  return form;
}

float faceSdf(vec3 raw){
  vec3 p=pose(raw);
  float form=baseFaceSdf(raw);
  float temporal=fbm4(vec4(p*2.55,uTime*.115));
  float facets=sin(atan(p.y,p.x)*14.+p.z*9.)*sin(atan(length(p.xz),p.y)*13.);
  form+=(temporal-.5)*uTurbulence*.031;
  form+=facets*.009*uCohesion;
  return form;
}

vec3 faceNormal(vec3 p){
  float e=.0055;
  vec2 h=vec2(e,0.);
  return normalize(vec3(
    faceSdf(p+h.xyy)-faceSdf(p-h.xyy),
    faceSdf(p+h.yxy)-faceSdf(p-h.yxy),
    faceSdf(p+h.yyx)-faceSdf(p-h.yyx)
  ));
}

float shellLines(vec3 raw){
  vec3 p=pose(raw);
  float longitude=abs(sin(atan(p.x,p.z)*13.));
  float latitude=abs(sin(atan(length(p.xz),p.y)*15.));
  float ribs=pow(1.-min(longitude,latitude),25.);
  float diagonalA=pow(1.-abs(sin((p.x+p.y*.72-p.z*.34)*19.)),31.);
  float diagonalB=pow(1.-abs(sin((-p.x+p.y*.61+p.z*.28)*22.)),34.);
  return saturate(ribs*.62+diagonalA*.31+diagonalB*.25);
}

float innerLattice(vec3 raw){
  vec3 p=pose(raw)*5.9;
  float g=sin(p.x)*cos(p.y)+sin(p.y)*cos(p.z)+sin(p.z)*cos(p.x);
  float line=exp(-abs(g)*11.5);
  float n=fbm4(vec4(p*.40,uTime*.18));
  return line*(.58+.42*n);
}

float crystallineCore(vec3 raw){
  vec3 p=pose(raw);
  p.xz*=rot(uTime*.052);
  p.xy*=rot(-uTime*.035);
  float d=sdOcta(p-vec3(0.,-.02,-.06),.40);
  float shell=exp(-abs(d)*38.);
  float planes=pow(abs(sin((p.x-p.y+p.z)*21.+uTime*.66)),20.);
  return shell*(.68+.32*planes);
}

float orbitalGeometry(vec3 raw){
  vec3 p=raw;
  vec3 q1=p; q1.yz*=rot(.82+uTime*.033);
  vec3 q2=p; q2.xy*=rot(1.05-uTime*.025);
  vec3 q3=p; q3.xz*=rot(.55+uTime*.018);
  float a=exp(-abs(sdTorus(q1,vec2(.95,.010)))*88.);
  float b=exp(-abs(sdTorus(q2,vec2(1.08,.009)))*92.);
  float c=exp(-abs(sdTorus(q3,vec2(.77,.008)))*96.);
  return a*.48+b*.36+c*.28;
}

float voxelSurface(vec3 raw,out float activation){
  vec3 p=pose(raw);
  float cell=.095;
  vec3 cellId=floor((p+1.55)/cell);
  vec3 center=(cellId+.5)*cell-1.55;
  vec3 local=mod(p+1.55,cell)-cell*.5;
  float faceAtCell=abs(baseFaceSdf(center));
  float surfaceMask=1.-smoothstep(.018,.115,faceAtCell);

  float asym=smoothstep(-.18,.82,center.x)*.58+smoothstep(.28,.92,center.y)*.16;
  float phase=hash31(cellId*1.37)+fbm4(vec4(center*1.8,uTime*.16))*.45;
  float pulse=.5+.5*sin(uTime*.82+phase*6.283+center.y*2.4);
  float stable=saturate(uCohesion*.98-asym*(1.-uCohesion)*.62);
  activation=saturate(stable+.31*pulse-.17+hash31(cellId)*.14);

  float push=(1.-activation)*(.08+.15*asym);
  local.z-=push*(.35+.65*pulse);
  local.x-=sign(center.x)*push*.20;
  local.y+=sin(phase*8.+uTime*.5)*push*.10;

  vec3 boxSize=vec3(cell*.34,cell*.34,cell*.33);
  float d=sdBox(local,boxSize);
  float block=exp(-abs(d)*90.);
  float edge=exp(-abs(abs(local.x)-boxSize.x)*75.)+exp(-abs(abs(local.y)-boxSize.y)*75.)+exp(-abs(abs(local.z)-boxSize.z)*75.);
  return surfaceMask*activation*saturate(block*.78+edge*.08);
}

float plateGeometry(vec3 raw){
  vec3 p=pose(raw);
  float faceMask=1.-smoothstep(.0,.12,abs(baseFaceSdf(p)));
  vec3 q=p;
  q.z-=.46;
  float bands=pow(1.-abs(sin((q.y+.86)*18.)),32.);
  float vertical=pow(1.-abs(sin((q.x+.74)*20.)),36.);
  float slant=pow(1.-abs(sin((q.x*.82+q.y*.46)*17.)),34.);
  float front=smoothstep(.08,.52,p.z);
  return faceMask*front*saturate(bands*.34+vertical*.26+slant*.28);
}

float attentionGeometry(vec3 raw){
  vec3 p=pose(raw);
  float l=gaussian(p,vec3(-.29,.18,.46),vec3(.15,.07,.17));
  float r=gaussian(p,vec3(.29,.18,.46),vec3(.15,.07,.17));
  float ringL=exp(-abs(length((p.xy-vec2(-.29,.18))/vec2(.16,.075))-.76)*13.)*exp(-abs(p.z-.46)*14.);
  float ringR=exp(-abs(length((p.xy-vec2(.29,.18))/vec2(.16,.075))-.76)*13.)*exp(-abs(p.z-.46)*14.);
  return (l+r)*uAttention+(ringL+ringR)*uAttention*.62;
}

vec3 materialPalette(float shell,float inner,float core,float attention,float voxel,float depth,float light){
  vec3 steel=vec3(.16,.34,.62);
  vec3 ice=vec3(.55,.79,1.0);
  vec3 pearl=vec3(.92,.96,1.0);
  vec3 warm=vec3(.92,.67,.39);
  vec3 base=mix(steel,warm,uWarmth*.46);
  base=mix(base,ice,saturate(inner*.55+depth*.24+voxel*.30));
  base=mix(base,pearl,saturate(shell*.35+attention*.70+light*.26+voxel*.20));
  base+=core*vec3(.12,.29,.64);
  return base;
}

void main(){
  vec2 frag=vUv*2.-1.;
  frag.x*=uResolution.x/max(uResolution.y,1.);

  vec3 ro=vec3(0.,-.015,3.58);
  vec3 rd=normalize(vec3(frag*.77,-2.56));
  float t=.92;
  vec3 accum=vec3(0.);
  float alpha=0.;

  for(int i=0;i<132;i++){
    if(i>=uSteps) break;
    vec3 p=ro+rd*t;
    float sdf=faceSdf(p);
    float shell=exp(-abs(sdf)*61.)*uCohesion;
    float innerShell=exp(-abs(sdf+.082)*39.)*.52;
    float deepShell=exp(-abs(sdf+.165)*31.)*.24;
    float inside=saturate(-sdf*7.2+.31);
    float lattice=innerLattice(p)*inside;
    float core=crystallineCore(p)*inside;
    float ribs=shellLines(p)*shell;
    float plates=plateGeometry(p)*shell;
    float activation=0.;
    float voxels=voxelSurface(p,activation);
    float attention=attentionGeometry(p);

    vec3 posed=pose(p);
    float voiceZone=gaussian(posed,vec3(0.,-.48,.34),vec3(.38,.23,.26));
    float voiceWave=(sin(posed.y*19.-uTime*9.2+posed.x*5.4+posed.z*3.)*.5+.5)*voiceZone*uVoice;

    float mistNoise=fbm4(vec4(posed*3.35,uTime*.17));
    float volume=inside*(.020+.049*mistNoise)*uDensity;
    volume+=voiceWave*.052;

    float orbit=orbitalGeometry(p);
    float contribution=shell*.085+innerShell*.041+deepShell*.024+lattice*.029+core*.043+ribs*.075+plates*.067+voxels*.132+attention*.098+volume+orbit*.047;
    contribution*=1.-alpha;
    float stepAlpha=clamp(contribution,0.,.215);

    float light=.43;
    float rim=0.;
    float spec=0.;
    if(shell>.045){
      vec3 n=faceNormal(p);
      vec3 key=normalize(vec3(-.48,.72,.54));
      vec3 fill=normalize(vec3(.58,-.15,.80));
      light=.26+.61*max(dot(n,key),0.)+.22*max(dot(n,fill),0.);
      rim=pow(1.-max(dot(n,-rd),0.),2.1);
      vec3 h=normalize(key-rd);
      spec=pow(max(dot(n,h),0.),42.);
    }

    float depth=saturate((3.30-t)*.42+.30);
    vec3 col=materialPalette(shell,lattice,core,attention,voxels,depth,light)*(uGlow+.43);
    col*=.55+.75*light;
    col+=ribs*vec3(.15,.39,.84)*1.06;
    col+=plates*vec3(.24,.50,.94)*.82;
    col+=voxels*vec3(.46,.68,1.03)*(1.03+.28*activation);
    col+=attention*vec3(.34,.76,1.34)*uGlow;
    col+=core*vec3(.13,.32,.78)*.93;
    col+=voiceWave*vec3(.44,.62,1.02)*.76;
    col+=rim*shell*vec3(.35,.62,1.0)*.70;
    col+=spec*shell*vec3(1.0,.95,.84)*.76;
    col+=orbit*vec3(.16,.38,.82)*.52;
    col+=deepShell*vec3(.12,.26,.52)*.45;

    accum+=col*stepAlpha;
    alpha+=stepAlpha;
    if(alpha>.984) break;
    t+=.0315;
  }

  float radial=length(frag*vec2(.78,1.02));
  float deepHalo=exp(-radial*2.0)*.14*uGlow;
  float secondaryHalo=exp(-abs(radial-.64)*14.)*.026;
  float nearAura=exp(-abs(radial-.39)*18.)*.019;
  vec3 backgroundGlow=mix(vec3(.10,.27,.59),vec3(.42,.25,.12),uWarmth*.31);
  accum+=backgroundGlow*(deepHalo+secondaryHalo+nearAura);

  float vignette=1.-smoothstep(.74,1.62,radial);
  alpha*=vignette;
  accum*=.85+.15*vignette;
  outColor=vec4(accum,alpha*.988);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create ATLAS shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "ATLAS shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export default function AtlasPresence4D({ state, quality }: { state: AtlasPresenceState; quality: AtlasPresenceQuality }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, powerPreference: "high-performance", premultipliedAlpha: true });
    if (!gl) { canvas.dataset.fallback = "true"; return; }

    let raf = 0;
    let destroyed = false;
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "ATLAS Presence link failed");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    const U = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      resolution: U("uResolution"), time: U("uTime"), density: U("uDensity"), cohesion: U("uCohesion"), turbulence: U("uTurbulence"),
      glow: U("uGlow"), warmth: U("uWarmth"), attention: U("uAttention"), voice: U("uVoice"), lookX: U("uLookX"), lookY: U("uLookY"), steps: U("uSteps"),
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const profile = ATLAS_PRESENCE_QUALITY[reduced ? "light" : quality];
    let width = 1, height = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, profile.maxDpr) * profile.renderScale;
      width = Math.max(1, Math.round(rect.width * dpr)); height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0,0,width,height); }
    };
    const target = ATLAS_PRESENCE_PRESETS[state];
    const current = { ...target };
    const lerp = (a:number,b:number,k:number)=>a+(b-a)*k;
    const started = performance.now();
    const draw = (now:number) => {
      if (destroyed) return;
      resize();
      current.density=lerp(current.density,target.density,.035); current.cohesion=lerp(current.cohesion,target.cohesion,.03);
      current.turbulence=lerp(current.turbulence,target.turbulence,.025); current.glow=lerp(current.glow,target.glow,.03);
      current.warmth=lerp(current.warmth,target.warmth,.025); current.attention=lerp(current.attention,target.attention,.035);
      const stage=canvas.closest<HTMLElement>(".atlas-sanctuary");
      const styles=stage?getComputedStyle(stage):null;
      const voice=Number.parseFloat(styles?.getPropertyValue("--voice-level")||"0")||0;
      const lookX=Number.parseFloat(styles?.getPropertyValue("--look-x")||"0")||0;
      const lookY=Number.parseFloat(styles?.getPropertyValue("--look-y")||"0")||0;
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution,width,height); gl.uniform1f(uniforms.time,((now-started)/1000)*target.temporalSpeed);
      gl.uniform1f(uniforms.density,current.density); gl.uniform1f(uniforms.cohesion,current.cohesion); gl.uniform1f(uniforms.turbulence,current.turbulence);
      gl.uniform1f(uniforms.glow,current.glow); gl.uniform1f(uniforms.warmth,current.warmth); gl.uniform1f(uniforms.attention,current.attention);
      gl.uniform1f(uniforms.voice,voice); gl.uniform1f(uniforms.lookX,lookX); gl.uniform1f(uniforms.lookY,lookY); gl.uniform1i(uniforms.steps,profile.raySteps);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES,0,6);
      if (!reduced) raf=requestAnimationFrame(draw);
    };
    resize(); draw(performance.now());
    window.addEventListener("resize",resize,{passive:true});
    return () => { destroyed=true; cancelAnimationFrame(raf); window.removeEventListener("resize",resize); if(buffer) gl.deleteBuffer(buffer); gl.deleteProgram(program); };
  }, [quality, state]);

  return <canvas ref={canvasRef} className="atlas-presence-4d" aria-hidden="true" />;
}
