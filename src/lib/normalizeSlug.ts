import {transliterate} from "transliteration";

export default function normalizeSlug(slug: string): string {
    return transliterate(slug)
        .replace(/\+/g, '-plus-')
        .replace(/\./g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '')
        .toLowerCase();
}