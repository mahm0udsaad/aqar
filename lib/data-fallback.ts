// Fallback data when Supabase is not configured
export const fallbackCategories = [
  {
    id: "1",
    name: "Apartments",
    slug: "apartments",
    description: "Modern apartments in prime locations",
    icon: "Building",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Villas",
    slug: "villas",
    description: "Luxury villas with gardens",
    icon: "Home",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const fallbackProperties = [
  {
    id: "1",
    title: "Modern Apartment in New Cairo",
    description: "Beautiful 3-bedroom apartment with city views",
    price: 2500000,
    location: "New Cairo, Egypt",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    property_type: "Apartment",
    listing_type: "sale" as const,
    category_id: "1",
    featured: true,
    active: true,
    amenities: ["Parking", "Gym", "Pool"],
    images: ["/images/property-1.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: fallbackCategories[0],
  },
]
