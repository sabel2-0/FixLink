export const REVIEW_CATEGORIES = ["Workmanship", "Punctuality", "Cleanliness", "Price fairness"] as const
export type ReviewCategory = typeof REVIEW_CATEGORIES[number]
