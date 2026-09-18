"use client";

import { ArrowRight, Copy, Link2, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { shareUrl } from "@/lib/sharing";

export function ShareControls() {
  const { share, shareLoading, isDemo, createShare, setShareEnabled, regenerateShare } =
    useWardrobe();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      notify(success);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update sharing.", "error");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!share) return;
    const url = shareUrl(share.token);
    try {
      await navigator.clipboard.writeText(url);
      notify("Share link copied.");
    } catch {
      linkRef.current?.select();
      notify("Select the link and copy it manually.", "error");
    }
  };

  const confirmRegenerate = async () => {
    setRegenerating(false);
    await run(() => regenerateShare(), "New share link created. The old one stopped working.");
  };

  if (!share) {
    return (
      <div>
        <button
          className="setting-action"
          disabled={busy || shareLoading}
          onClick={() => void run(() => createShare(), "Share link created.")}
        >
          <span className="setting-action-icon">
            <Link2 size={19} />
          </span>
          <span>
            <strong>{busy ? "Creating your link…" : "Create a share link"}</strong>
            <small>
              Anyone with the link can view your pieces and ready outfits. Your wear diary stays
              private.
            </small>
          </span>
          <ArrowRight size={17} />
        </button>
        {isDemo ? (
          <div className="settings-inline-note">
            <Link2 size={18} />
            <span>
              <strong>Demo links preview on this device only</strong>
              <small>Sign in with a real account to share your wardrobe with someone else.</small>
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="share-status">
        <span className={`status-dot${share.isEnabled ? "" : " status-off"}`} />
        <p>
          <strong>{share.isEnabled ? "Link is active" : "Link is off"}</strong>
          <small>
            {share.isEnabled
              ? "Anyone with the link can view your pieces and ready outfits."
              : "Visitors see an inactive message until you turn the link back on."}
          </small>
        </p>
      </div>

      <div className="share-link-row">
        <span className="share-link-icon">
          <Link2 size={17} />
        </span>
        <input ref={linkRef} readOnly value={shareUrl(share.token)} onFocus={(event) => event.target.select()} aria-label="Share link" />
        <Button variant="secondary" size="sm" onClick={() => void copy()}>
          <Copy size={15} /> Copy
        </Button>
      </div>

      <div className="share-actions">
        <Button
          variant="secondary"
          disabled={busy || shareLoading}
          onClick={() =>
            void run(
              () => setShareEnabled(!share.isEnabled),
              share.isEnabled ? "Sharing is off." : "Sharing is back on.",
            )
          }
        >
          {share.isEnabled ? "Turn link off" : "Turn link on"}
        </Button>
        <Button
          variant="secondary"
          disabled={busy || shareLoading}
          onClick={() => setRegenerating(true)}
        >
          <RefreshCw size={15} /> New link
        </Button>
      </div>

      {isDemo ? (
        <div className="settings-inline-note">
          <Link2 size={18} />
          <span>
            <strong>Demo links preview on this device only</strong>
            <small>Sign in with a real account to share your wardrobe with someone else.</small>
          </span>
        </div>
      ) : null}

      <Modal
        open={regenerating}
        onClose={() => setRegenerating(false)}
        title="Create a new link?"
        eyebrow="Just checking"
        size="sm"
      >
        <div className="confirm-dialog">
          <span className="confirm-icon">
            <RefreshCw size={21} />
          </span>
          <p>
            The current link will <strong>stop working immediately</strong>. Anyone you shared it
            with will need the new one.
          </p>
          <div>
            <Button variant="secondary" onClick={() => setRegenerating(false)}>
              Keep current link
            </Button>
            <Button variant="danger" onClick={() => void confirmRegenerate()}>
              Create new link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
