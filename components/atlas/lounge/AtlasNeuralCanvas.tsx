"use client";

import { useEffect, useRef } from "react";
import AtlasGeometricFragments from "../presence/AtlasGeometricFragments";
import AtlasPresence4D from "../presence/AtlasPresence4D";
import { ATLAS_PRESENCE_MOTION, atlasMasterTime, createMotionFrame, seededUnit } from "../presence/presence.motion";
import type { AtlasPresenceQuality, AtlasPresenceState } from "../presence/presence.types";

export type LoungeVisualState = AtlasPresenceState;
export type LoungeQuality = AtlasPresenceQuality;

const PALETTES: Record<LoungeVisualState, [number, number, number]> = {
  idle: [218,190,145], listening: [112,198,226], thinking: [112,151,245], speaking: [151,137,244], calm: [137,189,171],
};

export default function AtlasNeuralCanvas({state,quality}:{state:LoungeVisualState;quality:LoungeQuality}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const stateRef=useRef(state);
  const qualityRef=useRef(quality);
  useEffect(()=>{stateRef.current=state;},[state]);
  useEffect(()=>{qualityRef.current=quality;},[quality]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const context=canvas.getContext("2d",{alpha:true});if(!context)return;
    let raf=0,width=0,height=0,dpr=1;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles=Array.from({length:144},(_,index)=>({
      angle:(index/144)*Math.PI*2+seededUnit(index,1)*.24,
      radius:.18+seededUnit(index,2)*.46,
      depth:.35+seededUnit(index,3)*1.05,
      size:.55+seededUnit(index,4)*1.65,
      drift:(seededUnit(index,5)-.5)*.0023,
      phase:seededUnit(index,6)*Math.PI*2,
    }));
    const resize=()=>{const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const q=reduced?"light":qualityRef.current;dpr=Math.min(window.devicePixelRatio||1,q==="ultra"?1.7:q==="balanced"?1.3:1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);};
    const draw=(now:number)=>{
      context.clearRect(0,0,width,height);
      const currentState=stateRef.current,currentQuality=reduced?"light":qualityRef.current,[r,g,b]=PALETTES[currentState],time=atlasMasterTime(now),motion=createMotionFrame(time,ATLAS_PRESENCE_MOTION[currentState]);
      const cx=width*.5,cy=height*.45,radiusBase=Math.min(width,height)*(.57+motion.depthPush*.025),activeCount=reduced?22:currentQuality==="ultra"?144:currentQuality==="balanced"?88:38;
      context.save();context.globalCompositeOperation="lighter";
      for(let ring=0;ring<5;ring+=1){const breathe=(motion.breath-.5)*4.5;const radius=radiusBase*(.46+ring*.12)+breathe*(ring+1)*.35;context.beginPath();context.arc(cx,cy,radius,0,Math.PI*2);context.strokeStyle=`rgba(${r},${g},${b},${.018+ring*.009+motion.energy*.008})`;context.lineWidth=ring===0?1:.55;context.stroke();}
      particles.slice(0,activeCount).forEach((particle,index)=>{const speed=.56+motion.energy*.34;const angle=particle.angle+time*particle.drift*60*speed;const oscillation=Math.sin(time*(.42+motion.energy*.18)+particle.phase+motion.morph*.6)*8*(.55+motion.fragmentRelease*.65);const radius=radiusBase*particle.radius*particle.depth+oscillation;const parallax=1+(particle.depth-.8)*motion.depthPush*.05;const x=cx+Math.cos(angle)*radius*parallax,y=cy+Math.sin(angle)*radius*.72*parallax;context.beginPath();context.arc(x,y,particle.size*(currentQuality==="light"?.7:1)*(1+motion.energy*.08),0,Math.PI*2);context.fillStyle=`rgba(${r},${g},${b},${Math.min((.045+.15*particle.depth)*(.62+motion.energy*.34),.34)})`;context.fill();if(currentQuality!=="light"&&index%6===0){const next=particles[(index+11)%activeCount],nextAngle=next.angle+time*next.drift*60*speed,nr=radiusBase*next.radius*next.depth,nx=cx+Math.cos(nextAngle)*nr,ny=cy+Math.sin(nextAngle)*nr*.72;if(Math.hypot(nx-x,ny-y)<radiusBase*.31){context.beginPath();context.moveTo(x,y);context.lineTo(nx,ny);context.strokeStyle=`rgba(${r},${g},${b},${.012+motion.energy*.014})`;context.lineWidth=.45;context.stroke();}}});
      context.restore();if(!reduced)raf=requestAnimationFrame(draw);
    };
    resize();draw(performance.now());window.addEventListener("resize",resize,{passive:true});return()=>{window.removeEventListener("resize",resize);cancelAnimationFrame(raf);};
  },[]);

  return <><canvas ref={canvasRef} className="atlas-neural-canvas" aria-hidden="true"/><div className="atlas-presence-layer" aria-hidden="true"><AtlasPresence4D state={state} quality={quality}/><AtlasGeometricFragments state={state} quality={quality}/></div></>;
}
