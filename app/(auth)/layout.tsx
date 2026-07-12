export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Đã login thì proxy.ts (GUEST_ONLY_ROUTES) redirect về home theo role
  return <>{children}</>
}
