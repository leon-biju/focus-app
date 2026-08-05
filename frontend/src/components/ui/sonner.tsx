import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/layout/theme-provider"

export function Toaster(props: ToasterProps) {
  const { theme } = useTheme()
  return <Sonner theme={theme} richColors position="bottom-right" {...props} />
}
