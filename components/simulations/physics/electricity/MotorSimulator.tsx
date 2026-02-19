"use client"
import { useRef, useEffect, useState } from "react"

export default function MotorSimulator(){

 const canvasRef = useRef<HTMLCanvasElement>(null)

 const [running,setRunning] = useState(false)
 const [current,setCurrent] = useState(2)
 const angleRef = useRef(0)

 useEffect(()=>{

  const canvas = canvasRef.current!
  const ctx = canvas.getContext("2d")!

  function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height)

    ctx.save()
    ctx.translate(250,200)
    ctx.rotate(angleRef.current)

    ctx.strokeStyle="cyan"
    ctx.lineWidth=8

    ctx.beginPath()
    ctx.moveTo(-80,0)
    ctx.lineTo(80,0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0,-80)
    ctx.lineTo(0,80)
    ctx.stroke()

    ctx.restore()

    ctx.strokeStyle="white"
    ctx.strokeRect(170,120,160,160)
  }

  function animate(){
    if(running){
      angleRef.current += 0.02*current
    }
    draw()
    requestAnimationFrame(animate)
  }

  animate()

 },[running,current])

 return(
  <div style={{textAlign:"center"}}>
    <canvas ref={canvasRef} width={500} height={400} style={{background:"#111"}}/>

    <div style={{marginTop:20}}>

      Current:
      <input
       type="range"
       min="0"
       max="10"
       step="0.1"
       value={current}
       onChange={e=>setCurrent(parseFloat(e.target.value))}
      />

      <br/><br/>

      <button onClick={()=>setRunning(true)}>Play</button>
      <button onClick={()=>setRunning(false)}>Pause</button>
      <button onClick={()=>{angleRef.current=0;setRunning(false)}}>Reset</button>

    </div>
  </div>
 )
}
