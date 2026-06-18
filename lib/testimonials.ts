/**
 * Validate a testimonial object. Returns an error string, or null if valid.
 */
export function validateTestimonial(data: Record<string, unknown>): string | null {
  const quote = String(data.quote || '').trim();
  if (!quote) return 'Quote is required';

  const author = String(data.author || '').trim();
  if (!author) return 'Author is required';

  return null;
}

export interface TestimonialDTO {
  id: string;
  quote: string;
  author: string;
  company: string | null;
  logo: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}
