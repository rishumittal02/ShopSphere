"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "../../../../../context/AuthContext";
import { apiFetch } from "../../../../../utils/api";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();

  const categoryId = params.id;

  const { user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    const fetchCategory = async () => {
      try {
        setError("");

        const response = await apiFetch(
          "http://localhost:8000/categories/"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to fetch categories"
          );
        }

        const category = data.find(
          (item) => item.id === Number(categoryId)
        );

        if (!category) {
          throw new Error("Category not found");
        }

        setName(category.name);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId, user, authLoading, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await apiFetch(
        `http://localhost:8000/categories/${categoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update category"
        );
      }

      router.push("/admin/categories");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-900 p-10">
        <p className="text-center text-white">
          Loading category...
        </p>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-900 p-10">
      <div className="mx-auto max-w-2xl">

        <h1 className="text-4xl font-bold text-white">
          Edit Category
        </h1>

        <p className="mt-2 text-gray-400">
          Update the category name.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl bg-white p-8 shadow-lg"
        >

          {error && (
            <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="font-semibold text-gray-900">
              Category Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
            />
          </div>

          <div className="mt-8 flex gap-4">

            <button
              type="button"
              onClick={() =>
                router.push("/admin/categories")
              }
              className="flex-1 rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}