"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, Save, Plus, AlertCircle, CheckCircle, Calculator } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NotaRow {
  id?: string;
  materia: string;
  b1: number | "";
  b2: number | "";
  b3: number | "";
  b4: number | "";
}

export default function NotasPage() {
  const [notas, setNotas] = useState<NotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    carregarNotas();
  }, []);

  async function carregarNotas() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: aluno } = await supabase.from("alunos").select("id").eq("user_id", user.id).single();
    if (aluno) {
      const { data: notasData } = await supabase.from("notas").select("*").eq("aluno_id", aluno.id);
      if (notasData && notasData.length > 0) {
        setNotas(notasData);
      } else {
        setNotas([
          { materia: "Matemática", b1: "", b2: "", b3: "", b4: "" },
          { materia: "Português", b1: "", b2: "", b3: "", b4: "" },
          { materia: "História", b1: "", b2: "", b3: "", b4: "" },
          { materia: "Geografia", b1: "", b2: "", b3: "", b4: "" },
          { materia: "Ciências", b1: "", b2: "", b3: "", b4: "" }
        ]);
      }
    }
    setLoading(false);
  }

  function handleNotaChange(index: number, campo: keyof NotaRow, valor: string) {
    const novas = [...notas];
    if (campo === "materia") {
      novas[index].materia = valor;
    } else {
      let num = parseFloat(valor.replace(",", "."));
      if (isNaN(num)) (novas[index] as any)[campo] = "";
      else if (num > 10) (novas[index] as any)[campo] = 10;
      else if (num < 0) (novas[index] as any)[campo] = 0;
      else (novas[index] as any)[campo] = num;
    }
    setNotas(novas);
  }

  function addMateria() {
    setNotas([...notas, { materia: "Nova Matéria", b1: "", b2: "", b3: "", b4: "" }]);
  }

  async function salvarNotas() {
    setSaving(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: aluno } = await supabase.from("alunos").select("id").eq("user_id", user.id).single();
      if (aluno) {
        for (const n of notas) {
          if (n.id) {
            await supabase.from("notas").update({
              materia: n.materia,
              b1: n.b1 === "" ? null : n.b1,
              b2: n.b2 === "" ? null : n.b2,
              b3: n.b3 === "" ? null : n.b3,
              b4: n.b4 === "" ? null : n.b4,
            }).eq("id", n.id);
          } else {
            await supabase.from("notas").insert({
              aluno_id: aluno.id,
              materia: n.materia,
              b1: n.b1 === "" ? null : n.b1,
              b2: n.b2 === "" ? null : n.b2,
              b3: n.b3 === "" ? null : n.b3,
              b4: n.b4 === "" ? null : n.b4,
            });
          }
        }
        
        // Calcular media geral para salvar no perfil do aluno
        let somaMedias = 0;
        let qtdMaterias = 0;
        
        for(const n of notas) {
          let soma = 0;
          let qtd = 0;
          if (n.b1 !== "") { soma += Number(n.b1); qtd++; }
          if (n.b2 !== "") { soma += Number(n.b2); qtd++; }
          if (n.b3 !== "") { soma += Number(n.b3); qtd++; }
          if (n.b4 !== "") { soma += Number(n.b4); qtd++; }
          
          if (qtd > 0) {
            somaMedias += soma;
            qtdMaterias++;
          }
        }
        
        if (qtdMaterias > 0) {
          const mediaGeral = somaMedias / qtdMaterias;
          await supabase.from("alunos").update({ media: mediaGeral }).eq("id", aluno.id);
        }

        setMessage("Boletim salvo com sucesso!");
        setTimeout(() => setMessage(""), 3000);
      }
    }
    setSaving(false);
  }

  function getSituacao(media: number, qtd: number) {
    if (qtd === 0) return { label: "Sem notas", color: "text-slate-500", bg: "bg-slate-100" };
    if (media >= 6 * qtd) return { label: "Aprovado / Regular", color: "text-green-700", bg: "bg-green-100" };
    if (media >= 4 * qtd) return { label: "Atenção", color: "text-yellow-700", bg: "bg-yellow-100" };
    return { label: "Risco", color: "text-red-700", bg: "bg-red-100" };
  }

  // Calculate Media Geral
  let somaTotalMedias = 0;
  let materiatotal = 0;
  notas.forEach(n => {
    let soma = 0;
    let qtd = 0;
    if (n.b1 !== "") { soma += Number(n.b1); qtd++; }
    if (n.b2 !== "") { soma += Number(n.b2); qtd++; }
    if (n.b3 !== "") { soma += Number(n.b3); qtd++; }
    if (n.b4 !== "") { soma += Number(n.b4); qtd++; }
    if (qtd > 0) {
      somaTotalMedias += soma;
      materiatotal++;
    }
  });
  const mediaGeral = somaTotalMedias.toFixed(1);

  return (
    <div className="app-shell min-h-screen bg-slate-50">
      <header className="flex items-center px-4 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <Link href="/aluno/dashboard" className="p-2 -ml-2 rounded-full hover:bg-slate-100">
          <ChevronLeft size={24} className="text-slate-600" />
        </Link>
        <h1 className="font-bold text-slate-800 ml-2">Boletim Escolar</h1>
      </header>

      <div className="p-4 flex flex-col gap-4 pb-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Pontuação Total</p>
            <h2 className="text-4xl font-black mt-1">{mediaGeral} <span className="text-sm font-medium text-blue-200">pts</span></h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Calculator size={32} className="text-white" />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-8 font-medium">Carregando notas...</p>
        ) : (
          <div className="space-y-4">
            {notas.map((nota, idx) => {
              let soma = 0;
              let qtd = 0;
              if (nota.b1 !== "") { soma += Number(nota.b1); qtd++; }
              if (nota.b2 !== "") { soma += Number(nota.b2); qtd++; }
              if (nota.b3 !== "") { soma += Number(nota.b3); qtd++; }
              if (nota.b4 !== "") { soma += Number(nota.b4); qtd++; }
              
              const media = soma;
              const situacao = getSituacao(media, qtd);

              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <input
                    type="text"
                    value={nota.materia}
                    onChange={(e) => handleNotaChange(idx, "materia", e.target.value)}
                    className="font-bold text-slate-800 text-lg mb-3 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full"
                  />
                  
                  <div className="grid grid-cols-4 gap-2">
                    {["b1", "b2", "b3", "b4"].map((b, bIdx) => (
                      <div key={b} className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase">{bIdx + 1}º Bim</span>
                        <input
                          type="number"
                          step="0.1"
                          max="10"
                          min="0"
                          value={nota[b as keyof NotaRow]}
                          onChange={(e) => handleNotaChange(idx, b as keyof NotaRow, e.target.value)}
                          className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Total da Matéria</span>
                      <span className="font-black text-slate-800 text-lg">{qtd > 0 ? media.toFixed(1) : "-"}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${situacao.bg} ${situacao.color}`}>
                      {situacao.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button 
          onClick={addMateria}
          className="mt-2 w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition"
        >
          <Plus size={18} /> Adicionar Matéria
        </button>

        {message && (
          <div className="mt-2 p-3 bg-green-50 text-green-700 text-sm font-bold text-center rounded-xl flex items-center justify-center gap-2">
            <CheckCircle size={18} /> {message}
          </div>
        )}

        <button 
          onClick={salvarNotas}
          disabled={saving}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition"
        >
          <Save size={20} /> {saving ? "Salvando..." : "Salvar Boletim"}
        </button>
      </div>
    </div>
  );
}
