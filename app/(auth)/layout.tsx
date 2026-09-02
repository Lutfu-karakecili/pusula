import { Compass } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-pusula p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Pusula</h1>
          <p className="text-sm text-white/80">YKS Koçluk Platformu</p>
        </div>
        {children}
      </div>
    </div>
  );
}
