"use client";

import { ArrowDown, ArrowUp, CheckCircle2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; active: boolean };
type Question = {
  id: string;
  categoryId: string | null;
  category?: Category | null;
  level: string;
  key: string;
  questionText: string;
  active: boolean;
  sortOrder: number;
};

const levels = ["Basic", "Intermediate", "Advanced"];
const knownKeysByLevel: Record<string, string[]> = {
  Basic: ["canReadAndWrite", "newToField", "reasonForCourse", "availableForPracticalTraining"],
  Intermediate: ["priorExposure", "completedBasicCourse", "experienceDescription", "availableForEntryReview"],
  Advanced: ["priorTraining", "hasPreviousCertificate", "practicalExperience", "availableForAssessment"],
};

const emptyForm = {
  id: "",
  categoryId: "",
  level: "Basic",
  key: "",
  questionText: "",
  sortOrder: 1,
  active: true,
};

function Button({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:ring-1 disabled:ring-slate-200"
    >
      {children}
    </button>
  );
}

export default function QuestionsClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("Basic");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const selectedQuestions = useMemo(() => (
    questions
      .filter((question) => question.categoryId === selectedCategoryId && question.level === selectedLevel)
      .sort((first, second) => first.sortOrder - second.sortOrder)
  ), [questions, selectedCategoryId, selectedLevel]);
  const nextAvailableKey = useMemo(() => {
    if (form.id) return form.key;
    const usedKeys = new Set(selectedQuestions.map((question) => question.key));
    return (knownKeysByLevel[selectedLevel] || []).find((key) => !usedKeys.has(key)) || "";
  }, [form.id, form.key, selectedLevel, selectedQuestions]);
  const canSave = Boolean(form.categoryId && form.level && nextAvailableKey.trim() && form.questionText.trim());

  async function loadQuestions() {
    const response = await fetch("/api/admin/questions", { cache: "no-store" });
    const result = await response.json().catch(() => null) as { questions?: unknown; categories?: unknown; message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Could not load questions.");
      return;
    }

    const nextCategories = Array.isArray(result?.categories) ? result.categories as Category[] : [];
    setCategories(nextCategories);
    setQuestions(Array.isArray(result?.questions) ? result.questions as Question[] : []);
    setSelectedCategoryId((current) => current || nextCategories[0]?.id || "");
  }

  async function send(payload: Record<string, unknown>, successMessage: string) {
    setMessage("");
    const response = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Could not save question.");
      return false;
    }

    setMessage(successMessage);
    await loadQuestions();
    return true;
  }

  async function saveQuestion() {
    const saved = await send({ ...form, key: nextAvailableKey }, form.id ? "Question updated." : "Question added.");
    if (saved) {
      setForm({ ...emptyForm, categoryId: selectedCategoryId, level: selectedLevel, sortOrder: selectedQuestions.length + 1 });
    }
  }

  async function toggleQuestion(question: Question) {
    await send({ action: "toggle-question", id: question.id, active: !question.active }, question.active ? "Question deactivated." : "Question activated.");
  }

  async function moveQuestion(question: Question, direction: "up" | "down") {
    const currentIndex = selectedQuestions.findIndex((item) => item.id === question.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selectedQuestions.length) return;

    const nextQuestions = [...selectedQuestions];
    const [removed] = nextQuestions.splice(currentIndex, 1);
    nextQuestions.splice(targetIndex, 0, removed);
    await send({ action: "reorder-questions", orderedIds: nextQuestions.map((item) => item.id) }, "Question order updated.");
  }

  function startEdit(question: Question) {
    setForm({
      id: question.id,
      categoryId: question.categoryId || selectedCategoryId,
      level: question.level,
      key: question.key,
      questionText: question.questionText,
      sortOrder: question.sortOrder,
      active: question.active,
    });
    setSelectedLevel(question.level);
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) return;
    setForm((current) => ({
      ...current,
      categoryId: selectedCategoryId,
      level: selectedLevel,
      sortOrder: current.id ? current.sortOrder : selectedQuestions.length + 1,
    }));
  }, [selectedCategoryId, selectedLevel, selectedQuestions.length]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(6,19,33,0.08)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-950">Question Sets</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Select a category, then manage the questions every course under that category will use.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            <CheckCircle2 size={14} />
            Supports {"{course}"} dynamic tag
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <select
            value={selectedCategoryId}
            onChange={(event) => {
              setSelectedCategoryId(event.target.value);
              setForm({ ...emptyForm, categoryId: event.target.value, level: selectedLevel });
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          >
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setSelectedLevel(level);
                  setForm((current) => ({ ...current, level }));
                }}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition ${
                  selectedLevel === level ? "bg-brand-700 text-white" : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(6,19,33,0.08)] sm:p-5">
        <div className="flex items-center gap-2">
          <Plus size={18} className="text-brand-700" />
          <h2 className="text-base font-bold text-navy-950">{form.id ? "Edit Question" : "Add Question"}</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Category: <span className="font-bold text-navy-950">{selectedCategory?.name || "Select category"}</span>. Use {"{course}"} where the selected course name should appear.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[150px_1fr]">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Order
            <input
              className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold normal-case tracking-normal text-navy-950"
              type="number"
              min={1}
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />
          </label>
          <textarea
            className="min-h-24 rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6"
            placeholder="Question text"
            value={form.questionText}
            onChange={(event) => setForm({ ...form, questionText: event.target.value })}
          />
        </div>
        {!form.id && !nextAvailableKey && (
          <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            All available question slots for this level are already in use. Edit or reorder the existing questions below.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Active
          </label>
          <Button disabled={!canSave} onClick={saveQuestion}>{form.id ? "Update Question" : "Add Question"}</Button>
          {form.id && (
            <button type="button" onClick={() => setForm({ ...emptyForm, categoryId: selectedCategoryId, level: selectedLevel })} className="text-sm font-bold text-slate-500">
              Cancel edit
            </button>
          )}
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-brand-700">{message}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(6,19,33,0.08)]">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
          <h2 className="text-base font-bold text-navy-950">{selectedCategory?.name || "Category"} - {selectedLevel}</h2>
          <p className="mt-1 text-sm text-slate-600">{selectedQuestions.length} questions in this set.</p>
        </div>

        <div className="grid gap-3 p-4 sm:p-5">
          {selectedQuestions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button type="button" onClick={() => startEdit(question)} className="text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Question {index + 1} · Order {question.sortOrder}</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-navy-950">{question.questionText}</p>
                </button>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" disabled={index === 0} onClick={() => moveQuestion(question, "up")} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 disabled:opacity-40"><ArrowUp size={15} /></button>
                  <button type="button" disabled={index === selectedQuestions.length - 1} onClick={() => moveQuestion(question, "down")} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 disabled:opacity-40"><ArrowDown size={15} /></button>
                  <button type="button" onClick={() => toggleQuestion(question)} className={`rounded-lg px-3 py-2 text-xs font-bold ring-1 ${
                    question.active ? "bg-navy-950 text-white ring-navy-950" : "bg-slate-100 text-slate-600 ring-slate-200"
                  }`}>
                    {question.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {selectedQuestions.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No questions for this category and level yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
