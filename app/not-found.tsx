// app/not-found.tsx
import Link from "next/link"
import { ArrowLeft, Home, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-1px)] bg-background">
            <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16 sm:py-24">
                <Card className="w-full border-border/50">
                    <CardHeader className="space-y-2">
                        <div className="text-xs text-muted-foreground">Error 404</div>
                        <CardTitle className="text-2xl sm:text-3xl font-light tracking-tight">
                            Page not found
                        </CardTitle>
                        <CardDescription className="text-sm">
                            The link may be broken, or the page may have been moved or deleted. <br /> Think this is a mistake? <Link href="mailto:support@menengai.cloud" className="text-primary hover:underline">Contact us</Link>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-4">
                        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-background border">
                                    <Search className="h-4 w-4" />
                                </div>
                                <div className="leading-relaxed">
                                    Try checking the URL, or use one of the shortcuts below to get back on track.
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Go home
                            </Link>
                        </Button>

                        <Button asChild className="w-full sm:w-auto">
                            <Link href="/products">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Browse products
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
