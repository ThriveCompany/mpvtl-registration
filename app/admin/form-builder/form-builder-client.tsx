"use client";

import { CENTER_OPTIONS } from "@/lib/admin-constants";
import { ArrowDown, ArrowUp, Monitor, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type Level = { id: string; name: string; active: boolean; sortOrder: number };
type Field = { id: string; name: string; active: boolean; sortOrder: number };
type Course = {
  id: string;
  name: string;
  active: boolean;
  levelId?: string | null;
  fieldId?: string | null;
  centerIds: string[];
  description: string;
  duration: string;
  certificate: string;
  learn: string[];
  skills: string[];
  careers: string[];
  requirement: string;
  value: string;
  contentBlocks?: { title: string; body: string }[] | null;
  level?: Level | null;
  field?: Field | null;
};
type QuestionOption = { id: string; value: string; sortOrder: number };
type Condition = {
  id: string;
  sourceQuestionId: string;
  operator: "equals" | "not_equals";
  value: string;
  targetQuestionId: string;
  sourceQuestion?: { id: string; questionText: string; questionType: string };
};
type Question = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  active: boolean;
  sortOrder: number;
  levelId?: string | null;
  fieldId?: string | null;
  courseId?: string | null;
  level?: Level | null;
  field?: Field | null;
  course?: { id: string; name: string } | null;
  options: QuestionOption[];
  targetRules?: Condition[];
};
type QuestionType = "open" | "short_text" | "dropdown" | "yes_no";
type BuilderTab = "levels" | "fields" | "courses" | "questions";

const emptyLevel = { id: "", name: "", active: true, sortOrder: 1 };
const emptyField = { id: "", name: "", active: true, sortOrder: 1 };
const emptyCourse = {
  id: "",
  name: "",
  levelId: "",
  fieldId: "",
  centerIds: [] as string[],
  description: "",
  duration: "",
  certificate: "",
  learn: [""],
  skills: [""],
  careers: [""],
  requirement: "",
  value: "",
  contentBlocks: [] as { title: string; body: string }[],
  active: true,
};
const emptyQuestion = {
  id: "",
  questionText: "",
  questionType: "yes_no" as QuestionType,
  required: true,
  active: true,
  attachTo: "level" as "level" | "field" | "course",
  levelId: "",
  fieldId: "",
  courseId: "",
  sortOrder: 1,
  options: ["Yes", "No", "Other, please describe"],
  condition: {
    sourceQuestionId: "",
    operator: "equals" as "equals" | "not_equals",
    value: "",
  },
};

function cleanList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function listFrom(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "")) : [];
}

function blocksFrom(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => {
      const block = item as { title?: unknown; body?: unknown };
      return { title: String(block.title || ""), body: String(block.body || "") };
    })
    : [];
}

function Button({
  children,
  disabled,
  onClick,
  variant = "primary",
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "navy" | "danger" | "plain";
}) {
  const variants = {
    primary: "bg-brand-700 text-white hover:bg-brand-800",
    navy: "bg-navy-950 text-white hover:bg-navy-900",
    danger: "bg-brand-50 text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100",
    plain: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:ring-1 disabled:ring-slate-200 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: string }) {
  return <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{children}</span>;
}

export default function FormBuilderClient() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<BuilderTab>("questions");
  const [levelForm, setLevelForm] = useState(emptyLevel);
  const [fieldForm, setFieldForm] = useState(emptyField);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [message, setMessage] = useState("");
  const [questionFilter, setQuestionFilter] = useState({ levelId: "", fieldId: "", courseId: "" });

  const closedQuestions = questions.filter((question) => ["dropdown", "yes_no"].includes(question.questionType));
  const filteredQuestions = useMemo(() => questions.filter((question) => {
    if (questionFilter.courseId && question.courseId !== questionFilter.courseId) return false;
    if (questionFilter.fieldId && question.fieldId !== questionFilter.fieldId) return false;
    if (questionFilter.levelId && question.levelId !== questionFilter.levelId) return false;
    return true;
  }), [questionFilter, questions]);

  const canSaveLevel = Boolean(levelForm.name.trim());
  const canSaveField = Boolean(fieldForm.name.trim());
  const canSaveCourse = Boolean(courseForm.name.trim() && courseForm.levelId && courseForm.fieldId);
  const canSaveQuestion = Boolean(
    questionForm.questionText.trim()
    && (
      (questionForm.attachTo === "level" && questionForm.levelId)
      || (questionForm.attachTo === "field" && questionForm.fieldId)
      || (questionForm.attachTo === "course" && questionForm.courseId)
    )
    && (
      !["dropdown", "yes_no"].includes(questionForm.questionType)
      || cleanList(questionForm.options).length > 0
    ),
  );

  async function loadBuilder() {
    const response = await fetch("/api/admin/form-builder", { cache: "no-store" });
    const result = await response.json().catch(() => null) as {
      message?: string;
      levels?: Level[];
      fields?: Field[];
      courses?: Course[];
      questions?: Question[];
    } | null;

    if (!response.ok) {
      setMessage(result?.message || "Could not load form builder.");
      return;
    }

    setLevels(Array.isArray(result?.levels) ? result.levels : []);
    setFields(Array.isArray(result?.fields) ? result.fields : []);
    setCourses(Array.isArray(result?.courses) ? result.courses : []);
    setQuestions(Array.isArray(result?.questions) ? result.questions : []);
  }

  async function send(payload: Record<string, unknown>, successMessage: string) {
    setMessage("");
    const response = await fetch("/api/admin/form-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Action failed.");
      return false;
    }

    setMessage(successMessage);
    await loadBuilder();
    return true;
  }

  function editCourse(course: Course) {
    setCourseForm({
      id: course.id,
      name: course.name,
      levelId: course.levelId || "",
      fieldId: course.fieldId || "",
      centerIds: listFrom(course.centerIds),
      description: course.description || "",
      duration: course.duration || "",
      certificate: course.certificate || "",
      learn: listFrom(course.learn).length ? listFrom(course.learn) : [""],
      skills: listFrom(course.skills).length ? listFrom(course.skills) : [""],
      careers: listFrom(course.careers).length ? listFrom(course.careers) : [""],
      requirement: course.requirement || "",
      value: course.value || "",
      contentBlocks: blocksFrom(course.contentBlocks),
      active: course.active,
    });
    setActiveTab("courses");
  }

  function editQuestion(question: Question) {
    const attachTo = question.courseId ? "course" : question.fieldId ? "field" : "level";
    const condition = question.targetRules?.[0];
    setQuestionForm({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      required: question.required,
      active: question.active,
      attachTo,
      levelId: question.levelId || "",
      fieldId: question.fieldId || "",
      courseId: question.courseId || "",
      sortOrder: question.sortOrder,
      options: question.questionType === "yes_no" ? ["Yes", "No"] : question.options.map((option) => option.value),
      condition: {
        sourceQuestionId: condition?.sourceQuestionId || "",
        operator: condition?.operator || "equals",
        value: condition?.value || "",
      },
    });
    setActiveTab("questions");
  }

  useEffect(() => {
    void loadBuilder();
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(6,19,33,0.08)]">
        <div className="flex flex-wrap gap-2">
          {[
            ["levels", "Course Levels"],
            ["fields", "Course Fields"],
            ["courses", "Courses"],
            ["questions", "Questions"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as BuilderTab)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition md:inline-flex ${
                activeTab === value ? "bg-brand-700 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } ${value !== "questions" ? "hidden" : "inline-flex"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 md:hidden">
          Course, field, and level management is available on desktop. Question management remains available here.
        </p>
      </section>

      {message && (
        <p className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
          message.toLowerCase().includes("failed") || message.toLowerCase().includes("could")
            ? "border-brand-100 bg-brand-50 text-brand-800"
            : "border-emerald-100 bg-emerald-50 text-emerald-800"
        }`}>
          {message}
        </p>
      )}

      {activeTab !== "questions" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(6,19,33,0.08)] md:hidden">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-950 text-white">
            <Monitor size={20} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-navy-950">This section is desktop-only.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use a laptop or desktop to manage levels, fields, and courses safely.</p>
        </section>
      )}

      {activeTab === "levels" && (
        <DesktopOnly>
          <SimpleManager
            title="Course Levels"
            description="Basic, Intermediate, and Advanced are form classifications, not categories."
            form={levelForm}
            setForm={setLevelForm}
            canSave={canSaveLevel}
            onSave={async () => {
              const saved = await send({ action: "save-level", ...levelForm }, levelForm.id ? "Level updated." : "Level created.");
              if (saved) setLevelForm(emptyLevel);
            }}
            rows={levels}
            onEdit={setLevelForm}
          />
        </DesktopOnly>
      )}

      {activeTab === "fields" && (
        <DesktopOnly>
          <SimpleManager
            title="Course Fields"
            description="Fields group courses by professional area, such as ICT or Culinary Arts."
            form={fieldForm}
            setForm={setFieldForm}
            canSave={canSaveField}
            onSave={async () => {
              const saved = await send({ action: "save-field", ...fieldForm }, fieldForm.id ? "Field updated." : "Field created.");
              if (saved) setFieldForm(emptyField);
            }}
            rows={fields}
            onEdit={setFieldForm}
          />
        </DesktopOnly>
      )}

      {activeTab === "courses" && (
        <DesktopOnly>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(6,19,33,0.08)]">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-navy-950">Courses</h2>
              <p className="mt-1 text-sm text-slate-600">Each course belongs to one level and one field.</p>
            </div>
            <div className="grid gap-5 p-5 xl:grid-cols-[420px_1fr]">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-navy-950">{courseForm.id ? "Edit Course" : "Add Course"}</h3>
                <div className="mt-4 grid gap-3">
                  <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Course name" value={courseForm.name} onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })} />
                  <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={courseForm.levelId} onChange={(event) => setCourseForm({ ...courseForm, levelId: event.target.value })}>
                    <option value="">Select level</option>
                    {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
                  </select>
                  <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={courseForm.fieldId} onChange={(event) => setCourseForm({ ...courseForm, fieldId: event.target.value })}>
                    <option value="">Select field</option>
                    {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
                  </select>
                  <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Duration" value={courseForm.duration} onChange={(event) => setCourseForm({ ...courseForm, duration: event.target.value })} />
                  <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Certificate / training details" value={courseForm.certificate} onChange={(event) => setCourseForm({ ...courseForm, certificate: event.target.value })} />
                  <textarea className="min-h-24 rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Course description" value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} />
                  <textarea className="min-h-20 rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Entry requirements" value={courseForm.requirement} onChange={(event) => setCourseForm({ ...courseForm, requirement: event.target.value })} />
                  <textarea className="min-h-20 rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Why this course is valuable" value={courseForm.value} onChange={(event) => setCourseForm({ ...courseForm, value: event.target.value })} />

                  <Checklist title="Centres" values={courseForm.centerIds} options={CENTER_OPTIONS.map((center) => ({ value: center.value, label: center.label }))} onChange={(centerIds) => setCourseForm({ ...courseForm, centerIds })} />
                  <EditableList title="What you will learn" values={courseForm.learn} onChange={(learn) => setCourseForm({ ...courseForm, learn })} />
                  <EditableList title="Practical skills gained" values={courseForm.skills} onChange={(skills) => setCourseForm({ ...courseForm, skills })} />
                  <EditableList title="Career benefits" values={courseForm.careers} onChange={(careers) => setCourseForm({ ...courseForm, careers })} />
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
                    <input type="checkbox" checked={courseForm.active} onChange={(event) => setCourseForm({ ...courseForm, active: event.target.checked })} />
                    Active
                  </label>
                  <div className="flex gap-2">
                    <Button disabled={!canSaveCourse} onClick={async () => {
                      const saved = await send({
                        action: "save-course",
                        ...courseForm,
                        learn: cleanList(courseForm.learn),
                        skills: cleanList(courseForm.skills),
                        careers: cleanList(courseForm.careers),
                      }, courseForm.id ? "Course updated." : "Course created.");
                      if (saved) setCourseForm(emptyCourse);
                    }}>{courseForm.id ? "Update Course" : "Add Course"}</Button>
                    {courseForm.id && <Button variant="plain" onClick={() => setCourseForm(emptyCourse)}>Cancel</Button>}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1fr_130px_130px_150px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  <span>Name</span><span>Level</span><span>Field</span><span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <div key={course.id} className="grid grid-cols-[1fr_130px_130px_150px] gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-bold text-navy-950">{course.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{course.active ? "Active" : "Inactive"}</p>
                      </div>
                      <span>{course.level?.name || "Unset"}</span>
                      <span>{course.field?.name || "Unset"}</span>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => editCourse(course)} className="font-bold text-brand-700">Edit</button>
                        <button type="button" onClick={() => {
                          if (window.confirm(`Delete "${course.name}"?`)) void send({ action: "delete-course", id: course.id }, "Course deleted.");
                        }} className="font-bold text-slate-500">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </DesktopOnly>
      )}

      {activeTab === "questions" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(6,19,33,0.08)]">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-navy-950">Question Builder</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Questions can attach to a level, field, or specific course. Use {"{course}"}, {"{level}"}, or {"{field}"} in question text.</p>
          </div>
          <div className="grid gap-5 p-4 lg:grid-cols-[420px_1fr] sm:p-5">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-navy-950">{questionForm.id ? "Edit Question" : "Add Question"}</h3>
              <div className="mt-4 grid gap-3">
                <textarea className="min-h-24 rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Question text" value={questionForm.questionText} onChange={(event) => setQuestionForm({ ...questionForm, questionText: event.target.value })} />
                <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={questionForm.questionType} onChange={(event) => {
                  const questionType = event.target.value as QuestionType;
                  setQuestionForm({
                    ...questionForm,
                    questionType,
                    options: questionType === "yes_no" ? ["Yes", "No"] : questionType === "dropdown" ? questionForm.options : [],
                  });
                }}>
                  <option value="open">Open-ended</option>
                  <option value="short_text">Short text</option>
                  <option value="dropdown">Closed-ended dropdown</option>
                  <option value="yes_no">Yes/No</option>
                </select>
                <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={questionForm.attachTo} onChange={(event) => setQuestionForm({ ...questionForm, attachTo: event.target.value as typeof questionForm.attachTo, levelId: "", fieldId: "", courseId: "" })}>
                  <option value="level">Attach to Course Level</option>
                  <option value="field">Attach to Course Field</option>
                  <option value="course">Attach to Specific Course</option>
                </select>
                {questionForm.attachTo === "level" && (
                  <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={questionForm.levelId} onChange={(event) => setQuestionForm({ ...questionForm, levelId: event.target.value })}>
                    <option value="">Select level</option>
                    {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
                  </select>
                )}
                {questionForm.attachTo === "field" && (
                  <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={questionForm.fieldId} onChange={(event) => setQuestionForm({ ...questionForm, fieldId: event.target.value })}>
                    <option value="">Select field</option>
                    {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
                  </select>
                )}
                {questionForm.attachTo === "course" && (
                  <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={questionForm.courseId} onChange={(event) => setQuestionForm({ ...questionForm, courseId: event.target.value })}>
                    <option value="">Select course</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                  </select>
                )}
                <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" type="number" min={1} value={questionForm.sortOrder} onChange={(event) => setQuestionForm({ ...questionForm, sortOrder: Number(event.target.value) })} />
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950"><input type="checkbox" checked={questionForm.required} onChange={(event) => setQuestionForm({ ...questionForm, required: event.target.checked })} />Required</label>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950"><input type="checkbox" checked={questionForm.active} onChange={(event) => setQuestionForm({ ...questionForm, active: event.target.checked })} />Active</label>
                </div>

                {questionForm.questionType === "dropdown" && (
                  <EditableList title="Dropdown options" values={questionForm.options} onChange={(options) => setQuestionForm({ ...questionForm, options })} />
                )}
                {questionForm.questionType === "yes_no" && (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">Yes/No questions render as a dropdown with Yes and No.</p>
                )}

                <div className="rounded-2xl border border-slate-200 p-4">
                  <Label>Conditional display</Label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Optional. Show this question only when another closed question has a matching answer.</p>
                  <div className="mt-3 grid gap-2">
                    <select className="h-10 rounded-xl border border-slate-300 px-3 text-sm" value={questionForm.condition.sourceQuestionId} onChange={(event) => setQuestionForm({ ...questionForm, condition: { ...questionForm.condition, sourceQuestionId: event.target.value } })}>
                      <option value="">Always show</option>
                      {closedQuestions.filter((question) => question.id !== questionForm.id).map((question) => <option key={question.id} value={question.id}>{question.questionText}</option>)}
                    </select>
                    <select className="h-10 rounded-xl border border-slate-300 px-3 text-sm" value={questionForm.condition.operator} onChange={(event) => setQuestionForm({ ...questionForm, condition: { ...questionForm.condition, operator: event.target.value as "equals" | "not_equals" } })}>
                      <option value="equals">equals</option>
                      <option value="not_equals">does not equal</option>
                    </select>
                    <input className="h-10 rounded-xl border border-slate-300 px-3 text-sm" placeholder="Answer value, e.g. Yes" value={questionForm.condition.value} onChange={(event) => setQuestionForm({ ...questionForm, condition: { ...questionForm.condition, value: event.target.value } })} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button disabled={!canSaveQuestion} onClick={async () => {
                    const saved = await send({
                      action: "save-question",
                      ...questionForm,
                      options: cleanList(questionForm.options),
                    }, questionForm.id ? "Question updated." : "Question created.");
                    if (saved) setQuestionForm(emptyQuestion);
                  }}>{questionForm.id ? "Update Question" : "Add Question"}</Button>
                  {questionForm.id && <Button variant="plain" onClick={() => setQuestionForm(emptyQuestion)}>Cancel</Button>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
                <select className="h-10 rounded-xl border border-slate-300 px-3 text-sm" value={questionFilter.levelId} onChange={(event) => setQuestionFilter({ ...questionFilter, levelId: event.target.value })}>
                  <option value="">All levels</option>
                  {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
                </select>
                <select className="h-10 rounded-xl border border-slate-300 px-3 text-sm" value={questionFilter.fieldId} onChange={(event) => setQuestionFilter({ ...questionFilter, fieldId: event.target.value })}>
                  <option value="">All fields</option>
                  {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
                </select>
                <select className="h-10 rounded-xl border border-slate-300 px-3 text-sm" value={questionFilter.courseId} onChange={(event) => setQuestionFilter({ ...questionFilter, courseId: event.target.value })}>
                  <option value="">All courses</option>
                  {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
              </div>

              <div className="grid gap-3">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <button type="button" onClick={() => editQuestion(question)} className="text-left">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          {question.questionType.replace("_", " ")} · {question.required ? "Required" : "Optional"} · {question.active ? "Active" : "Inactive"}
                        </p>
                        <p className="mt-1 text-sm font-bold leading-6 text-navy-950">{question.questionText}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {question.course?.name || question.field?.name || question.level?.name || "Unassigned"}
                          {question.targetRules?.[0] && ` · Shows when "${question.targetRules[0].sourceQuestion?.questionText}" ${question.targetRules[0].operator === "equals" ? "equals" : "does not equal"} "${question.targetRules[0].value}"`}
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editQuestion(question)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-navy-950">Edit</button>
                        <button type="button" onClick={() => {
                          if (window.confirm("Delete this question?")) void send({ action: "delete-question", id: question.id }, "Question deleted.");
                        }} className="grid h-9 w-9 place-items-center rounded-lg border border-brand-200 text-brand-700"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredQuestions.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">No questions match this filter.</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function DesktopOnly({ children }: { children: ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}

function SimpleManager({
  title,
  description,
  form,
  setForm,
  canSave,
  onSave,
  rows,
  onEdit,
}: {
  title: string;
  description: string;
  form: typeof emptyLevel;
  setForm: (form: typeof emptyLevel) => void;
  canSave: boolean;
  onSave: () => void;
  rows: (typeof emptyLevel)[];
  onEdit: (row: typeof emptyLevel) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(6,19,33,0.08)]">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-base font-bold text-navy-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-bold text-navy-950">{form.id ? "Edit" : "Add"}</h3>
          <div className="mt-4 grid gap-3">
            <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Active
            </label>
            <div className="flex gap-2">
              <Button disabled={!canSave} onClick={onSave}>{form.id ? "Update" : "Add"}</Button>
              {form.id && <Button variant="plain" onClick={() => setForm(emptyLevel)}>Cancel</Button>}
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[1fr_110px_110px_90px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            <span>Name</span><span>Status</span><span>Order</span><span className="text-right">Action</span>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_110px_110px_90px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <span className="font-bold text-navy-950">{row.name}</span>
              <span>{row.active ? "Active" : "Inactive"}</span>
              <span>{row.sortOrder}</span>
              <button type="button" onClick={() => onEdit(row)} className="text-right font-bold text-brand-700">Edit</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Checklist({
  title,
  values,
  options,
  onChange,
}: {
  title: string;
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <Label>{title}</Label>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-navy-950 ring-1 ring-slate-200">
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={(event) => onChange(event.target.checked ? [...values, option.value] : values.filter((value) => value !== option.value))}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function EditableList({
  title,
  values,
  onChange,
}: {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label>{title}</Label>
        <button type="button" onClick={() => onChange([...values, ""])} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700">
          <Plus size={14} /> Add option
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex gap-2">
            <input className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm" value={value} onChange={(event) => {
              const next = [...values];
              next[index] = event.target.value;
              onChange(next);
            }} />
            <button type="button" disabled={index === 0} onClick={() => {
              const next = [...values];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              onChange(next);
            }} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-600 disabled:opacity-40"><ArrowUp size={14} /></button>
            <button type="button" disabled={index === values.length - 1} onClick={() => {
              const next = [...values];
              [next[index + 1], next[index]] = [next[index], next[index + 1]];
              onChange(next);
            }} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-600 disabled:opacity-40"><ArrowDown size={14} /></button>
            <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
