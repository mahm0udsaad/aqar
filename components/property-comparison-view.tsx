"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { X, ExternalLink, Trash2, MapPin, Bed, Bath, Maximize2, Home, Eye } from "lucide-react"
import { useComparison, PropertyForComparison } from "@/contexts/comparison-context"

interface PropertyComparisonViewProps {
  lng: string
  dict: any
}

export function PropertyComparisonView({ lng, dict }: PropertyComparisonViewProps) {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison()
  const [mounted, setMounted] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyForComparison | null>(null)
  console.log(comparisonList)
  const handleViewMap = (property: PropertyForComparison) => {
    setSelectedProperty(property)
  }

  const handleCloseMap = () => {
    setSelectedProperty(null)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading comparison...</div>
  }

  if (comparisonList.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="max-w-md mx-auto">
            <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Properties to Compare</h3>
            <p className="text-muted-foreground mb-6">
              Start adding properties to your comparison list to see them here. You can compare up to 4 properties side by side.
            </p>
            <Link href={`/${lng}/search`}>
              <Button>Browse Properties</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseMap}>
          <div className="bg-white p-4 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={selectedProperty.location_iframe_url}
              width="800"
              height="600"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      )}
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Comparing {comparisonList.length} Properties
          </h2>
          <p className="text-sm text-muted-foreground">
            Compare key features and specifications
          </p>
        </div>
        <Button variant="outline" onClick={clearComparison}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Properties Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisonList.map((property: PropertyForComparison) => (
          <Card key={property.id} className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
              onClick={() => removeFromComparison(property.id)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <CardContent className="p-4">
              <Link href={`/${lng}/properties/${property.id}`}>
                <div className="relative h-32 mb-3 overflow-hidden rounded cursor-pointer">
                  <Image
                    src={property.thumbnail_url || property.property_images?.[0]?.url || "/placeholder.svg"}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>
              
              <h3 className="font-medium text-sm mb-2 line-clamp-2">{property.title}</h3>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {property.location}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {property.property_type === "sale" ? "For Sale" : "For Rent"}
                  </Badge>
                  <Link href={`/${lng}/properties/${property.id}`}>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                  {property.location_iframe_url && (
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleViewMap(property)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Feature</TableHead>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableHead key={property.id} className="text-center min-w-48">
                      <div className="flex flex-col items-center">
                        <div className="text-sm font-medium line-clamp-2">{property.title}</div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Price</TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      <div className="font-semibold text-lg text-primary">
                        {formatPrice(property.price)}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Location</TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      {property.location}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Area</TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      {property.area}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Type</TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      <Badge variant={property.property_type === "sale" ? "default" : "secondary"}>
                        {property.property_type === "sale" ? "For Sale" : "For Rent"}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-2" />
                      Bedrooms
                    </div>
                  </TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      {property.bedrooms}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Bath className="w-4 h-4 mr-2" />
                      Bathrooms
                    </div>
                  </TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      {property.bathrooms}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Size (sqm)
                    </div>
                  </TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      {property.size} m²
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Price per m²</TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      {formatPrice(Math.round(property.price / property.size))}/m²
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Actions</TableCell>
                  {comparisonList.map((property: PropertyForComparison) => (
                    <TableCell key={property.id} className="text-center">
                      <div className="flex flex-col gap-2">
                        <Link href={`/${lng}/properties/${property.id}`}>
                          <Button size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeFromComparison(property.id)}
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 