"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { getDashboardUrlByRole } from "@/lib/utils";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (errorMessage) {
      setErrorMessage(null);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getSignInErrorMessage = (error: string) => {
    const normalized = error.toLowerCase();

    if (
      normalized === "credentialssignin" ||
      normalized.includes("invalid credentials")
    ) {
      return "رقم الهاتف أو كلمة المرور غير صحيحة";
    }

    if (
      normalized.includes("missing credentials") ||
      normalized.includes("missing")
    ) {
      return "يرجى إدخال رقم الهاتف وكلمة المرور";
    }

    if (normalized.includes("configuration")) {
      return "حدث خطأ في إعدادات تسجيل الدخول. يرجى المحاولة لاحقاً";
    }

    if (normalized.includes("accessdenied") || normalized.includes("access denied")) {
      return "ليس لديك صلاحية لتسجيل الدخول";
    }

    return "حدث خطأ أثناء تسجيل الدخول";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!formData.phoneNumber.trim() || !formData.password) {
      const message = "يرجى إدخال رقم الهاتف وكلمة المرور";
      setErrorMessage(message);
      toast.error(message);
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        const message = getSignInErrorMessage(result.error);
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      toast.success("تم تسجيل الدخول بنجاح");
      
      // Get user data to determine role and redirect accordingly
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const sessionData = await response.json();
      const userRole = sessionData?.user?.role || "USER";
      const dashboardUrl = getDashboardUrlByRole(userRole);

      // Force a full reload to ensure fresh session on the dashboard
      const target = `${dashboardUrl}?t=${Date.now()}`;
      if (typeof window !== "undefined") {
        window.location.replace(target);
      } else {
        router.replace(target);
      }
    } catch {
      const message = "حدث خطأ أثناء تسجيل الدخول";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background overflow-y-auto">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="lg" asChild>
          <Link href="/">
            <ChevronLeft className="h-10 w-10" />
          </Link>
        </Button>
      </div>
      
      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand/10 to-brand/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand/5"></div>
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center space-y-6 p-8">
            <div className="relative w-64 h-[268px] mx-auto rounded-full border-4 border-brand/20 shadow-2xl overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="/logo.png"
                  alt="Teacher"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-brand">
                مرحباً بك مرة أخرى
              </h3>
              <p className="text-lg text-muted-foreground max-w-md">
                سجل دخولك واستكشف الكورسات التعليمية المميزة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-md space-y-6 py-8 mt-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              تسجيل الدخول
            </h2>
            <p className="text-sm text-muted-foreground">
              أدخل رقم هاتفك وكلمة المرور للدخول إلى حسابك
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">رقم الهاتف</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
                disabled={isLoading}
                className="h-10"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+20XXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className="h-10"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <LoadingButton
              type="submit"
              loading={isLoading}
              loadingText="جاري تسجيل الدخول..."
              className="w-full h-10 bg-brand hover:bg-brand/90 text-white"
            >
              تسجيل الدخول
            </LoadingButton>
          </form>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">ليس لديك حساب؟ </span>
            <Link 
              href="/sign-up" 
              className="text-primary hover:underline transition-colors"
            >
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 