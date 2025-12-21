/**
 * Upload Service
 * 
 * Service for uploading files to the server
 */
import type { FileUploadResponse } from "../api/types";
import { storage } from "@truths/utils";
import { STORAGE_KEYS } from "@truths/config";

const BASE_ENDPOINT = "/api/v1/upload/"; // Trailing slash is required by FastAPI

// Helper to get API base URL
const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        // @ts-ignore - Vite env variables
        return import.meta.env.VITE_API_BASE_URL || "";
    }
    return "";
};

// Helper to transform relative URLs to absolute URLs
const transformImageUrl = (url: string): string => {
    // If URL is already absolute (starts with http:// or https://), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If URL is relative (starts with /), prepend API base URL
    if (url.startsWith('/')) {
        const apiBaseUrl = getApiBaseUrl();
        // Remove trailing slash from API base URL if present
        const baseUrl = apiBaseUrl.replace(/\/$/, '');
        return `${baseUrl}${url}`;
    }

    // Return as-is if it doesn't match expected patterns
    return url;
};

// Helper to get auth token
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        // Use storage.get() which properly handles JSON.parse, not raw localStorage.getItem()
        return storage.get<string>(STORAGE_KEYS.AUTH_TOKEN) || "";
    }
    return "";
};

export const uploadService = {
    /**
     * Upload a file
     */
    async uploadFile(file: File): Promise<FileUploadResponse> {
        const token = getAuthToken();
        if (!token) {
            throw new Error("Authentication required. Please log in to upload files.");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${getApiBaseUrl()}${BASE_ENDPOINT}`, {
            method: "POST",
            body: formData,
            headers: {
                // Don't set Content-Type - browser will set it with boundary for multipart/form-data
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 401) {
                throw new Error("Authentication failed. Please log in again.");
            }
            throw new Error(`Upload failed: ${errorText || response.statusText}`);
        }

        const result = await response.json();
        // Transform the URL to be absolute if it's relative
        if (result.url) {
            result.url = transformImageUrl(result.url);
        }
        return result;
    },

    /**
     * Upload an image file (venue floor plan, section image, etc.)
     */
    async uploadImage(file: File): Promise<FileUploadResponse> {
        // Validate file is an image
        if (!file.type.startsWith("image/")) {
            throw new Error("File must be an image");
        }

        return this.uploadFile(file);
    },

    /**
     * Delete an uploaded file
     */
    async deleteFile(fileId: string): Promise<void> {
        const token = getAuthToken();
        if (!token) {
            throw new Error("Authentication required. Please log in to delete files.");
        }

        const response = await fetch(`${getApiBaseUrl()}${BASE_ENDPOINT}/${fileId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 401) {
                throw new Error("Authentication failed. Please log in again.");
            }
            throw new Error(`Delete failed: ${errorText || response.statusText}`);
        }
    },
};
