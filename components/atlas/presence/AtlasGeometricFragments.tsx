"use client";

import { useEffect, useRef } from "react";
import { ATLAS_PRESENCE_PRESETS } from "./presence.config";
import type { AtlasPresenceQuality, AtlasPresenceState } from "./presence.types";

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
uniform vec2 uResolution;
uniform float uTime;
uniform float uCohesion;
uniform float uTurbulence;
uniform float uAttention;
uniform float uVoice;
uniform float uLookX;
uniform float uLookY;
out vec3 vNormal;
out float vEnergy;
out float vDepth;
out float vHash;

float saturate(float x){return clamp(x,0.,1.);}
float hash11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float g2(vec2 p,vec2 c,vec2 s){vec2 q=(p-c)/s;return exp(-dot(q,q)*2.0);}

vec3 faceAnchor(float u,float v){
  float y=mix(-.86,.93,(v+1.)*.5);
  float ny=(y-.06)/.98;
  float crossSection=sqrt(max(.018,1.-ny*ny));
  float x=u*.73*crossSection;
  float jaw=mix(.72,1.,smoothstep(-.82,-.16,y));
  x*=jaw;
  float nx=x/.73;
  float z=.58*sqrt(max(.012,1.-nx*nx-ny*ny));
  z+=g2(vec2(x,y),vec2(0.,.01),vec2(.15,.42))*.205;
  z+=g2(vec2(abs(x),y),vec2(.35,-.08),vec2(.22,.31))*.072;
  z+=g2(vec2(abs(x),y),vec2(.30,.34),vec2(.25,.13))*.038;
  z-=g2(vec2(x,y),vec2(-.27,.18),vec2(.16,.08))*.080;
  z-=g2(vec2(x,y),vec2(.27,.18),vec2(.16,.08))*.080;
  z-=g2(vec2(x,y),vec2(0.,-.47),vec2(.24,.055))*.047;
  z+=g2(vec2(x,y),vec2(0.,-.75),vec2(.23,.16))*.040;
  return vec3(x,y,z);
}

vec3 surfaceNormal(vec3 p){
  vec3 n=normalize(vec3(p.x/.72,(p.y-.05)/.96,max(.18,p.z/.58)));
  n.z+=exp(-p.x*p.x*48.)*.18;
  return normalize(n);
}

vec3 pose(vec3 p){
  p.xz*=rot(-uLookX*.12);
  p.yz*=rot(uLookY*.075);
  p.x-=uLookX*.065;
  p.y+=uLookY*.040;
  return p;
}

void main(){
  float id=float(gl_InstanceID);
  float h=hash11(id+17.0);
  float h2=hash11(id*1.731+9.2);
  float h3=hash11(id*2.419+41.7);
  float u=fract(id*.7548776662466927+h*.019)*2.-1.;
  float v=fract(id*.5698402909980532+h2*.017)*2.-1.;
  vec3 anchor=faceAnchor(u,v);
  vec3 n=surfaceNormal(anchor);

  float leftDissolve=smoothstep(-.15,.96,-u);
  float edgeDissolve=smoothstep(.54,.99,abs(u));
  float crownDissolve=smoothstep(.55,.96,v)*.34;
  float dynamic=(.5+.5*sin(uTime*1.38+h*18.7+v*4.1));
  float scatter=saturate(leftDissolve*.46+edgeDissolve*.20+crownDissolve+(1.-uCohesion)*.72+uTurbulence*.16);
  scatter*=.48+.52*dynamic;

  vec3 stream=normalize(vec3(-.82-.34*h2,(h-.5)*.82,.46+.95*h3));
  float wave=.5+.5*sin(uTime*1.72+h2*11.4+anchor.y*6.2);
  float reach=scatter*(.10+.34*h3)*(.72+.28*wave);
  anchor+=stream*reach;
  anchor.z+=scatter*scatter*(.08+.23*h2);

  float breathing=sin(uTime*.76+h*.8)*(.006+.005*uAttention);
  anchor+=n*breathing;

  float mouth=g2(anchor.xy,vec2(0.,-.47),vec2(.34,.19));
  float voicePulse=uVoice*mouth*(.5+.5*sin(uTime*10.2+h*5.3));
  anchor+=n*voicePulse*.065;

  float eyeL=g2(anchor.xy,vec2(-.27,.18),vec2(.20,.10));
  float eyeR=g2(anchor.xy,vec2(.27,.18),vec2(.20,.10));
  float attention=(eyeL+eyeR)*uAttention;
  anchor.z+=attention*.025;

  anchor=pose(anchor);
  n=normalize(pose(n)-pose(vec3(0.)));

  vec3 up=abs(n.y)>.92?vec3(1.,0.,0.):vec3(0.,1.,0.);
  vec3 tangent=normalize(cross(up,n));
  vec3 bitangent=normalize(cross(n,tangent));
  float spin=(h-.5)*1.25+sin(uTime*.43+h2*8.)*scatter*.44;
  vec2 local=aPosition.xy;
  local*=rot(spin);
  float size=mix(.014,.033,h3)*(1.+scatter*.46+attention*.22);
  vec3 offset=tangent*local.x*size+bitangent*local.y*size+n*aPosition.z*size*mix(.72,1.48,h2);
  vec3 world=anchor+offset;

  float aspect=uResolution.x/max(1.,uResolution.y);
  float cameraZ=3.55;
  float viewZ=max(.35,cameraZ-world.z);
  float focal=2.42;
  gl_Position=vec4(world.x*focal/aspect,world.y*focal,(viewZ-1.0)*.54,viewZ);

  vec3 localNormal=normalize(tangent*aNormal.x+bitangent*aNormal.y+n*aNormal.z);
  vNormal=localNormal;
  vEnergy=saturate(.24+scatter*.55+attention*.45+voicePulse*.9);
  vDepth=saturate(1.-(viewZ-2.35)/1.55);
  vHash=h;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vEnergy;
in float vDepth;
in float vHash;
out vec4 outColor;
uniform float uGlow;
uniform float uWarmth;
uniform float uVoice;
void main(){
  vec3 n=normalize(vNormal);
  vec3 key=normalize(vec3(-.44,.72,.54));
  vec3 fill=normalize(vec3(.60,-.18,.78));
  float light=.22+.66*max(dot(n,key),0.)+.20*max(dot(n,fill),0.);
  float rim=pow(1.-max(n.z,0.),2.2);
  float spec=pow(max(dot(n,normalize(key+vec3(0.,0.,1.))),0.),34.);
  vec3 steel=vec3(.11,.27,.54);
  vec3 ice=vec3(.48,.75,1.0);
  vec3 pearl=vec3(.94,.97,1.0);
  vec3 gold=vec3(.92,.66,.35);
  vec3 color=mix(steel,ice,.38+vDepth*.38+vEnergy*.18);
  color=mix(color,gold,uWarmth*.16*(.35+vHash*.65));
  color=mix(color,pearl,spec*.44+vEnergy*.18);
  color*=.64+.74*light;
  color+=rim*vec3(.22,.48,.96)*(.42+.34*uGlow);
  color+=vEnergy*vec3(.13,.30,.68)*(.28+.18*uGlow);
  color+=uVoice*vec3(.10,.17,.38)*.10;
  float alpha=clamp(.58+vDepth*.22+vEnergy*.16,0.,.96);
  outColor=vec4(color,alpha);
}`;

function compile(gl: WebGL2RenderingContext,type:number,source:string){
  const shader=gl.createShader(type);
  if(!shader) throw new Error("ATLAS geometric shader unavailable");
  gl.shaderSource(shader,source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
    const message=gl.getShaderInfoLog(shader)||"ATLAS geometric shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function cubeGeometry(){
  const positions:number[]=[];
  const normals:number[]=[];
  const faces:[number[],number[][]][]=[
    [[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,-1,1],[1,1,1],[-1,1,1]]],
    [[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1]]],
    [[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,-1,1],[1,1,-1],[1,1,1]]],
    [[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,-1,-1],[-1,1,1],[-1,1,-1]]],
    [[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,1],[1,1,-1],[-1,1,-1]]],
    [[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,-1],[1,-1,1],[-1,-1,1]]],
  ];
  for(const [normal,vertices] of faces){
    for(const vertex of vertices){positions.push(vertex[0]*.5,vertex[1]*.5,vertex[2]*.5);normals.push(normal[0],normal[1],normal[2]);}
  }
  return {positions:new Float32Array(positions),normals:new Float32Array(normals)};
}

export default function AtlasGeometricFragments({state,quality}:{state:AtlasPresenceState;quality:AtlasPresenceQuality}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const stateRef=useRef(state);
  const qualityRef=useRef(quality);
  useEffect(()=>{stateRef.current=state;},[state]);
  useEffect(()=>{qualityRef.current=quality;},[quality]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,powerPreference:"high-performance",premultipliedAlpha:true});
    if(!gl){canvas.dataset.fallback="true";return;}

    const vertex=compile(gl,gl.VERTEX_SHADER,VERTEX_SHADER);
    const fragment=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT_SHADER);
    const program=gl.createProgram();
    if(!program) return;
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)||"ATLAS geometric program link failed");

    const geometry=cubeGeometry();
    const positionBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,geometry.positions,gl.STATIC_DRAW);
    const aPosition=gl.getAttribLocation(program,"aPosition");
    gl.enableVertexAttribArray(aPosition);gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,0,0);
    const normalBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);gl.bufferData(gl.ARRAY_BUFFER,geometry.normals,gl.STATIC_DRAW);
    const aNormal=gl.getAttribLocation(program,"aNormal");
    gl.enableVertexAttribArray(aNormal);gl.vertexAttribPointer(aNormal,3,gl.FLOAT,false,0,0);

    const U=(name:string)=>gl.getUniformLocation(program,name);
    const uniforms={resolution:U("uResolution"),time:U("uTime"),cohesion:U("uCohesion"),turbulence:U("uTurbulence"),attention:U("uAttention"),voice:U("uVoice"),lookX:U("uLookX"),lookY:U("uLookY"),glow:U("uGlow"),warmth:U("uWarmth")};
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf=0,dead=false,width=1,height=1;
    const current={...ATLAS_PRESENCE_PRESETS[stateRef.current]};
    const lerp=(a:number,b:number,k:number)=>a+(b-a)*k;
    const resize=()=>{
      const rect=canvas.getBoundingClientRect();
      const q=reduced?"light":qualityRef.current;
      const maxDpr=q==="ultra"?1.65:q==="balanced"?1.35:1;
      const scale=q==="ultra"?.92:q==="balanced"?.80:.66;
      const dpr=Math.min(window.devicePixelRatio||1,maxDpr)*scale;
      width=Math.max(1,Math.round(rect.width*dpr));height=Math.max(1,Math.round(rect.height*dpr));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
    };
    const draw=(now:number)=>{
      if(dead) return;
      resize();
      const target=ATLAS_PRESENCE_PRESETS[stateRef.current];
      current.cohesion=lerp(current.cohesion,target.cohesion,.035);
      current.turbulence=lerp(current.turbulence,target.turbulence,.030);
      current.attention=lerp(current.attention,target.attention,.040);
      current.glow=lerp(current.glow,target.glow,.032);
      current.warmth=lerp(current.warmth,target.warmth,.028);
      const stage=canvas.closest<HTMLElement>(".atlas-sanctuary");
      const styles=stage?getComputedStyle(stage):null;
      const voice=Number.parseFloat(styles?.getPropertyValue("--voice-level")||"0")||0;
      const lookX=Number.parseFloat(styles?.getPropertyValue("--look-x")||"0")||0;
      const lookY=Number.parseFloat(styles?.getPropertyValue("--look-y")||"0")||0;
      const q=reduced?"light":qualityRef.current;
      const instances=q==="ultra"?3200:q==="balanced"?1750:760;

      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution,width,height);gl.uniform1f(uniforms.time,now*.001);
      gl.uniform1f(uniforms.cohesion,current.cohesion);gl.uniform1f(uniforms.turbulence,current.turbulence);gl.uniform1f(uniforms.attention,current.attention);
      gl.uniform1f(uniforms.voice,voice);gl.uniform1f(uniforms.lookX,lookX);gl.uniform1f(uniforms.lookY,lookY);gl.uniform1f(uniforms.glow,current.glow);gl.uniform1f(uniforms.warmth,current.warmth);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.drawArraysInstanced(gl.TRIANGLES,0,36,instances);
      if(!reduced) raf=requestAnimationFrame(draw);
    };
    resize();draw(performance.now());
    window.addEventListener("resize",resize,{passive:true});
    return()=>{dead=true;cancelAnimationFrame(raf);window.removeEventListener("resize",resize);if(positionBuffer)gl.deleteBuffer(positionBuffer);if(normalBuffer)gl.deleteBuffer(normalBuffer);gl.deleteProgram(program);};
  },[]);

  return <canvas ref={canvasRef} className="atlas-geometric-fragments" aria-hidden="true"/>;
}
