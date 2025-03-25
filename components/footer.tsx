import { cn } from "@/lib/utils"

type FooterProps = {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t py-4 px-4 md:px-6", className)}>
      <div className="container mx-auto flex justify-center items-center">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ADAG Amor Genuíno - Todos os direitos reservados
        </p>
      </div>
    </footer>
  )
}

