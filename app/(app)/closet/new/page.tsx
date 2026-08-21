import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ItemForm } from "@/components/closet/item-form";

export default function NewItemPage() {
  return (
    <div className="editor-page">
      <header className="editor-header">
        <div>
          <Link href="/closet" className="back-link"><ArrowLeft size={16} /> My closet</Link>
          <p className="eyebrow">A new piece</p>
          <h1>Add to your wardrobe</h1>
          <p>Capture what matters now. You can always add more detail later.</p>
        </div>
        <span className="time-note">About 1 minute</span>
      </header>
      <ItemForm />
    </div>
  );
}
