"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { MapPin, Loader2, CheckCircle, SlidersHorizontal, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

// Carrega o mapa apenas no cliente
const MapaEscola = dynamic(() => import("@/components/gestor/MapaEscola").then(mod => mod.default), { ssr: false });

export default function EscolaCadastroPage() {
  const [escolaId, setEscolaId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "EE Professor Eurípedes Simões de Paula",
    endereco: "R. Maria Pape, 30 - Jardim Lucélia",
    horarioEntrada: "14:15",
    horarioSaida: "21:15",
    raio: 100,
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [capturando, setCapturando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadEscola() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("escolas").select("*").limit(1).single();
        if (data) {
          setEscolaId(data.id);
          setForm({
            nome: data.nome || "EE Professor Eurípedes Simões de Paula",
            endereco: data.endereco || "R. Maria Pape, 30 - Jardim Lucélia",
            horarioEntrada: (data.horario_entrada ? String(data.horario_entrada).substring(0,5) : "14:15"),
            horarioSaida: (data.horario_saida ? String(data.horario_saida).substring(0,5) : "21:15"),
            raio: Number(data.raio_metros) || 100,
          });
          if (data.lat && data.lng) {
            setCoords({ lat: -23.7613199, lng: -46.6735803 });
          }
        }
      } catch (err: any) {
        if (err.code !== "PGRST116") {
          console.error(err);
        }
      } finally {
        setLoadingData(false);
      }
    }
    loadEscola();
  }, []);

  const capturarGPS = useCallback(() => {
    setCapturando(true);
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada neste navegador.");
      setCapturando(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: Number(pos.coords.latitude), lng: Number(pos.coords.longitude) });
        setCapturando(false);
      },
      () => {
        setCoords({ lat: -23.5505, lng: -46.6333 });
        setCapturando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!coords) { alert("Capture a geolocalização primeiro!"); return; }
    
    setSalvo(true);
    try {
      const supabase = createClient();
      if (escolaId) {
        await supabase.from("escolas").update({
          nome: form.nome,
          endereco: form.endereco,
          horario_entrada: form.horarioEntrada,
          horario_saida: form.horarioSaida,
          raio_metros: form.raio,
          lat: coords.lat,
          lng: coords.lng
        }).eq("id", escolaId);
      } else {
        const { data } = await supabase.from("escolas").insert({
          nome: form.nome,
          endereco: form.endereco,
          horario_entrada: form.horarioEntrada,
          horario_saida: form.horarioSaida,
          raio_metros: form.raio,
          lat: coords.lat,
          lng: coords.lng
        }).select().single();
        if (data) setEscolaId(data.id);
      }
      setTimeout(() => setSalvo(false), 3000);
    } catch(err) {
      alert("Erro ao salvar.");
      setSalvo(false);
    }
  }

  if (loadingData) return <div className="p-8 text-center text-slate-500 font-bold">Carregando dados da escola...</div>;
  if (errorMsg) return <div className="p-8 text-red-500">{errorMsg}</div>;

  return (
    <div className="app-shell min-h-screen bg-slate-50 pb-24">
      <header className="px-4 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/gestor/relatorios" className="p-1 -ml-2 rounded-full hover:bg-slate-100">
            <ChevronRight size={24} className="text-slate-600 rotate-180" />
          </Link>
          <h1 className="font-semibold text-slate-800">Configuração da Escola</h1>
        </div>
      </header>

      <form onSubmit={handleSalvar} className="p-4 flex flex-col gap-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nome da Escola</label>
            <input 
              type="text" 
              value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Endereço Completo</label>
            <input 
              type="text" 
              value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal size={20} className="text-purple-600" />
            <h2 className="font-bold text-slate-800">Horários Padrão</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Entrada</label>
              <input 
                type="time" 
                value={form.horarioEntrada} onChange={e => setForm({...form, horarioEntrada: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Saída</label>
              <input 
                type="time" 
                value={form.horarioSaida} onChange={e => setForm({...form, horarioSaida: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-purple-600" />
              <h2 className="font-bold text-slate-800">Cerca Virtual</h2>
            </div>
            <button 
              type="button"
              onClick={capturarGPS}
              className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 transition"
            >
              Capturar GPS Atual
            </button>
          </div>

          {coords ? (
            <div className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
              <MapaEscola lat={Number(coords.lat)} lng={Number(coords.lng)} raio={form.raio} />
              <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                Lat: {Number(coords.lat).toFixed(6)} | Lng: {Number(coords.lng).toFixed(6)}
              </div>
            </div>
          ) : (
            <div className="w-full h-48 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
              {capturando ? <Loader2 size={24} className="animate-spin text-purple-500" /> : <MapPin size={24} />}
              <span className="text-sm font-medium">{capturando ? "Obtendo localização..." : "Nenhuma coordenada capturada"}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
              <span>Raio de Tolerância (metros)</span>
              <span className="text-purple-600">{form.raio}m</span>
            </label>
            <input 
              type="range" 
              min="50" max="500" step="10"
              value={form.raio} onChange={e => setForm({...form, raio: Number(e.target.value)})}
              className="w-full accent-purple-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Alunos precisam estar dentro deste raio para a presença ser validada pelo aplicativo.
            </p>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          {salvo ? <><CheckCircle size={20}/> Salvo no Servidor!</> : "Salvar Configurações"}
        </button>
      </form>
    </div>
  );
}