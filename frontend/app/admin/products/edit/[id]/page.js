"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "../../../../../context/AuthContext";
import { apiFetch } from "../../../../../utils/api";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id;

  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        setError("");

        const [productResponse, categoryResponse] =
          await Promise.all([
            apiFetch(
              `http://localhost:8000/products/${productId}`
            ),
            apiFetch(
              "http://localhost:8000/categories/"
            ),
          ]);

        const productData = await productResponse.json();
        const categoryData = await categoryResponse.json();

        if (!productResponse.ok) {
          throw new Error(
            productData.detail || "Failed to fetch product"
          );
        }

        if (!categoryResponse.ok) {
          throw new Error(
            categoryData.detail || "Failed to fetch categories"
          );
        }

        setFormData({
          name: productData.name,
          description: productData.description || "",
          price: productData.price,
          stock: productData.stock,
          category_id: productData.category_id,
        });

        setCategories(categoryData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, user, authLoading, router]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await apiFetch(
        `http://localhost:8000/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            stock: Number(formData.stock),
            category_id: Number(formData.category_id),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update product"
        );
      }

      router.push("/admin/products");
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
          Loading product...
        </p>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-900 p-10">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-4xl font-bold text-white">
          Edit Product
        </h1>

        <p className="mt-2 text-gray-400">
          Update product information.
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
              Product Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
            />
          </div>

          <div className="mt-5">
            <label className="font-semibold text-gray-900">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <div>
              <label className="font-semibold text-gray-900">
                Price
              </label>

              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-900">
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
              />
            </div>

          </div>

          <div className="mt-5">
            <label className="font-semibold text-gray-900">
              Category
            </label>

            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
            >
              <option value="">
                Select a category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 flex gap-4">

            <button
              type="button"
              onClick={() =>
                router.push("/admin/products")
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