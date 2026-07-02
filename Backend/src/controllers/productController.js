import mongoose from "mongoose";

import { cloudinary } from "../config/cloudinary.js";
import Product, {
  badges,
  currencies,
  genders,
  stockTypes,
  storedCategories,
} from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import { ensureCheckoutPrice, normalizeProductPricing } from "../utils/productPricing.js";
import { normalizeOption } from "../utils/productOptions.js";

const requiredProductFields = [
  "name",
  "description",
  "shortDescription",
  "categories",
  "displayCategory",
  "gender",
  "currency",
  "badge",
  "stockType",
];

const writableProductFields = [
  "name",
  "slug",
  "description",
  "shortDescription",
  "categories",
  "displayCategory",
  "gender",
  "price",
  "priceAmount",
  "displayPrice",
  "isQuoteOnly",
  "numericPrice",
  "currency",
  "badge",
  "stockType",
  "isFeatured",
  "isActive",
  "inventory",
  "trackInventory",
  "variations",
  "sizes",
  "colors",
  "fabric",
  "careInstructions",
];

const allowedSorts = new Set([
  "createdAt",
  "-createdAt",
  "name",
  "-name",
  "priceAmount",
  "-priceAmount",
  "isFeatured",
  "-isFeatured",
]);

const getSafeSort = (sort) => (allowedSorts.has(sort) ? sort : "-createdAt");
const PRODUCT_UPLOAD_FOLDER = "nebeda/products";

const getPagination = (page = 1, limit = 10, maxLimit = 50) => {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), maxLimit);
  return {
    limitNumber,
    pageNumber,
    skip: (pageNumber - 1) * limitNumber,
  };
};

const parseArrayField = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [String(parsed).trim()].filter(Boolean);
    return parsed;
  } catch (_error) {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const parseBooleanField = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return value;
};

const parseNumberField = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
};

const createValidationError = (errors) => {
  const error = new Error("Product validation failed");
  error.errors = errors;
  return error;
};

const safeCloudinaryError = (error) => ({
  message: error.message,
  httpCode: error.http_code,
  name: error.name,
});

const normalizeProductPayload = (body) => {
  const payload = {};

  writableProductFields.forEach((field) => {
    if (Object.hasOwn(body, field)) {
      payload[field] = body[field];
    }
  });

  if (Object.hasOwn(body, "categories")) {
    payload.categories = parseArrayField(body.categories);
  }

  if (Object.hasOwn(body, "colors")) {
    payload.colors = [...new Set(parseArrayField(body.colors).map((item) => String(item).trim()).filter(Boolean))];
  }

  if (Object.hasOwn(body, "sizes")) {
    payload.sizes = [...new Set(parseArrayField(body.sizes).map((item) => String(item).trim()).filter(Boolean))];
  }

  if (Object.hasOwn(body, "variations")) {
    payload.variations = parseArrayField(body.variations);
  }

  if (Object.hasOwn(body, "isFeatured")) {
    payload.isFeatured = parseBooleanField(body.isFeatured);
  }

  if (Object.hasOwn(body, "isActive")) {
    payload.isActive = parseBooleanField(body.isActive);
  }

  if (Object.hasOwn(body, "isQuoteOnly")) {
    payload.isQuoteOnly = parseBooleanField(body.isQuoteOnly);
  }

  if (Object.hasOwn(body, "trackInventory")) {
    payload.trackInventory = parseBooleanField(body.trackInventory);
  }

  if (Object.hasOwn(body, "inventory")) {
    payload.inventory = parseNumberField(body.inventory);
  }

  if (Object.hasOwn(body, "priceAmount")) {
    payload.priceAmount = parseNumberField(body.priceAmount);
  } else if (Object.hasOwn(body, "numericPrice")) {
    payload.priceAmount = parseNumberField(body.numericPrice);
  }

  if (!payload.description && payload.shortDescription) {
    payload.description = payload.shortDescription;
  }

  return payload;
};

const validateProductPayload = (payload, { partial = false } = {}) => {
  if (!partial) {
    const errors = {};

    requiredProductFields.forEach((field) => {
      const value = payload[field];
      if (Array.isArray(value) ? value.length === 0 : !value) {
        errors[field] = `${field} is required`;
      }
    });

    if (Object.keys(errors).length) {
      return errors;
    }
  }

  if (payload.categories !== undefined) {
    if (!Array.isArray(payload.categories) || payload.categories.length === 0) {
      return { categories: "At least one category is required" };
    }

    if (payload.categories.includes("All")) {
      return {
        categories:
          "Do not store All inside product categories. All is only for frontend filtering.",
      };
    }

    const invalidCategory = payload.categories.find(
      (category) => !storedCategories.includes(category)
    );

    if (invalidCategory) {
      return { categories: `${invalidCategory} is not a valid product category` };
    }
  }

  if (payload.gender !== undefined && !genders.includes(payload.gender)) {
    return { gender: `${payload.gender} is not a valid gender` };
  }

  if (payload.currency !== undefined && !currencies.includes(payload.currency)) {
    return { currency: `${payload.currency} is not a valid currency` };
  }

  if (payload.badge !== undefined && !badges.includes(payload.badge)) {
    return { badge: `${payload.badge} is not a valid badge` };
  }

  if (payload.stockType !== undefined && !stockTypes.includes(payload.stockType)) {
    return { stockType: `${payload.stockType} is not a valid stock type` };
  }

  if (payload.isQuoteOnly !== true) {
    if (typeof payload.priceAmount !== "number" || !Number.isFinite(payload.priceAmount) || payload.priceAmount <= 0) {
      return { priceAmount: "A valid numeric price is required for products sold online" };
    }
  }

  if (payload.variations !== undefined && !Array.isArray(payload.variations)) {
    return { variations: "variations must be an array" };
  }

  if (Array.isArray(payload.variations)) {
    const invalidVariation = payload.variations.find((variation) =>
      (variation.size && !payload.sizes?.some((size) => normalizeOption(size) === normalizeOption(variation.size))) ||
      (variation.color && !payload.colors?.some((color) => normalizeOption(color) === normalizeOption(variation.color))) ||
      (variation.stock !== undefined && (!Number.isFinite(Number(variation.stock)) || Number(variation.stock) < 0))
    );
    if (invalidVariation) return { variations: "A variation contains an invalid size, colour, or stock value" };
  }

  if (
    payload.inventory !== undefined &&
    (typeof payload.inventory !== "number" || payload.inventory < 0)
  ) {
    return { inventory: "inventory must be a positive number" };
  }

  return null;
};

const normalizeProductForResponse = (product) => {
  normalizeProductPricing(product);
  return product;
};

const uploadProductImagesToCloudinary = async (files = [], productName) => {
  if (!files.length) {
    return [];
  }

  return Promise.all(
    files.map((file) =>
      uploadToCloudinary({
        buffer: file.buffer,
        folder: PRODUCT_UPLOAD_FOLDER,
        alt: productName,
      })
    )
  );
};

const createProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  payload.careInstructions ||= "";
  normalizeProductPricing(payload);
  const validationError = validateProductPayload(payload);

  if (validationError) {
    res.status(400);
    throw createValidationError(validationError);
  }

  if (!req.files?.length) {
    res.status(400);
    throw createValidationError({ images: "At least one product image is required" });
  }

  let uploadedImages = [];
  try {
    uploadedImages = await uploadProductImagesToCloudinary(req.files, payload.name);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Cloudinary product upload failed:", safeCloudinaryError(error));
    }
    res.status(error.statusCode || 502);
    throw new Error(
      error.message || "Image upload failed. Please check Cloudinary configuration."
    );
  }

  const product = await Product.create({
    ...payload,
    images: uploadedImages,
    ...(uploadedImages[0] && { mainImage: uploadedImages[0] }),
    createdBy: req.admin._id,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: normalizeProductForResponse(product),
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    gender,
    badge,
    featured,
    search,
    page = 1,
    limit = 10,
    sort = "-createdAt",
  } = req.query;

  const { limitNumber, pageNumber, skip } = getPagination(page, limit);
  const query = { isActive: true };

  if (category && category !== "All") {
    query.categories = category;
  }

  if (gender) {
    query.gender = gender;
  }

  if (badge) {
    query.badge = badge;
  }

  if (featured !== undefined) {
    query.isFeatured = featured === "true";
  }

  if (search) {
    query.$text = { $search: search };
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(getSafeSort(sort))
    .skip(skip)
    .limit(limitNumber);

  await Promise.all(products.map((product) => ensureCheckoutPrice(product)));

  res.json({
    success: true,
    count: products.length,
    page: pageNumber,
    pages: Math.ceil(total / limitNumber) || 1,
    total,
    products: products.map(normalizeProductForResponse),
  });
});

const getProductById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findOne({ _id: req.params.id, isActive: true });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await ensureCheckoutPrice(product);

  res.json({
    success: true,
    product: normalizeProductForResponse(product),
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug.toLowerCase(),
    isActive: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await ensureCheckoutPrice(product);

  res.json({
    success: true,
    product: normalizeProductForResponse(product),
  });
});

const adminGetProductById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await ensureCheckoutPrice(product);

  res.json({
    success: true,
    product: normalizeProductForResponse(product),
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const payload = normalizeProductPayload(req.body);
  const prospectiveProduct = {
    ...product.toObject(),
    ...payload,
  };
  normalizeProductPricing(prospectiveProduct);
  payload.priceAmount = prospectiveProduct.priceAmount;
  payload.numericPrice = prospectiveProduct.numericPrice;
  payload.currency = prospectiveProduct.currency;
  payload.displayPrice = prospectiveProduct.displayPrice;
  payload.price = prospectiveProduct.price;
  payload.isQuoteOnly = prospectiveProduct.isQuoteOnly;
  const validationError = validateProductPayload(prospectiveProduct);

  if (validationError) {
    res.status(400);
    throw createValidationError(validationError);
  }

  let uploadedImages = [];
  try {
    uploadedImages = await uploadProductImagesToCloudinary(
      req.files,
      payload.name || product.name
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Cloudinary product upload failed:", safeCloudinaryError(error));
    }
    res.status(error.statusCode || 502);
    throw new Error(
      error.message || "Image upload failed. Please check Cloudinary configuration."
    );
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      product[key] = value;
    }
  });

  if (uploadedImages.length) {
    product.images = [...product.images, ...uploadedImages];

    if (!product.mainImage?.url) {
      product.mainImage = uploadedImages[0];
    }
  }

  product.updatedBy = req.admin._id;
  await product.save();

  res.json({
    success: true,
    message: "Product updated successfully",
    product: normalizeProductForResponse(product),
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.isActive = false;
  product.updatedBy = req.admin._id;
  await product.save();

  res.json({
    success: true,
    message: "Product archived successfully",
    product: normalizeProductForResponse(product),
  });
});

const restoreProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.isActive = true;
  product.updatedBy = req.admin._id;
  await product.save();

  res.json({
    success: true,
    message: "Product restored successfully",
    product: normalizeProductForResponse(product),
  });
});

const permanentlyDeleteProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const publicIds = [
    ...(product.images || []).map((image) => image.publicId),
    product.mainImage?.publicId,
  ].filter(Boolean);
  const uniquePublicIds = [...new Set(publicIds)];

  const deleteResults = await Promise.allSettled(
    uniquePublicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, { resource_type: "image" })
    )
  );
  const failedDeletes = deleteResults
    .map((result, index) =>
      result.status === "rejected"
        ? {
            publicId: uniquePublicIds[index],
            message: result.reason?.message || "Cloudinary image delete failed",
          }
        : null
    )
    .filter(Boolean);

  await product.deleteOne();

  res.json({
    success: true,
    message: failedDeletes.length
      ? "Product deleted permanently. Some Cloudinary images could not be deleted."
      : "Product deleted permanently",
    warnings: failedDeletes,
  });
});

const deleteProductImage = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const { publicId } = req.body;

  if (!publicId) {
    res.status(400);
    throw new Error("publicId is required");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const imageExists = product.images.some((image) => image.publicId === publicId);

  if (!imageExists) {
    res.status(404);
    throw new Error("Product image not found");
  }

  try {
    if (cloudinary.config().cloud_name) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }
  } catch (error) {
    res.status(502);
    throw new Error(`Cloudinary image delete failed: ${error.message}`);
  }

  product.images = product.images.filter((image) => image.publicId !== publicId);
  product.mainImage =
    product.mainImage?.publicId === publicId ? product.images[0] : product.mainImage;
  product.updatedBy = req.admin._id;
  await product.save();

  res.json({
    success: true,
    message: "Product image deleted successfully",
    product: normalizeProductForResponse(product),
  });
});

const adminGetProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "-createdAt", search, category, status } = req.query;
  const { limitNumber, pageNumber, skip } = getPagination(page, limit, 200);
  const query = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (category && category !== "All") {
    query.categories = category;
  }

  if (status === "Active") {
    query.isActive = true;
  }

  if (status === "Inactive") {
    query.isActive = false;
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(getSafeSort(sort))
    .skip(skip)
    .limit(limitNumber);

  await Promise.all(products.map((product) => ensureCheckoutPrice(product)));

  res.json({
    success: true,
    count: products.length,
    page: pageNumber,
    pages: Math.ceil(total / limitNumber) || 1,
    total,
    products: products.map(normalizeProductForResponse),
  });
});

export {
  adminGetProductById,
  adminGetProducts,
  createProduct,
  deleteProduct,
  deleteProductImage,
  getProductById,
  getProductBySlug,
  permanentlyDeleteProduct,
  getProducts,
  restoreProduct,
  updateProduct,
};
