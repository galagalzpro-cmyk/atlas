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

#define PI 3.14159265359

float saturate(float x){return clamp(x,0.,1.);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float smin(float a,float b,float k){float h=saturate(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1.-h);}

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
float sdOcta(vec3 p,float s){p=abs(p);return (p.x+p.y+p.z-s)*.57735027;}
float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float gaussian(vec3 p,vec3 c,vec3 s){vec3 q=(p-c)/s;return exp(-dot(q,q)*2.2);}

vec3 pose(vec3 p){
  p.x-=uLookX*.075;
  p.y+=uLookY*.048;
  p.xz*=rot(uLookX*.085);
  p.yz*=rot(-uLookY*.055);
  return p;
}

float faceSdf(vec3 raw){
  vec3 p=pose(raw);
  float skull=sdEllipsoid(p-vec3(0.,.08,0.),vec3(.72,.94,.57));
  float jaw=sdEllipsoid(p-vec3(0.,-.49,.035),vec3(.52,.46,.47));
  float chin=sdRoundBox(p-vec3(0.,-.78,.14),vec3(.25,.16,.24),.16);
  float form=smin(skull,jaw,.22);
  form=smin(form,chin,.13);

  vec3 lc=p-vec3(-.43,-.11,.255); lc.xy*=rot(-.22); lc.xz*=rot(.13);
  vec3 rc=p-vec3(.43,-.11,.255); rc.xy*=rot(.22); rc.xz*=rot(-.13);
  float cheekL=sdRoundBox(lc,vec3(.21,.31,.075),.105);
  float cheekR=sdRoundBox(rc,vec3(.21,.31,.075),.105);
  form=smin(form,cheekL,.08);
  form=smin(form,cheekR,.08);

  vec3 lt=p-vec3(-.57,.31,.08); lt.xy*=rot(-.18);
  vec3 rt=p-vec3(.57,.31,.08); rt.xy*=rot(.18);
  float templeL=sdRoundBox(lt,vec3(.12,.30,.13),.08);
  float templeR=sdRoundBox(rt,vec3(.12,.30,.13),.08);
  form=smin(form,templeL,.075);
  form=smin(form,templeR,.075);

  vec3 crownP=p-vec3(0.,.64,-.02);
  crownP.xz*=rot(.785);
  float crown=sdOcta(crownP/vec3(1.,.84,1.12),.62);
  form=smin(form,crown,.11);

  float temporal=fbm4(vec4(p*2.45,uTime*.11));
  float facets=sin(atan(p.y,p.x)*12.+p.z*8.)*sin(atan(length(p.xz),p.y)*11.);
  form+=(temporal-.5)*uTurbulence*.035;
  form+=facets*.010*uCohesion;

  vec3 la=p-vec3(-.29,.18,.47); la.xy*=rot(-.05);
  vec3 ra=p-vec3(.29,.18,.47); ra.xy*=rot(.05);
  float apertureL=sdRoundBox(la,vec3(.17,.038,.09),.038);
  float apertureR=sdRoundBox(ra,vec3(.17,.038,.09),.038);
  form=max(form,-min(apertureL,apertureR));

  vec3 central=p-vec3(0.,.01,.51);
  float channel=sdRoundBox(central,vec3(.035,.49,.065),.025);
  form=max(form,-channel*.72);
  return form;
}

vec3 faceNormal(vec3 p){
  float e=.006;
  vec2 h=vec2(e,0.);
  return normalize(vec3(
    faceSdf(p+h.xyy)-faceSdf(p-h.xyy),
    faceSdf(p+h.yxy)-faceSdf(p-h.yxy),
    faceSdf(p+h.yyx)-faceSdf(p-h.yyx)
  ));
}

float shellLines(vec3 raw){
  vec3 p=pose(raw);
  float longitude=abs(sin(atan(p.x,p.z)*11.));
  float latitude=abs(sin(atan(length(p.xz),p.y)*13.));
  float ribs=pow(1.-min(longitude,latitude),22.);
  float diagonal=pow(1.-abs(sin((p.x+p.y*.72-p.z*.34)*17.)),28.);
  return saturate(ribs*.72+diagonal*.38);
}

float innerLattice(vec3 raw){
  vec3 p=pose(raw)*5.4;
  float g=sin(p.x)*cos(p.y)+sin(p.y)*cos(p.z)+sin(p.z)*cos(p.x);
  float line=exp(-abs(g)*10.5);
  float n=fbm4(vec4(p*.42,uTime*.18));
  return line*(.62+.38*n);
}

float crystallineCore(vec3 raw){
  vec3 p=pose(raw);
  p.xz*=rot(uTime*.055);
  p.xy*=rot(-uTime*.037);
  float d=sdOcta(p-vec3(0.,-.02,-.04),.39);
  float shell=exp(-abs(d)*34.);
  float planes=pow(abs(sin((p.x-p.y+p.z)*19.+uTime*.7)),18.);
  return shell*(.72+.28*planes);
}

float orbitalGeometry(vec3 raw){
  vec3 p=raw;
  vec3 q1=p; q1.yz*=rot(.82+uTime*.035);
  vec3 q2=p; q2.xy*=rot(1.05-uTime*.026);
  float a=exp(-abs(sdTorus(q1,vec2(.93,.012)))*78.);
  float b=exp(-abs(sdTorus(q2,vec2(1.06,.010)))*84.);
  return a*.55+b*.42;
}

vec3 materialPalette(float shell,float inner,float core,float attention,float depth,float light){
  vec3 steel=vec3(.24,.43,.72);
  vec3 ice=vec3(.64,.82,1.0);
  vec3 pearl=vec3(.91,.95,1.0);
  vec3 warm=vec3(.91,.66,.38);
  vec3 base=mix(steel,warm,uWarmth*.54);
  base=mix(base,ice,saturate(inner*.52+depth*.22));
  base=mix(base,pearl,saturate(shell*.42+attention*.66+light*.28));
  base+=core*vec3(.16,.31,.62);
  return base;
}

void main(){
  vec2 frag=vUv*2.-1.;
  frag.x*=uResolution.x/max(uResolution.y,1.);

  vec3 ro=vec3(0.,-.015,3.35);
  vec3 rd=normalize(vec3(frag*.84,-2.42));
  float t=.88;
  vec3 accum=vec3(0.);
  float alpha=0.;

  for(int i=0;i<112;i++){
    if(i>=uSteps) break;
    vec3 p=ro+rd*t;
    float sdf=faceSdf(p);
    float shell=exp(-abs(sdf)*54.)*uCohesion;
    float innerShell=exp(-abs(sdf+.095)*34.)*.52;
    float inside=saturate(-sdf*6.5+.32);
    float lattice=innerLattice(p)*inside;
    float core=crystallineCore(p)*inside;
    float ribs=shellLines(p)*shell;

    vec3 posed=pose(p);
    float attL=gaussian(posed,vec3(-.29,.18,.43),vec3(.15,.075,.16));
    float attR=gaussian(posed,vec3(.29,.18,.43),vec3(.15,.075,.16));
    float attention=(attL+attR)*uAttention;

    float voiceZone=gaussian(posed,vec3(0.,-.48,.31),vec3(.37,.22,.24));
    float voiceWave=(sin(posed.y*18.-uTime*9.+posed.x*5.)*.5+.5)*voiceZone*uVoice;

    float mistNoise=fbm4(vec4(posed*3.1,uTime*.17));
    float volume=inside*(.025+.055*mistNoise)*uDensity;
    volume+=voiceWave*.055;

    float orbit=orbitalGeometry(p);
    float contribution=shell*.11+innerShell*.055+lattice*.038+core*.05+ribs*.10+attention*.115+volume+orbit*.06;
    contribution*=1.-alpha;
    float stepAlpha=clamp(contribution,0.,.22);

    float light=.45;
    float rim=0.;
    float spec=0.;
    if(shell>.055){
      vec3 n=faceNormal(p);
      vec3 key=normalize(vec3(-.45,.68,.58));
      vec3 fill=normalize(vec3(.54,-.18,.82));
      light=.28+.58*max(dot(n,key),0.)+.22*max(dot(n,fill),0.);
      rim=pow(1.-max(dot(n,-rd),0.),2.4);
      vec3 h=normalize(key-rd);
      spec=pow(max(dot(n,h),0.),34.);
    }

    float depth=saturate((3.05-t)*.44+.35);
    vec3 col=materialPalette(shell,lattice,core,attention,depth,light)*(uGlow+.42);
    col*=.58+.72*light;
    col+=ribs*vec3(.18,.42,.86)*1.05;
    col+=attention*vec3(.36,.72,1.28)*uGlow;
    col+=core*vec3(.15,.34,.78)*.86;
    col+=voiceWave*vec3(.42,.58,1.0)*.72;
    col+=rim*shell*vec3(.38,.58,.94)*.65;
    col+=spec*shell*vec3(1.0,.94,.82)*.72;
    col+=orbit*vec3(.20,.40,.82)*.55;

    accum+=col*stepAlpha;
    alpha+=stepAlpha;
    if(alpha>.982) break;
    t+=.036;
  }

  float radial=length(frag*vec2(.78,1.02));
  float deepHalo=exp(-radial*2.15)*.13*uGlow;
  float secondaryHalo=exp(-abs(radial-.64)*14.)*.025;
  vec3 backgroundGlow=mix(vec3(.12,.28,.58),vec3(.42,.25,.12),uWarmth*.35);
  accum+=backgroundGlow*(deepHalo+secondaryHalo);

  float vignette=1.-smoothstep(.72,1.58,radial);
  alpha*=vignette;
  accum*=.86+.14*vignette;
  outColor=vec4(accum,alpha*.985);
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
