"use client";

import { useState } from "react";
import WriteReviewForm from "./WriteReviewForm";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
};

// Tabs Descripción/Reseñas portadas de product-details.html (líneas
// ~1023-1360, ids pills-description / pills-reviews). El template las
// manejaba con data-bs-toggle="pill" de bootstrap.bundle.min.js (no
// cargado); acá se reemplaza por un useState simple.
export default function ProductTabs({
  productId,
  productSlug,
  description,
  attributes,
  reviews,
  ratingAvg,
  ratingCount,
}: {
  productId: string;
  productSlug: string;
  description: string | null;
  attributes: Record<string, unknown>;
  reviews: Review[];
  ratingAvg: number;
  ratingCount: number;
}) {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );
  const attributeEntries = Object.entries(attributes ?? {});

  return (
    <div className="pt-80">
      <div className="product-dContent border rounded-24">
        <div className="product-dContent__header border-bottom border-gray-100 flex-between flex-wrap gap-16">
          <ul className="nav common-tab nav-pills mb-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link ${activeTab === "description" ? "active" : ""}`}
                onClick={() => setActiveTab("description")}
              >
                Descripción
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link ${activeTab === "reviews" ? "active" : ""}`}
                onClick={() => setActiveTab("reviews")}
              >
                Reseñas ({ratingCount})
              </button>
            </li>
          </ul>
        </div>
        <div className="product-dContent__box">
          <div className="tab-content">
            {activeTab === "description" && (
              <div className="tab-pane fade show active">
                <div className="mb-40">
                  <h6 className="mb-24">Descripción del producto</h6>
                  {description ? (
                    <p style={{ whiteSpace: "pre-line" }}>{description}</p>
                  ) : (
                    <p className="text-gray-500">
                      Este producto todavía no tiene una descripción detallada.
                    </p>
                  )}
                </div>

                {attributeEntries.length > 0 && (
                  <div className="mb-0">
                    <h6 className="mb-24">Especificaciones</h6>
                    <ul className="mt-32">
                      {attributeEntries.map(([key, value]) => (
                        <li
                          key={key}
                          className="text-gray-400 mb-14 flex-align gap-14"
                        >
                          <span className="w-20 h-20 bg-main-50 text-main-600 text-xs flex-center rounded-circle">
                            <i className="ph ph-check" />
                          </span>
                          <span className="text-heading fw-medium">
                            {key}:<span className="text-gray-500"> {String(value)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="tab-pane fade show active">
                <div className="row g-4">
                  <div className="col-lg-6">
                    <h6 className="mb-24">Comentarios de clientes</h6>
                    {reviews.length === 0 ? (
                      <p className="text-gray-500">
                        Todavía no hay reseñas para este producto.
                      </p>
                    ) : (
                      reviews.map((review) => (
                        <div
                          key={review.id}
                          className="d-flex align-items-start gap-24 pb-24 border-bottom border-gray-100 mb-24"
                        >
                          <div className="flex-grow-1">
                            <div className="flex-between align-items-start gap-8">
                              <div>
                                <div className="flex-align gap-8">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-15 fw-medium d-flex ${
                                        i < review.rating
                                          ? "text-warning-600"
                                          : "text-gray-200"
                                      }`}
                                    >
                                      <i className="ph-fill ph-star" />
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-gray-800 text-xs">
                                {new Date(review.createdAt).toLocaleDateString(
                                  "es-NI"
                                )}
                              </span>
                            </div>
                            {review.title && (
                              <h6 className="mb-14 text-md mt-24">
                                {review.title}
                              </h6>
                            )}
                            {review.comment && (
                              <p className="text-gray-700">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <WriteReviewForm productId={productId} productSlug={productSlug} />
                  </div>
                  <div className="col-lg-6">
                    <div className="ms-xxl-5">
                      <h6 className="mb-24">Calificación general</h6>
                      <div className="border border-gray-100 rounded-8 px-40 py-52 flex-center flex-column flex-shrink-0 text-center">
                        <h2 className="mb-6 text-main-600">
                          {ratingAvg.toFixed(1)}
                        </h2>
                        <div className="flex-center gap-8">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-15 fw-medium d-flex ${
                                i < Math.round(ratingAvg)
                                  ? "text-warning-600"
                                  : "text-gray-200"
                              }`}
                            >
                              <i className="ph-fill ph-star" />
                            </span>
                          ))}
                        </div>
                        <span className="mt-16 text-gray-500">
                          {ratingCount} reseña{ratingCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
