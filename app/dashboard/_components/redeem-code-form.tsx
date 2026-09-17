"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Check } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const RedeemCodeForm = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemedCourseTitle, setRedeemedCourseTitle] = useState<string | null>(null);

  const handleRedeemCode = async () => {
    if (!code.trim()) {
      toast.error("يرجى إدخال الكود");
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await fetch("/api/codes/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        const courseTitle = data.course?.title || "الكورس";
        setRedeemedCourseTitle(courseTitle);
        toast.success(`تم تفعيل الكورس: ${courseTitle}`);
        setCode("");
        router.refresh();
      } else {
        const error = await response.text();
        if (error.includes("already been used")) {
          toast.error("هذا الكود مستخدم بالفعل");
        } else if (error.includes("already purchased")) {
          toast.error("لقد قمت بشراء هذه الكورس مسبقاً");
        } else if (error.includes("Invalid code")) {
          toast.error("كود غير صحيح");
        } else {
          toast.error(error || "حدث خطأ أثناء تفعيل الكود");
        }
      }
    } catch (error) {
      console.error("Error redeeming code:", error);
      toast.error("حدث خطأ أثناء تفعيل الكود");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-full bg-brand/10 p-3">
          <Ticket className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">تفعيل كورس بالكود</h2>
          <p className="text-sm text-muted-foreground">
            أدخل كود التفعيل لشراء الكورس وإضافته إلى كورساتك تلقائياً
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="dashboard-redeem-code" className="sr-only">
            كود التفعيل
          </Label>
          <Input
            id="dashboard-redeem-code"
            placeholder="أدخل كود التفعيل هنا"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRedeemCode();
              }
            }}
            disabled={isRedeeming}
            className="h-11 text-center font-mono tracking-wider"
          />
        </div>
        <Button
          onClick={handleRedeemCode}
          disabled={isRedeeming || !code.trim()}
          className="h-11 bg-brand text-white hover:bg-brand/90 sm:min-w-[140px]"
        >
          {isRedeeming ? "جاري التفعيل..." : "تفعيل الكورس"}
        </Button>
      </div>

      {redeemedCourseTitle && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          <span>تم تفعيل كورس "{redeemedCourseTitle}" بنجاح</span>
        </div>
      )}
    </div>
  );
};
