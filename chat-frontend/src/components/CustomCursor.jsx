import React, { useEffect } from "react";

export default function CustomCursor(){
  useEffect(()=>{
    const dot = document.createElement('div');
    const ring = document.createElement('div');

    Object.assign(dot.style, {
      position:'fixed', width:'8px', height:'8px', borderRadius:'50%', background:'#111', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9999
    });
    Object.assign(ring.style, {
      position:'fixed', width:'36px', height:'36px', border:'1px solid rgba(0,0,0,0.5)', borderRadius:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9998, transition:'width .14s,height .14s'
    });

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    const onMove = (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px';
    };

    function animate(){
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px';
      requestAnimationFrame(animate);
    }
    animate();

    function onEnter(){
      ring.style.width = '64px'; ring.style.height = '64px'; ring.style.borderColor = 'rgba(0,0,0,0.9)'; dot.style.transform='translate(-50%,-50%) scale(.6)';
    }
    function onLeave(){
      ring.style.width = '36px'; ring.style.height = '36px'; ring.style.borderColor = 'rgba(0,0,0,0.5)'; dot.style.transform='translate(-50%,-50%) scale(1)';
    }

    document.addEventListener('mousemove', onMove);
    document.querySelectorAll('button,input,textarea,a').forEach(el=>{
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    const obs = new MutationObserver(()=> {
      document.querySelectorAll('button,input,textarea,a').forEach(el=>{
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    });
    obs.observe(document.body, { childList:true, subtree:true });

    return ()=>{ document.removeEventListener('mousemove', onMove); dot.remove(); ring.remove(); obs.disconnect(); };
  }, []);

  return null;
}
