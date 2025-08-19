import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import type { ServerSearchParams } from "@/lib/actions/search"
import { buildSearchUrl } from "@/lib/actions/search"
import Link from "next/link"

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface SearchPaginationProps {
  lng: Locale
  searchParams: ServerSearchParams
  pagination: PaginationInfo
}

export function SearchPagination({ lng, searchParams, pagination }: SearchPaginationProps) {
  const { page, totalPages, hasNextPage, hasPreviousPage } = pagination

  // Generate page URLs
  const buildPageUrl = (pageNum: number) => {
    return buildSearchUrl(lng, { ...searchParams, page: pageNum.toString() })
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages)
      }
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous button */}
      {hasPreviousPage ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildPageUrl(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <Button key={`dots-${index}`} variant="ghost" size="sm" disabled>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )
          }

          const isCurrentPage = pageNum === page
          
          return (
            <Button
              key={pageNum}
              variant={isCurrentPage ? "default" : "outline"}
              size="sm"
              asChild={!isCurrentPage}
            >
              {isCurrentPage ? (
                <span>{pageNum}</span>
              ) : (
                <Link href={buildPageUrl(pageNum as number)}>
                  {pageNum}
                </Link>
              )}
            </Button>
          )
        })}
      </div>

      {/* Next button */}
      {hasNextPage ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildPageUrl(page + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 