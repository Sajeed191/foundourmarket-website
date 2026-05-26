import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, User as UserIcon, Mail, Phone, Globe, Upload, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account_/profile")({
  head: () => ({ meta: [{ title: "Edit Profile — FoundOurMarket™" }] }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Photo uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name,phone,country,avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? (user.user_metadata?.full_name as string) ?? "");
        setPhone(data?.phone ?? "");
        setCountry(data?.country ?? "");
        setAvatarUrl(data?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? "");
        setFetching(false);
      });
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          country: country.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        });
      if (error) throw error;
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), phone: phone.trim(), avatar_url: avatarUrl.trim() },
      });
      toast.success("Profile updated");
      nav({ to: "/account" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || fetching) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <Link to="/account" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-accent mb-6">
          <ArrowLeft className="size-3.5" /> Back to account
        </Link>
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3">Personal info</p>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-8">Edit profile</h1>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative size-20 rounded-full overflow-hidden bg-card border border-border grid place-items-center text-muted-foreground group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="size-8" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 grid place-items-center">
                <Loader2 className="size-5 animate-spin text-accent" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fullName || user.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest border border-border rounded-full px-3 py-1.5 hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-60"
              >
                <Upload className="size-3" /> {avatarUrl ? "Change photo" : "Upload photo"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" /> Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickAvatar(f); e.target.value = ""; }}
            />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field icon={UserIcon} label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              placeholder="Your name"
              className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field icon={Mail} label="Email">
            <input
              value={user.email ?? ""}
              disabled
              className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-3 text-sm text-muted-foreground"
            />
          </Field>
          <Field icon={Phone} label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              placeholder="+1 555 123 4567"
              className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field icon={Globe} label="Country">
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              maxLength={60}
              placeholder="Country"
              className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 pt-2 flex items-center gap-1.5">
            <Camera className="size-3" /> Photo uploads support gallery, camera, and albums on mobile.
          </p>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 px-8 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60"
            >
              {saving && <Loader2 className="size-3 animate-spin" />}
              Save changes
            </button>
            <Link
              to="/account"
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground px-4 py-3"
            >
              Cancel
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: typeof UserIcon; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2 block">{label}</span>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        {children}
      </div>
    </label>
  );
}
