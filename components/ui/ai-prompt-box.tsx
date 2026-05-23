"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp, BrainCog, LayoutTemplate, Globe,
  Mic, Paperclip, Square, StopCircle, X,
} from "lucide-react";
import React from "react";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

const styles = `
  *:focus-visible { outline-offset: 0 !important; }
  textarea::-webkit-scrollbar { width: 6px; }
  textarea::-webkit-scrollbar-track { background: transparent; }
  textarea::-webkit-scrollbar-thumb { background-color: #444; border-radius: 3px; }
  textarea::-webkit-scrollbar-thumb:hover { background-color: #555; }
`;

const useStyleInjection = () => {
  React.useEffect(() => {
    const id = "ai-prompt-box-styles";
    if (typeof document !== "undefined" && !document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.innerText = styles;
      document.head.appendChild(s);
    }
  }, []);
};

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[44px] w-full resize-none rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      rows={1}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

// Tooltip
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 animate-in fade-in-0 zoom-in-95 overflow-hidden rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-white shadow-md",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Dialog
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-sm", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed top-1/2 left-1/2 z-50 w-full max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#333] bg-[#1a1a1a] p-0 shadow-2xl md:max-w-[800px]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 z-10 rounded-full bg-[#2a2a2a] p-2 hover:bg-[#333] transition-colors">
        <X className="h-5 w-5 text-gray-300" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("font-semibold text-gray-100 text-lg", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantCls = {
      default: "bg-white hover:bg-white/80 text-black",
      outline: "border border-[#444] bg-transparent hover:bg-[#2a2a2a]",
      ghost: "bg-transparent hover:bg-[#2a2a2a]",
    };
    const sizeCls = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
      icon: "h-8 w-8 rounded-full aspect-square",
    };
    return (
      <button
        className={cn("inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", variantCls[variant], sizeCls[size], className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// VoiceRecorder
interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ isRecording, onStartRecording, onStopRecording, visualizerBars = 32 }) => {
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (isRecording) {
      onStartRecording();
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      onStopRecording(time);
      setTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className={cn("flex w-full flex-col items-center justify-center py-3 transition-all duration-300", isRecording ? "opacity-100" : "h-0 opacity-0")}>
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="font-mono text-sm text-white/80">{fmt(time)}</span>
      </div>
      <div className="flex h-10 w-full items-center justify-center gap-0.5 px-4">
        {[...Array(visualizerBars)].map((_, i) => (
          <div key={i} className="w-0.5 animate-pulse rounded-full bg-white/50" style={{ height: `${Math.max(15, Math.random() * 100)}%`, animationDelay: `${i * 0.05}s`, animationDuration: `${0.5 + Math.random() * 0.5}s` }} />
        ))}
      </div>
    </div>
  );
};

// ImageViewDialog
const ImageViewDialog: React.FC<{ imageUrl: string | null; onClose: () => void }> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="border-none bg-transparent shadow-none">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-2xl">
          <img src={imageUrl} alt="Full preview" className="rounded-2xl object-contain max-h-[80vh] w-full" />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// PromptInput Context
interface PromptInputContextType {
  isLoading: boolean; value: string; setValue: (v: string) => void;
  maxHeight: number | string; onSubmit?: () => void; disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({ isLoading: false, value: "", setValue: () => {}, maxHeight: 240 });
function usePromptInput() { return React.useContext(PromptInputContext); }

interface PromptInputProps {
  isLoading?: boolean; value?: string; onValueChange?: (v: string) => void;
  maxHeight?: number | string; onSubmit?: () => void; children: React.ReactNode;
  className?: string; disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ className, isLoading = false, maxHeight = 240, value, onValueChange, onSubmit, children, disabled = false, onDragOver, onDragLeave, onDrop }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = (v: string) => { setInternalValue(v); onValueChange?.(v); };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider value={{ isLoading, value: value ?? internalValue, setValue: onValueChange ?? handleChange, maxHeight, onSubmit, disabled }}>
          <div ref={ref} className={cn("rounded-2xl border border-[#2a2a2a] bg-[#151515] px-3 pt-3 pb-2 transition-all duration-300", isLoading && "border-red-500/50", className)} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  },
);
PromptInput.displayName = "PromptInput";

const PromptInputTextarea: React.FC<{ disableAutosize?: boolean; placeholder?: string } & React.ComponentProps<typeof Textarea>> = ({ className, onKeyDown, disableAutosize = false, placeholder, ...props }) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (disableAutosize || !ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = typeof maxHeight === "number" ? `${Math.min(ref.current.scrollHeight, maxHeight)}px` : `min(${ref.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);
  return (
    <Textarea ref={ref} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit?.(); } onKeyDown?.(e); }} className={cn("px-0 text-base", className)} disabled={disabled} placeholder={placeholder} {...props} />
  );
};

const PromptInputActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn("flex items-center gap-2 pt-1", className)} {...props}>{children}</div>
);

const PromptInputAction: React.FC<{ tooltip: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right"; className?: string } & React.ComponentProps<typeof Tooltip>> = ({ tooltip, children, className, side = "top", ...props }) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>{children}</TooltipTrigger>
      <TooltipContent side={side} className={className}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

const CustomDivider: React.FC = () => (
  <div className="relative mx-1 h-6 w-px bg-[#333]" />
);

// Main PromptInputBox
interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}
export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>((props, ref) => {
  const { onSend = () => {}, isLoading = false, placeholder = "Kampanyanızı anlatın...", className } = props;
  useStyleInjection();

  const [input, setInput] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [filePreviews, setFilePreviews] = React.useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showThink, setShowThink] = React.useState(false);
  const [showCanvas, setShowCanvas] = React.useState(false);
  const uploadRef = React.useRef<HTMLInputElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const processFile = React.useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    setFiles([file]);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreviews({ [file.name]: e.target?.result as string });
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")).slice(0, 1).forEach(processFile);
  }, [processFile]);

  const handlePaste = React.useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { e.preventDefault(); processFile(file); break; }
      }
    }
  }, [processFile]);

  React.useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleSubmit = () => {
    if (!input.trim() && files.length === 0) return;
    let prefix = showSearch ? "[Search] " : showThink ? "[Think] " : showCanvas ? "[Canvas] " : "";
    onSend(prefix + input, files);
    setInput(""); setFiles([]); setFilePreviews({});
  };

  const hasContent = input.trim() !== "" || files.length > 0;

  return (
    <>
      <PromptInput value={input} onValueChange={setInput} isLoading={isLoading} onSubmit={handleSubmit}
        className={cn("w-full", isRecording && "border-red-500/50", className)}
        disabled={isLoading || isRecording} ref={ref || boxRef}
        onDragOver={(e) => e.preventDefault()} onDragLeave={(e) => e.preventDefault()} onDrop={handleDrop}
      >
        {files.length > 0 && !isRecording && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={i} className="group relative">
                {file.type.startsWith("image/") && filePreviews[file.name] && (
                  <div className="h-16 w-16 cursor-pointer overflow-hidden rounded-xl" onClick={() => setSelectedImage(filePreviews[file.name] || null)}>
                    <img src={filePreviews[file.name]} alt={file.name} className="h-full w-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); setFiles([]); setFilePreviews({}); }} className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={cn("transition-all duration-300", isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100")}>
          <PromptInputTextarea placeholder={showSearch ? "Web'de ara..." : showThink ? "Derin düşün..." : showCanvas ? "Canvas oluştur..." : placeholder} />
        </div>

        {isRecording && <VoiceRecorder isRecording={isRecording} onStartRecording={() => {}} onStopRecording={(d) => { setIsRecording(false); onSend(`[Ses mesajı - ${d} saniye]`, []); }} />}

        <PromptInputActions className="justify-between">
          <div className={cn("flex items-center gap-1", isRecording && "invisible h-0 opacity-0")}>
            <PromptInputAction tooltip="Görsel yükle">
              <button onClick={() => uploadRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-[#2a2a2a] hover:text-gray-300 transition-colors">
                <Paperclip className="h-4 w-4" />
                <input ref={uploadRef} type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
              </button>
            </PromptInputAction>

            <button type="button" onClick={() => { setShowSearch(p => !p); setShowThink(false); }}
              className={cn("flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all text-xs", showSearch ? "border-blue-500 bg-blue-500/15 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300")}>
              <motion.div animate={{ rotate: showSearch ? 360 : 0, scale: showSearch ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 260, damping: 25 }}>
                <Globe className="h-4 w-4" />
              </motion.div>
              <AnimatePresence>
                {showSearch && <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden whitespace-nowrap">Ara</motion.span>}
              </AnimatePresence>
            </button>

            <CustomDivider />

            <button type="button" onClick={() => { setShowThink(p => !p); setShowSearch(false); }}
              className={cn("flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all text-xs", showThink ? "border-violet-500 bg-violet-500/15 text-violet-400" : "border-transparent text-gray-500 hover:text-gray-300")}>
              <motion.div animate={{ rotate: showThink ? 360 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 25 }}>
                <BrainCog className="h-4 w-4" />
              </motion.div>
              <AnimatePresence>
                {showThink && <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden whitespace-nowrap">Düşün</motion.span>}
              </AnimatePresence>
            </button>

            <CustomDivider />

            <button type="button" onClick={() => setShowCanvas(p => !p)}
              className={cn("flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all text-xs", showCanvas ? "border-orange-500 bg-orange-500/15 text-orange-400" : "border-transparent text-gray-500 hover:text-gray-300")}>
              <motion.div animate={{ rotate: showCanvas ? 360 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 25 }}>
                <LayoutTemplate className="h-4 w-4" />
              </motion.div>
              <AnimatePresence>
                {showCanvas && <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden whitespace-nowrap">Şablon</motion.span>}
              </AnimatePresence>
            </button>
          </div>

          <PromptInputAction tooltip={isLoading ? "Durdur" : isRecording ? "Kaydı durdur" : hasContent ? "Gönder" : "Sesli mesaj"}>
            <Button variant="default" size="icon"
              className={cn("h-8 w-8 rounded-full transition-all duration-200", isRecording ? "bg-transparent text-red-500 hover:bg-[#2a2a2a]" : hasContent ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-transparent text-gray-600 hover:bg-[#2a2a2a] hover:text-gray-300")}
              onClick={() => { if (isRecording) setIsRecording(false); else if (hasContent) handleSubmit(); else setIsRecording(true); }} disabled={isLoading && !hasContent}
            >
              {isLoading ? <Square className="h-4 w-4 animate-pulse" /> : isRecording ? <StopCircle className="h-5 w-5 text-red-500" /> : hasContent ? <ArrowUp className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
      <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
});
PromptInputBox.displayName = "PromptInputBox";
