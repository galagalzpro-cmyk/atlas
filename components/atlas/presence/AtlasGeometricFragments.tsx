"use client";

import { useEffect, useRef } from "react";
import { ATLAS_PRESENCE_PRESETS } from "./presence.config";
import { ATLAS_PRESENCE_MOTION, approach, atlasMasterTime, createMotionFrame } from "./presence.motion";
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
uniform float uFormation;
uniform float uEnergy;
uniform float uDepthPush;
uniform float uStability;
uniform float uFragmentRelease;
uniform float uBreath;
uniform float uMorph;
uniform float uMicro;
out vec3 vNormal;
out float vEnergy;
out float vDepth;
out float vHash;
out float vZone;

float saturate(float x){return clamp(x,0.,1.);}
float hash11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float g2(vec2 p,vec2 c,vec2 s){vec2 q=(p-c)/s;return exp(-dot(q,q)*2.0);}

vec3 faceAnchor(float u,float v){
  float y=mix(-.88,.96,(v+1.)*.5);
  float ny=(y-.06)/1.0;
  float crossSection=sqrt(max(.018,1.-ny*ny));
  float x=u*.735*crossSection;
  float jaw=mix(.70,1.,smoothstep(-.84,-.14,y));
  x*=jaw;
  float nx=x/.735;
  float z=.595*sqrt(max(.012,1.-nx*nx-ny*ny));
  z+=g2(vec2(x,y),vec2(0.,.02),vec2(.145,.43))*.215;
  z+=g2(vec2(abs(x),y),vec2(.36,-.08),vec2(.22,.31))*.078;
  z+=g2(vec2(abs(x),y),vec2(.30,.34),vec2(.25,.13))*.044;
  z-=g2(vec2(x,y),vec2(-.28,.18),vec2(.16,.078))*.086;
  z-=g2(vec2(x,y),vec2(.28,.18),vec2(.16,.078))*.086;
  z-=g2(vec2(x,y),vec2(0.,-.48),vec2(.24,.052))*.050;
  z+=g2(vec2(x,y),vec2(0.,-.76),vec2(.23,.16))*.045;
  return vec3(x,y,z);
}

vec3 surfaceNormal(vec3 p){vec3 n=normalize(vec3(p.x/.72,(p.y-.05)/.98,max(.18,p.z/.59)));n.z+=exp(-p.x*p.x*48.)*.18;return normalize(n);}
vec3 pose(vec3 p){float focus=.78+.22*uStability;p.xz*=rot(-uLookX*.12*focus);p.yz*=rot(uLookY*.075*focus);p.x-=uLookX*.065*focus;p.y+=uLookY*.040*focus;p.z+=uDepthPush*.045;return p;}

void main(){
  float id=float(gl_InstanceID);
  float h=hash11(id+17.0),h2=hash11(id*1.731+9.2),h3=hash11(id*2.419+41.7),h4=hash11(id*3.071+5.9);
  float u=fract(id*.7548776662466927+h*.019)*2.-1.;
  float v=fract(id*.5698402909980532+h2*.017)*2.-1.;
  vec3 anchor=faceAnchor(u,v);
  vec3 n=surfaceNormal(anchor);

  float edge=smoothstep(.48,.99,abs(u));
  float left=smoothstep(-.10,.98,-u);
  float crown=smoothstep(.50,.98,v);
  float rearBias=mix(-.14,.22,h4);
  float dynamic=.5+.5*sin(uTime*(.72+.48*h2)+h*18.7+v*4.1+uMorph*1.4);
  float release=saturate(left*.42+edge*.22+crown*.22+uFragmentRelease*.82+(1.-uCohesion)*.35);
  release*=.34+.66*dynamic;

  float stateSelector=h3;
  float attachedMask=smoothstep(.40,.08,release);
  float orbitalMask=smoothstep(.48,.88,release)*smoothstep(.92,.58,h2);
  float transitionalMask=1.-max(attachedMask,orbitalMask);

  vec3 stream=normalize(vec3(-.84-.42*h2,(h-.5)*.92,.38+1.18*h3));
  float reach=release*(.11+.46*h3)*(.72+.28*sin(uTime*1.18+h2*9.4)*.5+.14);
  anchor+=stream*reach*transitionalMask;
  anchor+=vec3(cos(uTime*.34+h*6.2),sin(uTime*.29+h2*7.1),sin(uTime*.31+h3*5.8))*(.05+.15*h4)*orbitalMask;
  anchor.z+=release*release*(.10+.34*h2)+rearBias*orbitalMask;

  float breathing=(uBreath-.5)*(.018+.012*uAttention);
  anchor+=n*breathing;

  float eyeL=g2(anchor.xy,vec2(-.28,.18),vec2(.19,.095));
  float eyeR=g2(anchor.xy,vec2(.28,.18),vec2(.19,.095));
  float attention=(eyeL+eyeR)*uAttention;
  anchor.z+=attention*.032;
  release*=1.-attention*.45;

  float mouth=g2(anchor.xy,vec2(0.,-.48),vec2(.34,.19));
  float voicePulse=uVoice*mouth*(.5+.5*sin(uTime*9.8+h*5.3+uMicro*1.8));
  anchor+=n*voicePulse*.078;

  float frontField=smoothstep(.70,.98,h4)*release*uDepthPush;
  anchor.z+=frontField*(.18+.42*h3);
  anchor.xy*=1.+frontField*.055;

  anchor=mix(anchor,faceAnchor(u,v),uFormation*.10*attachedMask);
  anchor=pose(anchor);
  n=normalize(pose(n)-pose(vec3(0.)));

  vec3 up=abs(n.y)>.92?vec3(1.,0.,0.):vec3(0.,1.,0.);
  vec3 tangent=normalize(cross(up,n));
  vec3 bitangent=normalize(cross(n,tangent));
  float spin=(h-.5)*1.25+sin(uTime*.43+h2*8.)*release*.56;
  vec2 local=aPosition.xy; local*=rot(spin);
  float baseSize=mix(.0105,.031,h3);
  float size=baseSize*(1.+release*.54+attention*.24+frontField*.44);
  vec3 offset=tangent*local.x*size+bitangent*local.y*size+n*aPosition.z*size*mix(.68,1.58,h2);
  vec3 world=anchor+offset;

  float aspect=uResolution.x/max(1.,uResolution.y);
  float cameraZ=3.50-(uBreath-.5)*.035-uDepthPush*.045;
  float viewZ=max(.34,cameraZ-world.z);
  float focal=2.50;
  gl_Position=vec4(world.x*focal/aspect,world.y*focal,(viewZ-1.0)*.53,viewZ);

  vec3 localNormal=normalize(tangent*aNormal.x+bitangent*aNormal.y+n*aNormal.z);
  vNormal=localNormal;
  vEnergy=saturate(.20+release*.48+attention*.48+voicePulse*.95+uEnergy*.22);
  vDepth=saturate(1.-(viewZ-2.25)/1.65);
  vHash=h;
  vZone=attachedMask*.2+transitionalMask*.58+orbitalMask*.92+frontField*.45;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vEnergy;
in float vDepth;
in float vHash;
in float vZone;
out vec4 outColor;
uniform float uGlow;
uniform float uWarmth;
uniform float uVoice;
uniform float uEnergy;
void main(){
  vec3 n=normalize(vNormal);
  vec3 key=normalize(vec3(-.44,.72,.54));
  vec3 fill=normalize(vec3(.60,-.18,.78));
  float light=.20+.68*max(dot(n,key),0.)+.22*max(dot(n,fill),0.);
  float rim=pow(1.-max(n.z,0.),2.0);
  float spec=pow(max(dot(n,normalize(key+vec3(0.,0.,1.))),0.),38.);
  vec3 steel=vec3(.09,.23,.49),ice=vec3(.48,.76,1.0),pearl=vec3(.95,.98,1.0),gold=vec3(.92,.66,.35);
  vec3 color=mix(steel,ice,.34+vDepth*.42+vEnergy*.20);
  color=mix(color,gold,uWarmth*.13*(.35+vHash*.65));
  color=mix(color,pearl,spec*.50+vEnergy*.16);
  color*=.62+.80*light;
  color+=rim*vec3(.22,.49,.98)*(.46+.36*uGlow);
  color+=vEnergy*vec3(.12,.31,.72)*(.30+.22*uGlow+.12*uEnergy);
  color+=vZone*vec3(.08,.18,.42)*.30;
  color+=uVoice*vec3(.10,.18,.40)*.11;
  float alpha=clamp(.52+vDepth*.24+vEnergy*.18+vZone*.08,0.,.97);
  outColor=vec4(color,alpha);
}`;

function compile(gl:WebGL2RenderingContext,type:number,source:string){const shader=gl.createShader(type);if(!shader)throw new Error("ATLAS geometric shader unavailable");gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader)||"ATLAS geometric shader compilation failed";gl.deleteShader(shader);throw new Error(message);}return shader;}
function cubeGeometry(){const positions:number[]=[],normals:number[]=[];const faces:[number[],number[][]][]=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,-1,1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,-1,-1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,-1],[1,-1,1],[-1,-1,1]]]];for(const[normal,vertices]of faces){for(const vertex of vertices){positions.push(vertex[0]*.5,vertex[1]*.5,vertex[2]*.5);normals.push(normal[0],normal[1],normal[2]);}}return{positions:new Float32Array(positions),normals:new Float32Array(normals)};}

export default function AtlasGeometricFragments({state,quality}:{state:AtlasPresenceState;quality:AtlasPresenceQuality}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);const stateRef=useRef(state);const qualityRef=useRef(quality);
  useEffect(()=>{stateRef.current=state;},[state]);useEffect(()=>{qualityRef.current=quality;},[quality]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,powerPreference:"high-performance",premultipliedAlpha:true});if(!gl){canvas.dataset.fallback="true";return;}
    const vertex=compile(gl,gl.VERTEX_SHADER,VERTEX_SHADER),fragment=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT_SHADER),program=gl.createProgram();if(!program)return;gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||"ATLAS geometric program link failed");
    const geometry=cubeGeometry(),positionBuffer=gl.createBuffer(),normalBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,geometry.positions,gl.STATIC_DRAW);const aPosition=gl.getAttribLocation(program,"aPosition");gl.enableVertexAttribArray(aPosition);gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);gl.bufferData(gl.ARRAY_BUFFER,geometry.normals,gl.STATIC_DRAW);const aNormal=gl.getAttribLocation(program,"aNormal");gl.enableVertexAttribArray(aNormal);gl.vertexAttribPointer(aNormal,3,gl.FLOAT,false,0,0);
    const U=(name:string)=>gl.getUniformLocation(program,name);const uniforms={resolution:U("uResolution"),time:U("uTime"),cohesion:U("uCohesion"),turbulence:U("uTurbulence"),attention:U("uAttention"),voice:U("uVoice"),lookX:U("uLookX"),lookY:U("uLookY"),glow:U("uGlow"),warmth:U("uWarmth"),formation:U("uFormation"),energy:U("uEnergy"),depthPush:U("uDepthPush"),stability:U("uStability"),fragmentRelease:U("uFragmentRelease"),breath:U("uBreath"),morph:U("uMorph"),micro:U("uMicro")};
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let raf=0,dead=false,width=1,height=1;const current={...ATLAS_PRESENCE_PRESETS[stateRef.current]},motion={...ATLAS_PRESENCE_MOTION[stateRef.current]};
    const resize=()=>{const rect=canvas.getBoundingClientRect(),q=reduced?"light":qualityRef.current,maxDpr=q==="ultra"?1.65:q==="balanced"?1.35:1,scale=q==="ultra"?.92:q==="balanced"?.80:.66,dpr=Math.min(window.devicePixelRatio||1,maxDpr)*scale;width=Math.max(1,Math.round(rect.width*dpr));height=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}};
    const draw=(now:number)=>{if(dead)return;resize();const target=ATLAS_PRESENCE_PRESETS[stateRef.current],motionTarget=ATLAS_PRESENCE_MOTION[stateRef.current];current.cohesion=approach(current.cohesion,target.cohesion,.034);current.turbulence=approach(current.turbulence,target.turbulence,.030);current.attention=approach(current.attention,target.attention,.038);current.glow=approach(current.glow,target.glow,.032);current.warmth=approach(current.warmth,target.warmth,.026);motion.formation=approach(motion.formation,motionTarget.formation,.032);motion.energy=approach(motion.energy,motionTarget.energy,.034);motion.depthPush=approach(motion.depthPush,motionTarget.depthPush,.026);motion.stability=approach(motion.stability,motionTarget.stability,.030);motion.fragmentRelease=approach(motion.fragmentRelease,motionTarget.fragmentRelease,.028);motion.breathRate=approach(motion.breathRate,motionTarget.breathRate,.018);motion.morphRate=approach(motion.morphRate,motionTarget.morphRate,.018);motion.microRate=approach(motion.microRate,motionTarget.microRate,.018);
      const time=atlasMasterTime(now),frame=createMotionFrame(time,motion),stage=canvas.closest<HTMLElement>(".atlas-sanctuary"),styles=stage?getComputedStyle(stage):null,voice=Number.parseFloat(styles?.getPropertyValue("--voice-level")||"0")||0,lookX=Number.parseFloat(styles?.getPropertyValue("--look-x")||"0")||0,lookY=Number.parseFloat(styles?.getPropertyValue("--look-y")||"0")||0,q=reduced?"light":qualityRef.current,instances=q==="ultra"?5600:q==="balanced"?3000:920;
      gl.useProgram(program);gl.uniform2f(uniforms.resolution,width,height);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.cohesion,current.cohesion);gl.uniform1f(uniforms.turbulence,current.turbulence);gl.uniform1f(uniforms.attention,current.attention);gl.uniform1f(uniforms.voice,voice);gl.uniform1f(uniforms.lookX,lookX);gl.uniform1f(uniforms.lookY,lookY);gl.uniform1f(uniforms.glow,current.glow);gl.uniform1f(uniforms.warmth,current.warmth);gl.uniform1f(uniforms.formation,frame.formation);gl.uniform1f(uniforms.energy,frame.energy);gl.uniform1f(uniforms.depthPush,frame.depthPush);gl.uniform1f(uniforms.stability,frame.stability);gl.uniform1f(uniforms.fragmentRelease,frame.fragmentRelease);gl.uniform1f(uniforms.breath,frame.breath);gl.uniform1f(uniforms.morph,frame.morph);gl.uniform1f(uniforms.micro,frame.micro);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawArraysInstanced(gl.TRIANGLES,0,36,instances);if(!reduced)raf=requestAnimationFrame(draw);};
    resize();draw(performance.now());window.addEventListener("resize",resize,{passive:true});return()=>{dead=true;cancelAnimationFrame(raf);window.removeEventListener("resize",resize);if(positionBuffer)gl.deleteBuffer(positionBuffer);if(normalBuffer)gl.deleteBuffer(normalBuffer);gl.deleteProgram(program);};
  },[]);
  return <canvas ref={canvasRef} className="atlas-geometric-fragments" aria-hidden="true"/>;
}
