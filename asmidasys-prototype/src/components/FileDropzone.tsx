import { useEffect, useId, useRef, useState } from "react";
import { FileImage, FileUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  label: string;
  description: string;
  accept: string;
  maxBytes: number;
  value?: string | null;
  previewImage?: boolean;
  disabled?: boolean;
  isUploading?: boolean;
  onFileSelected: (file: File) => void;
  onClear?: () => void;
};

export function FileDropzone({
  label,
  description,
  accept,
  maxBytes,
  value,
  previewImage = true,
  disabled = false,
  isUploading = false,
  onFileSelected,
  onClear,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const preview = localPreview || value || null;
  const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;

  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  const choose = (file?: File | null) => {
    if (!file || disabled || isUploading) return;
    const accepted = accept.split(",").map((v) => v.trim().toLowerCase());
    const isAccepted = accepted.some((rule) =>
      rule.startsWith(".") ? file.name.toLowerCase().endsWith(rule) : file.type.toLowerCase() === rule
    );
    if (!isAccepted) { alert("نوع الملف غير مدعوم في هذا الحقل"); return; }
    if (file.size > maxBytes) { alert(`يجب ألا يتجاوز حجم الملف ${maxMb} ميغابايت`); return; }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setSelectedName(file.name);
    onFileSelected(file);
  };

  const clear = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setSelectedName("");
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">حتى {maxMb} ميغابايت</span>
      </div>
      <input ref={inputRef} id={inputId} type="file" accept={accept} className="sr-only" disabled={disabled || isUploading} onChange={(e) => choose(e.target.files?.[0])} />
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-disabled={disabled || isUploading}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled && !isUploading) { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !isUploading) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }}
        className={cn(
          "group cursor-pointer rounded-xl border-2 border-dashed p-4 outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/50",
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/20 hover:border-primary/60 hover:bg-primary/5",
          (disabled || isUploading) && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="flex min-h-24 items-center gap-4">
          {preview && previewImage ? (
            <img src={preview} alt="معاينة الملف المختار" className="h-20 w-28 rounded-lg border bg-background object-contain" />
          ) : (
            <span className="flex h-20 w-28 items-center justify-center rounded-lg bg-background text-primary">
              <FileImage className="h-8 w-8" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
              <FileUp className="h-4 w-4 text-primary" />
              {isUploading ? "جارٍ رفع الملف بأمان..." : "اسحب الملف هنا أو انقر للاختيار"}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            {selectedName && <p className="mt-2 truncate text-xs font-medium text-foreground">{selectedName}</p>}
          </div>
          {preview && onClear && (
            <Button type="button" variant="ghost" size="icon" aria-label="إزالة الملف المختار" disabled={disabled || isUploading} onClick={(e) => { e.stopPropagation(); clear(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
