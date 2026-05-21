"use client";

import { CENTER_OPTIONS } from "@/lib/admin-constants";
import { useEffect, useState } from "react";

type Category = { id: string; name: string; active: boolean };
type Course = {
  id: string;
  name: string;
  active: boolean;
  levels: string[];
  centerIds: string[];
  categoryId: string;
  category: Category;
};

const levelOptions = ["Basic", "Intermediate", "Advanced"];

export default function CoursesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [message, setMessage] = useState("");
  const [courseForm, setCourseForm] = useState({ id: "", name: "", categoryId: "", levels: [] as string[], centerIds: [] as string[], active: true });
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", active: true });

  async function loadData() {
    const response = await fetch("/api/admin/courses", { cache: "no-store" });
    const result = await response.json().catch(() => null) as { courses?: unknown; categories?: unknown; message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Could not load courses.");
      return;
    }
    setCourses(Array.isArray(result?.courses) ? result.courses as Course[] : []);
    setCategories(Array.isArray(result?.categories) ? result.categories as Category[] : []);
  }

  async function sendAction(payload: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) {
      setMessage(result?.message || "Action failed.");
      return;
    }
    setMessage("Saved.");
    setCourseForm({ id: "", name: "", categoryId: "", levels: [], centerIds: [], active: true });
    setCategoryForm({ id: "", name: "", active: true });
    await loadData();
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
        <h2 className="text-base font-bold text-navy-950">Add / edit course</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <input className="h-11 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Course name" value={courseForm.name} onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })} />
          <select className="h-11 rounded-xl border border-slate-300 px-4 text-sm" value={courseForm.categoryId} onChange={(event) => setCourseForm({ ...courseForm, categoryId: event.target.value })}>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Levels available</p>
            <div className="mt-2 flex flex-wrap gap-2">
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
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Centres</p>
            <div className="mt-2 flex flex-wrap gap-2">
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
            <input type="checkbox" checked={courseForm.active} onChange={(event) => setCourseForm({ ...courseForm, active: event.target.checked })} />
            Active
          </label>
          <button type="button" onClick={() => sendAction({ action: courseForm.id ? "update-course" : "create-course", ...courseForm })} className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white">
            {courseForm.id ? "Update Course" : "Add Course"}
          </button>
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-brand-700">{message}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
        <h2 className="text-base font-bold text-navy-950">Categories</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input className="h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm" placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-navy-950">
            <input type="checkbox" checked={categoryForm.active} onChange={(event) => setCategoryForm({ ...categoryForm, active: event.target.checked })} />
            Active
          </label>
          <button type="button" onClick={() => sendAction({ action: categoryForm.id ? "update-category" : "create-category", ...categoryForm })} className="rounded-xl bg-navy-950 px-5 py-3 text-sm font-bold text-white">
            {categoryForm.id ? "Update Category" : "Add Category"}
          </button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="font-bold text-navy-950">{category.name}</p>
                <p className="text-xs font-semibold text-slate-500">{category.active ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCategoryForm({ id: category.id, name: category.name, active: category.active })} className="text-sm font-bold text-brand-700">Edit</button>
                <button type="button" onClick={() => sendAction({ action: "delete-category", id: category.id })} className="text-sm font-bold text-slate-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="text-base font-bold text-navy-950">Existing courses</h2>
        </div>
        <div className="grid gap-3 p-5">
          {courses.map((course) => (
            <div key={course.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-bold text-navy-950">{course.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{course.category?.name} · {course.levels.join(", ") || "No level"} · {course.active ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCourseForm({ id: course.id, name: course.name, categoryId: course.categoryId, levels: course.levels, centerIds: course.centerIds, active: course.active })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-navy-950">Edit</button>
                  <button type="button" onClick={() => sendAction({ action: "delete-course", id: course.id })} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-bold text-brand-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p className="text-sm text-slate-600">No courses in the database yet.</p>}
        </div>
      </section>
    </div>
  );
}
