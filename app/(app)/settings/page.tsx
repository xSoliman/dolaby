"use client";

import {
  Archive,
  ArrowRight,
  Check,
  Database,
  Download,
  LockKeyhole,
  LogOut,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { initials } from "@/lib/format";

export default function SettingsPage() {
  const router = useRouter();
  const wardrobe = useWardrobe();
  const { notify } = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  const exportData = () => {
    const payload = JSON.stringify({ items: wardrobe.items, stores: wardrobe.stores, outfits: wardrobe.outfits, wearEntries: wardrobe.wearEntries, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `dolaby-export-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url); notify("Your wardrobe export is ready.");
  };

  const leave = async () => { await wardrobe.signOut(); router.push("/"); };

  return (
    <div className="page-stack settings-page">
      <PageHeader eyebrow="Your space" title="Settings" description="Account, privacy, and a few useful wardrobe controls." />

      <div className="settings-layout">
        <nav className="settings-nav"><a href="#account" className="active"><UserRound size={17} /> Account</a><a href="#privacy"><ShieldCheck size={17} /> Privacy</a><a href="#data"><Database size={17} /> Your data</a></nav>

        <div className="settings-sections">
          <section className="settings-card" id="account">
            <div className="settings-card-heading"><div><p className="eyebrow">Account</p><h2>Your profile</h2><p>The identity attached to this private wardrobe.</p></div><span className="settings-avatar">{initials(wardrobe.profile?.name ?? "D")}</span></div>
            <div className="profile-fields"><label><span>Name</span><div>{wardrobe.profile?.name || "My wardrobe"}</div></label><label><span>Email</span><div>{wardrobe.profile?.email || "Not connected"}</div></label></div>
            {wardrobe.isDemo ? <div className="settings-inline-note"><Archive size={18} /><span><strong>You&apos;re exploring the demo</strong><small>Changes live only in this browser. Connect Supabase to create persistent private accounts.</small></span></div> : null}
            <div className="settings-card-footer"><Button variant="secondary" onClick={() => void leave()}><LogOut size={16} /> {wardrobe.isDemo ? "Leave demo" : "Sign out"}</Button></div>
          </section>

          <section className="settings-card" id="privacy">
            <div className="settings-card-heading"><div><p className="eyebrow">Privacy</p><h2>Private by default</h2><p>Your closet is yours. Sharing is not part of v1.</p></div><span className="privacy-seal"><LockKeyhole size={21} /></span></div>
            <div className="privacy-list"><div><span><Check size={14} /></span><p><strong>Your rows are isolated</strong><small>Database policies restrict every wardrobe record to its owner.</small></p></div><div><span><Check size={14} /></span><p><strong>Your images use private storage</strong><small>Photos are accessed through short-lived signed links.</small></p></div><div><span><Check size={14} /></span><p><strong>No wardrobe is publicly searchable</strong><small>There are no public profiles, follows, or closet sharing.</small></p></div></div>
          </section>

          <section className="settings-card" id="data">
            <div className="settings-card-heading"><div><p className="eyebrow">Your data</p><h2>Keep a copy</h2><p>Download the structured data behind your wardrobe at any time.</p></div><span className="data-total">{wardrobe.items.length + wardrobe.stores.length + wardrobe.outfits.length + wardrobe.wearEntries.length}<small>records</small></span></div>
            <button className="setting-action" onClick={exportData}><span className="setting-action-icon"><Download size={19} /></span><span><strong>Export wardrobe data</strong><small>Items, stores, outfits, and wear entries as JSON.</small></span><ArrowRight size={17} /></button>
            {wardrobe.isDemo ? <button className="setting-action danger-action" onClick={() => setResetOpen(true)}><span className="setting-action-icon"><RotateCcw size={19} /></span><span><strong>Reset the demo wardrobe</strong><small>Restore the original sample items and history.</small></span><ArrowRight size={17} /></button> : null}
          </section>
        </div>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset the demo wardrobe?" eyebrow="Start fresh" size="sm">
        <div className="confirm-dialog"><span className="confirm-icon"><RotateCcw size={21} /></span><p>Every change you made in demo mode will be replaced by the original sample wardrobe.</p><div><Button variant="secondary" onClick={() => setResetOpen(false)}>Keep my changes</Button><Button variant="danger" onClick={() => { wardrobe.resetDemo(); setResetOpen(false); notify("Demo wardrobe restored."); }}>Reset demo</Button></div></div>
      </Modal>
    </div>
  );
}
