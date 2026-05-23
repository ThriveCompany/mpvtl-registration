"use client";

import { CENTER_OPTIONS } from "@/lib/admin-constants";
import { Monitor, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  active: boolean;
  courses?: { id: string; name: string; active: boolean }[];
};

type Course = {
  id: string;
  name: string;
  active: boolean;
  levels: string[];
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
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
};

type CourseForm = {
  id: string;
  name: string;
  categoryId: string;
  levels: string[];
  centerIds: string[];
  description: string;
  duration: string;
  certificate: string;
  learn: string[];
  skills: string[];
  careers: string[];
  requirement: string;
  value: string;
  contentBlocks: { title: string; body: string }[];
  active: boolean;
};

const levelOptions = ["Basic", "Intermediate", "Advanced"];
const emptyCourseForm: CourseForm = {
  id: "",
  name: "",
  categoryId: "",
  levels: [],
  centerIds: [],
  description: "",
  duration: "",
  certificate: "",
  learn: [""],
  skills: [""],
  careers: [""],
  requirement: "",
  value: "",
  contentBlocks: [],
  active: true,
};

function cleanList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function arrayFromUnknown(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "")) : [];
}

function blocksFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => {
      const block = item as { title?: unknown; body?: unknown };
      return { title: String(block.title || ""), body: String(block.body || "") };
    })
    : [];
}

function courseToForm(course: Course): CourseForm {
  return {
    id: course.id,
    name: course.name,
    categoryId: course.categoryId,
    levels: arrayFromUnknown(course.levels),
    centerIds: arrayFromUnknown(course.centerIds),
    description: course.description || "",
    duration: course.duration || "",
    certificate: course.certificate || "",
    learn: arrayFromUnknown(course.learn).length ? arrayFromUnknown(course.learn) : [""],
    skills: arrayFromUnknown(course.skills).length ? arrayFromUnknown(course.skills) : [""],
    careers: arrayFromUnknown(course.careers).length ? arrayFromUnknown(course.careers) : [""],
    requirement: course.requirement || "",
    value: course.value || "",
    contentBlocks: blocksFromUnknown(course.contentBlocks),
    active: course.active,
  };
}

function FieldLabel({ children }: { children: string }) {
  return <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{children}</span>;
}

function ActionButton({
  children,
  disabled,
  onClick,
  variant = "primary",
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "navy" | "danger";
}) {
  const styles = {
    primary: "bg-brand-700 text-white hover:bg-brand-800",
    navy: "bg-navy-950 text-white hover:bg-navy-900",
    danger: "bg-brand-50 text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:ring-1 disabled:ring-slate-200 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export default function CoursesClient() {
  const [activeTab, setActiveTab] = useState<"all" | "add" | "categories">("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", active: true });
  const [quickEditId, setQuickEditId] = useState("");
  const [quickEdit, setQuickEdit] = useState({ categoryId: "", active: true, levels: [] as string[], centerIds: [] as string[] });
  const [moveForm, setMoveForm] = useState({ fromCategoryId: "", toCategoryId: "" });

  const canSaveCourse = Boolean(courseForm.name.trim() && courseForm.categoryId && courseForm.levels.length > 0);
  const canSaveCategory = Boolean(categoryForm.name.trim());
  const canMoveCourses = Boolean(moveForm.fromCategoryId && moveForm.toCategoryId && moveForm.fromCategoryId !== moveForm.toCategoryId);

  const sortedCourses = useMemo(() => [...courses].sort((first, second) => first.name.localeCompare(second.name)), [courses]);

  async function loadData() {
    setLoading(true);
    const response = await fetch("/api/admin/courses", { cache: "no-store" });
    const result = await response.json().catch(() => null) as { courses?: unknown; categories?: unknown; message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Could not load courses.");
      setLoading(false);
      return;
    }
    setCourses(Array.isArray(result?.courses) ? result.courses as Course[] : []);
    setCategories(Array.isArray(result?.categories) ? result.categories as Category[] : []);
    setLoading(false);
  }

  async function sendAction(payload: Record<string, unknown>, successMessage = "Saved.") {
    setMessage("");
    const response = await fetch("/api/admin/courses", {
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
    await loadData();
    return true;
  }

  async function saveCourse() {
    const saved = await sendAction({
      action: courseForm.id ? "update-course" : "create-course",
      ...courseForm,
      learn: cleanList(courseForm.learn),
      skills: cleanList(courseForm.skills),
      careers: cleanList(courseForm.careers),
      contentBlocks: courseForm.contentBlocks.filter((block) => block.title.trim() || block.body.trim()),
    }, courseForm.id ? "Course updated." : "Course created.");

    if (saved) {
      setCourseForm(emptyCourseForm);
      setActiveTab("all");
    }
  }

  async function saveCategory() {
    const saved = await sendAction({
      action: categoryForm.id ? "update-category" : "create-category",
      ...categoryForm,
    }, categoryForm.id ? "Category updated." : "Category created.");

    if (saved) setCategoryForm({ id: "", name: "", active: true });
  }

  function editCourse(course: Course) {
    setCourseForm(courseToForm(course));
    setActiveTab("add");
  }

  function openQuickEdit(course: Course) {
    setQuickEditId(course.id);
    setQuickEdit({
      categoryId: course.categoryId,
      active: course.active,
      levels: arrayFromUnknown(course.levels),
      centerIds: arrayFromUnknown(course.centerIds),
    });
  }

  async function saveQuickEdit(id: string) {
    const saved = await sendAction({ action: "quick-update-course", id, ...quickEdit }, "Course quick edit saved.");
    if (saved) setQuickEditId("");
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete "${course.name}"? This cannot be undone.`)) return;
    await sendAction({ action: "delete-course", id: course.id }, "Course deleted.");
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Delete "${category.name}"? Courses must be moved out before this can work.`)) return;
    await sendAction({ action: "delete-category", id: category.id }, "Category deleted.");
  }

  function updateList(field: "learn" | "skills" | "careers", index: number, value: string) {
    setCourseForm((current) => {
      const next = [...current[field]];
      next[index] = value;
      return { ...current, [field]: next };
    });
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)] md:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-950 text-white">
          <Monitor size={20} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-navy-950">Course management is available on desktop only.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Course creation and editing includes descriptions, centres, categories, and display sections. Please use a desktop screen for this module.
        </p>
      </section>

      <div className="hidden space-y-5 md:block">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_14px_42px_rgba(6,19,33,0.06)]">
          {[
            ["all", "All Courses"],
            ["add", courseForm.id ? "Edit Course" : "Add New Course"],
            ["categories", "Categories"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as typeof activeTab)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                activeTab === value ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-navy-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {message && (
          <p className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.toLowerCase().includes("could") || message.toLowerCase().includes("failed")
              ? "border-brand-100 bg-brand-50 text-brand-800"
              : "border-emerald-100 bg-emerald-50 text-emerald-800"
          }`}>
            {message}
          </p>
        )}

        {activeTab === "all" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-navy-950">All Courses</h2>
            </div>
            {loading ? (
              <p className="p-5 text-sm text-slate-600">Loading courses...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-sm">
                  <thead className="bg-white text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-5 py-3">Name</th>
                      <th className="border-b border-slate-200 px-5 py-3">Active Status</th>
                      <th className="border-b border-slate-200 px-5 py-3">Category</th>
                      <th className="border-b border-slate-200 px-5 py-3">Date</th>
                      <th className="border-b border-slate-200 px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCourses.map((course) => (
                      <tr key={course.id} className="align-top hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-5 py-4">
                          <p className="font-bold text-navy-950">{course.name}</p>
                          {quickEditId === course.id && (
                            <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
                              <div className="grid gap-3 lg:grid-cols-2">
                                <select className="h-10 rounded-xl border border-slate-300 px-3" value={quickEdit.categoryId} onChange={(event) => setQuickEdit({ ...quickEdit, categoryId: event.target.value })}>
                                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                </select>
                                <label className="inline-flex items-center gap-2 text-sm font-bold text-navy-950">
                                  <input type="checkbox" checked={quickEdit.active} onChange={(event) => setQuickEdit({ ...quickEdit, active: event.target.checked })} />
                                  Active
                                </label>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {levelOptions.map((level) => (
                                  <label key={level} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-navy-950">
                                    <input type="checkbox" checked={quickEdit.levels.includes(level)} onChange={(event) => setQuickEdit({
                                      ...quickEdit,
                                      levels: event.target.checked ? [...quickEdit.levels, level] : quickEdit.levels.filter((item) => item !== level),
                                    })} />
                                    {level}
                                  </label>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <ActionButton disabled={!quickEdit.categoryId || quickEdit.levels.length === 0} onClick={() => saveQuickEdit(course.id)}>Save Quick Edit</ActionButton>
                                <ActionButton variant="danger" onClick={() => setQuickEditId("")}>Cancel</ActionButton>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${course.active ? "bg-navy-950 text-white ring-navy-950" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                            {course.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-700">{course.category?.name || "Uncategorised"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-slate-600">{new Date(course.createdAt).toLocaleDateString()}</td>
                        <td className="border-b border-slate-100 px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => editCourse(course)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-navy-950 hover:border-brand-300"><Pencil size={13} />Edit</button>
                            <button type="button" onClick={() => openQuickEdit(course)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-navy-950 hover:border-brand-300">Quick Edit</button>
                            <button type="button" onClick={() => deleteCourse(course)} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50"><Trash2 size={13} />Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "add" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-950">{courseForm.id ? "Edit Course" : "Add New Course"}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Build the course page content students see during registration.</p>
              </div>
              <ActionButton disabled={!canSaveCourse} onClick={saveCourse}>{courseForm.id ? "Update Course" : "Add Course"}</ActionButton>
            </div>

            <div className="mt-5 grid gap-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <FieldLabel>Course name</FieldLabel>
                  <input className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 text-sm" value={courseForm.name} onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })} />
                </label>
                <label className="block">
                  <FieldLabel>Category</FieldLabel>
                  <select className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 text-sm" value={courseForm.categoryId} onChange={(event) => setCourseForm({ ...courseForm, categoryId: event.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <FieldLabel>Duration</FieldLabel>
                  <input className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 text-sm" value={courseForm.duration} onChange={(event) => setCourseForm({ ...courseForm, duration: event.target.value })} placeholder="8 weeks" />
                </label>
                <label className="block">
                  <FieldLabel>Certification / training details</FieldLabel>
                  <input className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 text-sm" value={courseForm.certificate} onChange={(event) => setCourseForm({ ...courseForm, certificate: event.target.value })} />
                </label>
              </div>

              <label className="block">
                <FieldLabel>Course description</FieldLabel>
                <textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6" value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} />
              </label>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <FieldLabel>Available levels</FieldLabel>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {levelOptions.map((level) => (
                      <label key={level} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-navy-950">
                        <input type="checkbox" checked={courseForm.levels.includes(level)} onChange={(event) => setCourseForm({
                          ...courseForm,
                          levels: event.target.checked ? [...courseForm.levels, level] : courseForm.levels.filter((item) => item !== level),
                        })} />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <FieldLabel>Available centres</FieldLabel>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CENTER_OPTIONS.map((center) => (
                      <label key={center.value} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-navy-950">
                        <input type="checkbox" checked={courseForm.centerIds.includes(center.value)} onChange={(event) => setCourseForm({
                          ...courseForm,
                          centerIds: event.target.checked ? [...courseForm.centerIds, center.value] : courseForm.centerIds.filter((item) => item !== center.value),
                        })} />
                        {center.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {(["learn", "skills", "careers"] as const).map((field) => (
                <div key={field} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel>{field === "learn" ? "What you will learn" : field === "skills" ? "Practical skills gained" : "Career benefits"}</FieldLabel>
                    <button type="button" onClick={() => setCourseForm((current) => ({ ...current, [field]: [...current[field], ""] }))} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700"><Plus size={14} /> Add item</button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {courseForm[field].map((value, index) => (
                      <div key={`${field}-${index}`} className="flex gap-2">
                        <input className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm" value={value} onChange={(event) => updateList(field, index, event.target.value)} />
                        <button type="button" onClick={() => setCourseForm((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-500"><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <label className="block">
                <FieldLabel>Entry requirements</FieldLabel>
                <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6" value={courseForm.requirement} onChange={(event) => setCourseForm({ ...courseForm, requirement: event.target.value })} />
              </label>
              <label className="block">
                <FieldLabel>Why this course is valuable</FieldLabel>
                <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6" value={courseForm.value} onChange={(event) => setCourseForm({ ...courseForm, value: event.target.value })} />
              </label>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Display sections / content blocks</FieldLabel>
                  <button type="button" onClick={() => setCourseForm((current) => ({ ...current, contentBlocks: [...current.contentBlocks, { title: "", body: "" }] }))} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700"><Plus size={14} /> Add section</button>
                </div>
                <div className="mt-3 grid gap-3">
                  {courseForm.contentBlocks.map((block, index) => (
                    <div key={`block-${index}`} className="rounded-xl bg-slate-50 p-3">
                      <input className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-bold" placeholder="Section title" value={block.title} onChange={(event) => setCourseForm((current) => {
                        const next = [...current.contentBlocks];
                        next[index] = { ...next[index], title: event.target.value };
                        return { ...current, contentBlocks: next };
                      })} />
                      <textarea className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Section content" value={block.body} onChange={(event) => setCourseForm((current) => {
                        const next = [...current.contentBlocks];
                        next[index] = { ...next[index], body: event.target.value };
                        return { ...current, contentBlocks: next };
                      })} />
                    </div>
                  ))}
                  {courseForm.contentBlocks.length === 0 && <p className="text-sm text-slate-500">No extra display sections yet.</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
                  <input type="checkbox" checked={courseForm.active} onChange={(event) => setCourseForm({ ...courseForm, active: event.target.checked })} />
                  Active course
                </label>
                <div className="flex gap-2">
                  <ActionButton variant="danger" onClick={() => setCourseForm(emptyCourseForm)}>Reset</ActionButton>
                  <ActionButton disabled={!canSaveCourse} onClick={saveCourse}>{courseForm.id ? "Update Course" : "Add Course"}</ActionButton>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "categories" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-lg font-bold text-navy-950">Categories</h2>
                <div className="mt-4 grid gap-3">
                  <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
                    <input type="checkbox" checked={categoryForm.active} onChange={(event) => setCategoryForm({ ...categoryForm, active: event.target.checked })} />
                    Active category
                  </label>
                  <ActionButton variant="navy" disabled={!canSaveCategory} onClick={saveCategory}>{categoryForm.id ? "Update Category" : "Add Category"}</ActionButton>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Move courses between categories</h3>
                <div className="mt-4 grid gap-3">
                  <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={moveForm.fromCategoryId} onChange={(event) => setMoveForm({ ...moveForm, fromCategoryId: event.target.value })}>
                    <option value="">From category</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={moveForm.toCategoryId} onChange={(event) => setMoveForm({ ...moveForm, toCategoryId: event.target.value })}>
                    <option value="">To category</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <ActionButton disabled={!canMoveCourses} onClick={() => sendAction({ action: "move-courses", ...moveForm }, "Courses moved.")}>Move Courses</ActionButton>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {categories.map((category) => (
                <div key={category.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-navy-950">{category.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{category.active ? "Active" : "Inactive"} · {category.courses?.length ?? 0} courses</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setCategoryForm({ id: category.id, name: category.name, active: category.active })} className="text-sm font-bold text-brand-700">Edit</button>
                      <button type="button" onClick={() => deleteCategory(category)} className="text-sm font-bold text-slate-500">Delete</button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {category.courses?.map((course) => (
                      <span key={course.id} className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                        {course.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
