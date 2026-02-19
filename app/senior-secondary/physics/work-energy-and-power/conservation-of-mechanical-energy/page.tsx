"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowPathIcon, PlayIcon, PauseIcon, BeakerIcon } from "@heroicons/react/24/solid";
import { BoltIcon, SparklesIcon, FireIcon, AcademicCapIcon, ExclamationTriangleIcon, ChartBarIcon, ArrowsRightLeftIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

// --- Types ---

interface SimulationState {
    time: number;
    isPlaying: boolean;
    position: number; // Position along the track (meters)
    velocity: number; // Velocity (m/s)
    failed: boolean;  // Did the coaster fail (e.g. invalid loop)?
    failReason?: string;
}

interface PhysicsParams {
    mass: number;     // kg
    startHeight: number; // meters
    friction: boolean;
}

// --- Constants ---
const GRAVITY = 9.81;
const TRACK_LENGTH = 100; // Total track length in simulation units
const MAX_HEIGHT = 45;    // Max track height in meters
const LOOP_START = 30;    // Approx start distance of loop
const LOOP_END = 60;      // Approx end distance of loop

// --- Physics Engine Hook ---
const useCoasterPhysics = (params: PhysicsParams) => {
    const [state, setState] = useState<SimulationState>({
        time: 0,
        isPlaying: false,
        position: 0,
        velocity: 0,
        failed: false,
    });

    const requestRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number | undefined>(undefined);

    // Track Geometry Definition (Bezier-like curve mapped to distance)
    const getTrackHeight = useCallback((dist: number) => {
        const t = Math.max(0, Math.min(1, dist / TRACK_LENGTH));

        // Initial drop (High to low) 0-30m
        if (t < 0.3) {
            return MAX_HEIGHT * (0.5 + 0.5 * Math.cos(t * Math.PI / 0.3));
        }
        // Loop section 30-60m
        else if (t < 0.6) {
            const loopT = (t - 0.3) / 0.3; // 0 to 1
            const baseH = 5;
            const loopRadius = 8;
            // Circular loop: h = base + r - r*cos(angle)
            return baseH + loopRadius * (1 - Math.cos(loopT * 2 * Math.PI));
        }
        // Final bumps 60-100m
        else {
            const bumpT = (t - 0.6) / 0.4;
            return 5 + 10 * Math.sin(bumpT * Math.PI) * Math.exp(-bumpT * 2);
        }
    }, []);

    const getTrackSlope = useCallback((dist: number) => {
        const delta = 0.1;
        const h1 = getTrackHeight(dist);
        const h2 = getTrackHeight(dist + delta);
        return Math.atan2(h2 - h1, delta);
    }, [getTrackHeight]);

    const reset = () => {
        setState({
            time: 0,
            isPlaying: false,
            position: 0,
            velocity: 0,
            failed: false,
            failReason: undefined
        });
    };

    const animate = useCallback((time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = (time - previousTimeRef.current) / 1000 * 2; // 2x Speed multiplier

            setState((prev) => {
                if (!prev.isPlaying || prev.failed) return prev;

                let newPos = prev.position + prev.velocity * deltaTime;

                // Loop track
                if (newPos > TRACK_LENGTH) newPos = 0;
                else if (newPos < 0) newPos = TRACK_LENGTH;

                const currentHeight = getTrackHeight(newPos);

                // Energy Calc
                const energyLoss = params.friction ? 0.08 * prev.position * params.mass : 0;
                const totalEnergy = params.mass * GRAVITY * params.startHeight;
                const currentPE = params.mass * GRAVITY * currentHeight;
                let kineticEnergy = totalEnergy - currentPE - energyLoss;

                let newVelocity = 0;

                if (kineticEnergy > 0) {
                    newVelocity = Math.sqrt(2 * kineticEnergy / params.mass);
                } else {
                    kineticEnergy = 0;
                }

                // Fail State Detection
                if (kineticEnergy <= 0) {
                    // If inside loop and speed is 0 -> FAIL
                    if (newPos > LOOP_START && newPos < LOOP_END) {
                        return { ...prev, velocity: 0, failed: true, failReason: "Stalled in loop! Not enough energy." };
                    }
                    // If on a hill -> Rollback or Stop
                    if (newVelocity < 0.1 && newPos > 5) {
                        newVelocity = 0;
                    }
                }

                // Loop Apex Condition
                if (newPos > 42 && newPos < 48 && newVelocity < 8.8) {
                    return { ...prev, position: newPos, velocity: newVelocity, failed: true, failReason: "Fell off loop! Speed too low at apex." };
                }

                return {
                    ...prev,
                    time: prev.time + deltaTime,
                    position: newPos,
                    velocity: newVelocity,
                };
            });
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [params, getTrackHeight]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [animate]);

    return { state, setState, reset, getTrackHeight, getTrackSlope };
};

// --- Components ---

const SimulationCanvas = ({
    state,
    params,
    getTrackHeight,
    getTrackSlope
}: {
    state: SimulationState;
    params: PhysicsParams;
    getTrackHeight: (d: number) => number;
    getTrackSlope: (d: number) => number;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const resize = () => {
            if (containerRef.current) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const scaleX = canvas.width / TRACK_LENGTH;
        const scaleY = canvas.height / (MAX_HEIGHT + 5);

        // Draw Frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background - Warm Paper
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = 1;
        for (let i = 0; i < TRACK_LENGTH; i += 5) {
            const x = i * scaleX;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let h = 0; h < MAX_HEIGHT + 10; h += 5) {
            const y = canvas.height - h * scaleY;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Ground
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

        // Track
        ctx.beginPath();
        ctx.strokeStyle = params.friction ? "#64748b" : "#475569";
        ctx.lineWidth = 6;
        if (params.friction) ctx.setLineDash([10, 5]);
        else ctx.setLineDash([]);

        for (let i = 0; i <= TRACK_LENGTH; i += 0.5) {
            const x = i * scaleX;
            const y = canvas.height - getTrackHeight(i) * scaleY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Supports
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        for (let i = 0; i <= TRACK_LENGTH; i += 8) {
            const x = i * scaleX;
            const trackY = canvas.height - getTrackHeight(i) * scaleY;
            ctx.beginPath();
            ctx.moveTo(x, trackY);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Coaster Cart
        const cartX = state.position * scaleX;
        const cartY = canvas.height - getTrackHeight(state.position) * scaleY;
        const slope = getTrackSlope(state.position);

        ctx.save();
        ctx.translate(cartX, cartY);
        ctx.rotate(Math.atan2(-(getTrackHeight(state.position + 0.5) - getTrackHeight(state.position)), 0.5));

        const cartSize = 24 + Math.cbrt(params.mass);
        ctx.fillStyle = "#334155";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.fillRect(-cartSize / 2, -cartSize / 2 - 8, cartSize, cartSize / 1.6);

        ctx.fillStyle = params.friction ? "#ef4444" : "#94a3b8";
        ctx.beginPath(); ctx.arc(-cartSize / 3, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cartSize / 3, 0, 6, 0, Math.PI * 2); ctx.fill();

        if (params.friction && state.velocity > 12) {
            ctx.fillStyle = "#f59e0b";
            for (let p = 0; p < 4; p++) {
                ctx.beginPath();
                const sx = -cartSize / 2 - Math.random() * 15;
                const sy = 5 + Math.random() * 8;
                ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();

        return () => {
            window.removeEventListener('resize', resize);
        }
    }, [state, params, getTrackHeight, getTrackSlope]);

    return (
        <div ref={containerRef} className="relative w-full h-[500px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
            <canvas ref={canvasRef} className="block" />

            {/* Fail State Overlay */}
            {state.failed && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-20">
                    <div className="bg-white border border-red-200 p-6 rounded-xl shadow-xl max-w-sm text-center">
                        <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-red-700 mb-1">Simulation Failed!</h3>
                        <p className="text-red-600 text-sm mb-3">{state.failReason}</p>
                        <p className="text-xs text-slate-500">Not enough speed! Try raising the start height.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const EnergyBarChart = ({ state, params, currentHeight }: { state: SimulationState, params: PhysicsParams, currentHeight: number }) => {
    const PE = params.mass * GRAVITY * currentHeight;
    const TotalStart = params.mass * GRAVITY * params.startHeight;
    let KineticRaw = 0.5 * params.mass * state.velocity * state.velocity;
    if (state.failed && state.velocity === 0) KineticRaw = 0; // ensure 0 if failed stopped

    const Thermal = Math.max(0, TotalStart - PE - KineticRaw);
    const maxVal = TotalStart * 1.1;

    const Bar = ({ label, value, colorClass, shadowClass, heightPct }: { label: string, value: number, colorClass: string, shadowClass: string, heightPct: number }) => (
        <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end group">
            <div className="text-[10px] font-bold text-slate-500 mb-1">
                {(value / 1000).toFixed(1)}kJ
            </div>
            <div className="w-full bg-slate-100 rounded-t-md relative overflow-hidden h-32 border-b border-slate-200">
                <div
                    className={`absolute bottom-0 w-full transition-all duration-100 ease-out ${colorClass} ${shadowClass}`}
                    style={{ height: `${heightPct}%` }}
                />
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1 text-center">{label}</div>
        </div>
    );

    return (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-end justify-between gap-2 h-full">
            <Bar label="Potential" value={PE} colorClass="bg-indigo-500" shadowClass="shadow-indigo-200" heightPct={(PE / maxVal) * 100} />
            <Bar label="Kinetic" value={KineticRaw} colorClass="bg-amber-500" shadowClass="shadow-amber-200" heightPct={(KineticRaw / maxVal) * 100} />
            <Bar label="Total" value={PE + KineticRaw + Thermal} colorClass="bg-slate-700" shadowClass="" heightPct={((PE + KineticRaw + Thermal) / maxVal) * 100} />
        </div>
    );
}

const MetricsDashboard = ({ state, params, currentHeight }: { state: SimulationState, params: PhysicsParams, currentHeight: number }) => {
    const totalEnergy = params.mass * GRAVITY * params.startHeight;

    const MetricCard = ({ label, value, unit, icon: Icon, color }: any) => (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
                <p className={`text-2xl font-bold font-mono ${color}`}>{value} <span className="text-base font-sans text-slate-400">{unit}</span></p>
            </div>
            <div className={`p-3 rounded-full bg-slate-50 ${color.replace('text', 'text-opacity-20')}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <MetricCard
                label="Velocity"
                value={state.velocity.toFixed(1)}
                unit="m/s"
                icon={ArrowsRightLeftIcon}
                color="text-amber-600"
            />
            <MetricCard
                label="Height"
                value={currentHeight.toFixed(1)}
                unit="m"
                icon={ArrowUpIcon}
                color="text-indigo-600"
            />
            <MetricCard
                label="Position"
                value={state.position.toFixed(1)}
                unit="m"
                icon={ChartBarIcon}
                color="text-slate-600"
            />
            <MetricCard
                label="Total Energy"
                value={(totalEnergy / 1000).toFixed(1)}
                unit="kJ"
                icon={BoltIcon}
                color="text-emerald-600"
            />
        </div>
    );
};

// --- Main Page Component ---

export default function MechanicalEnergySimulation() {
    const [params, setParams] = useState<PhysicsParams>({
        mass: 500, // kg
        startHeight: 40, // m
        friction: false,
    });

    const { state, setState, reset, getTrackHeight } = useCoasterPhysics(params);
    const currentHeight = getTrackHeight(state.position);

    const handleReset = () => {
        reset();
        setParams(p => ({ ...p, startHeight: 40, friction: false }));
    };

    const togglePlay = () => {
        if (state.failed) reset();
        else setState(s => ({ ...s, isPlaying: !s.isPlaying }));
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-100 pb-12">

            <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-8">

                {/* Header */}
                <header className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <AcademicCapIcon className="w-8 h-8 text-indigo-600" />
                            Conservation of Mechanical Energy
                        </h1>
                        <p className="text-slate-500 mt-1">Interactive Coaster Physics Laboratory</p>
                    </div>
                </header>

                {/* Top Section: Standard Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Simulation (Fixed Height) */}
                    <div className="lg:col-span-2 h-[500px]">
                        <SimulationCanvas state={state} params={params} getTrackHeight={getTrackHeight} getTrackSlope={() => 0} />
                    </div>

                    {/* Right Column: Controls (Fixed Height with Scroll) */}
                    <div className="h-[500px] flex flex-col gap-4">

                        {/* Energy Chart - Fixed Top */}
                        <div className="flex-none h-[180px]">
                            <EnergyBarChart state={state} params={params} currentHeight={currentHeight} />
                        </div>

                        {/* Scrollable Control Panel */}
                        <div className="flex-1 bg-white border border-slate-200 p-6 rounded-xl shadow-sm overflow-y-auto custom-scrollbar">

                            <div className="flex flex-col gap-6">

                                {/* Play/Reset Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={togglePlay}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${state.isPlaying ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'}`}
                                    >
                                        {state.isPlaying ? <><PauseIcon className="w-5 h-5" /> Pause</> : <><PlayIcon className="w-5 h-5" /> Start Simulation</>}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-4 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                                        title="Reset Defaults"
                                    >
                                        <ArrowPathIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Sliders */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-slate-700">Initial Height</label>
                                            <span className="text-indigo-600 font-bold font-mono bg-indigo-50 px-2 py-1 rounded text-xs">{params.startHeight}m</span>
                                        </div>
                                        <input
                                            type="range" min="10" max="60" step="1"
                                            value={params.startHeight}
                                            onChange={(e) => {
                                                const h = Number(e.target.value);
                                                setParams(p => ({ ...p, startHeight: h }));
                                                if (!state.isPlaying) reset();
                                            }}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-slate-700">Coaster Mass</label>
                                            <span className="text-slate-600 font-bold font-mono bg-slate-100 px-2 py-1 rounded text-xs">{params.mass}kg</span>
                                        </div>
                                        <input
                                            type="range" min="100" max="2000" step="50"
                                            value={params.mass}
                                            onChange={(e) => setParams(p => ({ ...p, mass: Number(e.target.value) }))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600 hover:accent-slate-500"
                                        />
                                    </div>

                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${params.friction ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}>
                                                <FireIcon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">Friction</span>
                                        </div>
                                        <button
                                            onClick={() => setParams(p => ({ ...p, friction: !p.friction }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${params.friction ? 'bg-red-500' : 'bg-slate-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${params.friction ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Metrics Dashboard */}
                <MetricsDashboard state={state} params={params} currentHeight={currentHeight} />

                {/* Bottom Section: Educational Content */}
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-4">The Physics Behind the Coaster</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-slate-600 leading-relaxed text-lg mb-4">
                                    This simulation demonstrates the <strong>Conservation of Mechanical Energy</strong>.
                                    At the top of the initial hill, the coaster possesses maximum <span className="text-indigo-600 font-bold">Potential Energy (PE)</span>.
                                </p>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    As it drops, gravity converts this potential energy into <span className="text-amber-600 font-bold">Kinetic Energy (KE)</span>, increasing its speed.
                                    In an ideal frictionless system, the <span className="text-slate-800 font-bold">Total Energy</span> ($TE = PE + KE$) remains constant throughout the ride.
                                </p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Key Formulas</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-600">Potential Energy</span>
                                        <code className="bg-white px-2 py-1 rounded border border-slate-200 text-indigo-600 font-mono">PE = mgh</code>
                                    </li>
                                    <li className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-600">Kinetic Energy</span>
                                        <code className="bg-white px-2 py-1 rounded border border-slate-200 text-amber-600 font-mono">KE = ½mv²</code>
                                    </li>
                                    <li className="flex items-center justify-between">
                                        <span className="text-slate-600">Total Energy</span>
                                        <code className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-800 font-mono">TE = PE + KE</code>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg text-red-800 text-sm">
                                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>
                                    <strong>Why does the coaster fail?</strong> <br />
                                    If the initial height is too low, the coaster won't convert enough PE into KE to survive the loop.
                                    It requires a critical minimum speed at the top of the loop to counteract gravity and stay on the track (Centripetal Force).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 20px;
          }
        `}</style>
        </div>
    );
}
