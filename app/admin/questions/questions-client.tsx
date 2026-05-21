"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  level: string;
  key: string;
  questionText: string;
  active: boolean;
  sortOrder: number;
};

const levels = ["Basic", "Intermediate", "Advanced"];

export default function QuestionsClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState({ id: "", level: "Basic", key: "", questionText: "", sortOrder: 0, active: true });
  const [message, setMessage] = useState("");

  async function loadQuestions() {
    const response = await fetch("/api/admin/questions", { cache: "no-store" });
    const result = await response.json().catch(() => null) as { questions?: unknown; message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Could not load questions.");
      return;
    }
    setQuestions(Array.isArray(result?.questions) ? result.questions as Question[] : []);
  }

  async function saveQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Could not save question.");
      return;
    }
    setMessage("Question saved.");
    setForm({ id: "", level: "Basic", key: "", questionText: "", sortOrder: 0, active: true });
    await loadQuestions();
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  return (
    <div className="space-y-5">
      <form onSubmit={saveQuestion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
        <h2 className="text-base font-bold text-navy-950">{form.id ? "Edit question" : "Add question"}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Use {"{course}"} where the selected course name should appear.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_110px]">
          <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
            {levels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
          <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Stable key e.g. newToField" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} disabled={Boolean(form.id)} />
          <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
          <textarea className="min-h-24 rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-3" placeholder="Question text" value={form.questionText} onChange={(event) => setForm({ ...form, questionText: event.target.value })} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Active
          </label>
          <button type="submit" className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white">
            Save Question
          </button>
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-brand-700">{message}</p>}
      </form>

      {levels.map((level) => (
        <section key={level} className="rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-bold text-navy-950">{level}</h2>
          </div>
          <div className="grid gap-3 p-5">
            {questions.filter((question) => question.level === level).map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setForm(question)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-200 hover:bg-brand-50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{question.key} · Order {question.sortOrder}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-navy-950">{question.questionText}</p>
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${question.active ? "bg-navy-950 text-white ring-navy-950" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                    {question.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
