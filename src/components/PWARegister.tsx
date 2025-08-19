'use client';
import { useEffect } from 'react';
export default function PWARegister(){
  useEffect(()=>{
    if('serviceWorker' in navigator){
      window.addEventListener('load', ()=>{
        navigator.serviceWorker.register('/sw.js').catch(console.error);
      });
    }
  },[]);
  return null;
}
