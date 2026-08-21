"use client";

import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";

export default function WelcomePage() {
  const router = useRouter();
  const { signIn, signUp, enterDemo, isConfigured, profile, isDemo } = useWardrobe();
  const { notify } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openDemo = () => {
    enterDemo();
    router.push("/home");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.push("/home");
      } else {
        const signedIn = await signUp(name, email, password);
        if (signedIn) router.push("/home");
        else notify("Check your email to confirm your account.");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-story-inner">
          <Logo href="/" light />
          <div className="auth-copy">
            <span className="auth-kicker"><Sparkles size={14} /> A calmer way to get dressed</span>
            <h1>Your wardrobe,<br /><em>finally in view.</em></h1>
            <p>
              Know what you own, remember what works, and step into your day with less deciding.
            </p>
          </div>

          <div className="auth-collage" aria-hidden="true">
            <div className="collage-card collage-main">
              <img
                src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85"
                alt=""
              />
              <span><strong>Olive field jacket</strong><small>Outerwear · Loved</small></span>
            </div>
            <div className="collage-card collage-small collage-top">
              <img
                src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=85"
                alt=""
              />
            </div>
            <div className="collage-card collage-small collage-bottom">
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=85"
                alt=""
              />
            </div>
            <div className="collage-note">
              <Check size={16} />
              <span><strong>Outfit saved</strong><small>Easy Thursday</small></span>
            </div>
          </div>

          <p className="auth-privacy"><LockKeyhole size={14} /> Your wardrobe stays private by default.</p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand"><Logo href="/" /></div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <p className="eyebrow">Welcome to your closet</p>
            <h2>{mode === "signin" ? "Good to see you again." : "Make getting dressed easier."}</h2>
            <p>
              {mode === "signin"
                ? "Sign in to pick up where you left off."
                : "Create your private digital wardrobe in a minute."}
            </p>
          </div>

          <div className="auth-tabs" role="tablist">
            <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button>
          </div>

          {isConfigured ? (
            <form className="auth-form" onSubmit={submit}>
              {mode === "signup" ? (
                <label>
                  <span>Your name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nour Hassan"
                    autoComplete="name"
                    required
                  />
                </label>
              ) : null}
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <span className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Show password">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              <Button type="submit" size="lg" fullWidth disabled={submitting}>
                {submitting ? "One moment…" : mode === "signin" ? "Sign in" : "Create my wardrobe"}
                {!submitting ? <ArrowRight size={17} /> : null}
              </Button>
            </form>
          ) : (
            <div className="setup-notice">
              <span className="setup-icon"><LockKeyhole size={20} /></span>
              <div>
                <strong>Authentication is ready to connect</strong>
                <p>Add your Supabase keys to <code>.env.local</code> to enable private accounts.</p>
              </div>
            </div>
          )}

          <div className="auth-divider"><span>or</span></div>

          <Button variant="secondary" size="lg" fullWidth onClick={openDemo}>
            {profile && isDemo ? "Continue in demo wardrobe" : "Explore the demo wardrobe"}
            <ArrowRight size={17} />
          </Button>
          <p className="demo-note">No account needed. Your demo changes stay on this device.</p>
        </div>

        <footer className="auth-footer">
          <span>© 2026 Dolaby</span>
          <span>Made for more intentional mornings.</span>
        </footer>
      </section>
    </main>
  );
}
