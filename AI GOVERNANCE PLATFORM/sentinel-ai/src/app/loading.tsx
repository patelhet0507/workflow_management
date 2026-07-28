import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
    </div>
  )
}
