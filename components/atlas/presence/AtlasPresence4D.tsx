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
float gaussian(vec3 p,vec3 c,vec3 s){vec3 q=(p-c)/s;return exp(-dot(q,q)*2.2);}
float presenceDensity(vec3 p){
  p.x-=uLookX*.08; p.y+=uLookY*.05;
  vec3 headScale=vec3(.82,1.08,.68);
  vec3 h=p/headScale;
  float head=exp(-dot(h,h)*2.05);
  float jaw=gaussian(p,vec3(0.,-.58,.03),vec3(.53,.47,.55));
  float crown=gaussian(p,vec3(0.,.56,-.04),vec3(.68,.58,.6));
  float bilateral=gaussian(p,vec3(-.34,.12,.18),vec3(.23,.18,.34))+gaussian(p,vec3(.34,.12,.18),vec3(.23,.18,.34));
  float axis=gaussian(p,vec3(0.,-.06,.16),vec3(.16,.7,.32));
  float voiceZone=gaussian(p,vec3(0.,-.46,.21),vec3(.34,.2,.3));
  float temporal=fbm4(vec4(p*2.25,uTime*.13));
  float fine=fbm4(vec4(p*5.4+vec3(0.,uTime*.025,0.),uTime*.31));
  float coherence=mix(.58,1.12,uCohesion);
  float body=(head*.72+jaw*.22+crown*.12)*coherence;
  float structure=(bilateral*.16+axis*.06)*uAttention;
  float voice=(sin((p.y*12.-uTime*7.)+fine*4.)*.5+.5)*voiceZone*uVoice*.34;
  float turbulence=(temporal-.5)*uTurbulence*.56+(fine-.5)*uTurbulence*.16;
  return max(0.,body+structure+voice+turbulence-.18);
}
vec3 palette(float d,float eye,float neural){
  vec3 cold=vec3(.42,.67,.96);
  vec3 pearl=vec3(.88,.93,1.0);
  vec3 warm=vec3(.88,.67,.44);
  vec3 base=mix(cold,warm,uWarmth*.68);
  base=mix(base,pearl,clamp(d*.42+eye*.72,0.,1.));
  return base+neural*vec3(.12,.2,.42);
}
void main(){
  vec2 frag=vUv*2.-1.;
  frag.x*=uResolution.x/max(uResolution.y,1.);
  vec3 ro=vec3(0.,0.,3.05);
  vec3 rd=normalize(vec3(frag*.92,-2.15));
  float t=.75; vec3 accum=vec3(0.); float alpha=0.;
  for(int i=0;i<72;i++){
    if(i>=uSteps) break;
    vec3 p=ro+rd*t;
    float d=presenceDensity(p)*uDensity;
    float eyeL=gaussian(p,vec3(-.31,.17,.27),vec3(.15,.11,.22));
    float eyeR=gaussian(p,vec3(.31,.17,.27),vec3(.15,.11,.22));
    float eye=(eyeL+eyeR)*uAttention;
    float neural=pow(max(0.,sin((p.x*8.+p.y*11.+p.z*7.)+uTime*1.7+fbm4(vec4(p*3.,uTime*.2))*5.)),18.)*d;
    float stepAlpha=clamp((d*.085+eye*.11+neural*.05)*(1.-alpha),0.,.19);
    vec3 col=palette(d,eye,neural)*(uGlow+.45);
    col+=eye*vec3(.28,.6,1.15)*uGlow;
    accum+=col*stepAlpha;
    alpha+=stepAlpha;
    if(alpha>.975) break;
    t+=.046;
  }
  float vignette=1.-smoothstep(.55,1.45,length(frag));
  float halo=exp(-length(frag*vec2(.78,1.05))*2.1)*.12*uGlow;
  accum+=vec3(.2,.38,.68)*halo;
  alpha*=vignette;
  outColor=vec4(accum,alpha*.96);
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
