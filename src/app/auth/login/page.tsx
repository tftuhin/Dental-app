"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToothIcon } from "@/components/icons/dental-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password. Please verify your credentials.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("DentAI2026!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 p-4 dark:from-slate-950 dark:via-teal-950/10 dark:to-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ToothIcon className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            DentAI OS
          </h1>
          <p className="text-sm text-muted-foreground">
            Enterprise AI Dental Practice Management & Clinical EHR
          </p>
        </div>

        {/* Card */}
        <Card className="border shadow-xl backdrop-blur-sm bg-card/90">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold">Clinician Portal</CardTitle>
            <CardDescription className="text-xs">
              Sign in with your clinical credentials or Google Workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@dentai-clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-medium"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In to Clinic"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or test with demo profile
                </span>
              </div>
            </div>

            {/* Quick Demo Credentials */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start h-auto py-2 px-2.5 flex-col items-start gap-0.5 text-left"
                onClick={() => handleDemoLogin("dr.smith@dentai.com")}
              >
                <span className="font-semibold text-foreground">Dr. Sarah Smith</span>
                <span className="text-[10px] text-muted-foreground">Dental Surgeon (Admin)</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start h-auto py-2 px-2.5 flex-col items-start gap-0.5 text-left"
                onClick={() => handleDemoLogin("reception@dentai.com")}
              >
                <span className="font-semibold text-foreground">Front Desk</span>
                <span className="text-[10px] text-muted-foreground">Reception & Billing</span>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2 border-t text-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>HIPAA Compliant & End-to-End Encrypted</span>
            </div>
            <p>
              Need a clinic account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Register New Practice
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
