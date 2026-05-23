"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import {
  Plus, SlidersHorizontal, ArrowUp, X, FileText, ImageIcon,
  Video, Music, Archive, Loader2, AlertCircle, Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FileWithPreview {
  id: string
  file: File
  preview?: string
  type: string
  uploadStatus: "pending" | "uploading" | "complete" | "error"
  uploadProgress?: number
  textContent?: string
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-zinc-400" />
  if (type.startsWith("video/")) return <Video className="h-5 w-5 text-zinc-400" />
  if (type.startsWith("audio/")) return <Music className="h-5 w-5 text-zinc-400" />
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <Archive className="h-5 w-5 text-zinc-400" />
  return <FileText className="h-5 w-5 text-zinc-400" />
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function isTextualFile(file: File): boolean {
  const textualTypes = ["text/", "application/json", "application/xml", "application/javascript"]
  const textualExtensions = ["txt", "md", "py", "js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "yaml", "csv", "sql"]
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  return textualTypes.some(t => file.type.toLowerCase().startsWith(t)) || textualExtensions.includes(ext)
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve((e.target?.result as string) || "")
    reader.onerror = e => reject(e)
    reader.readAsText(file)
  })
}

const FilePreviewCard: React.FC<{ file: FileWithPreview; onRemove: (id: string) => void }> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith("image/")
  const isTextual = isTextualFile(file.file)
  const ext = file.file.name.split(".").pop()?.toUpperCase() || "FILE"

  return (
    <div className={cn(
      "relative group bg-zinc-800 border border-zinc-700 rounded-xl flex-shrink-0 overflow-hidden",
      isImage ? "w-[110px] h-[110px] p-0" : "w-[130px] h-[110px] p-3"
    )}>
      {isImage && file.preview ? (
        <img src={file.preview} alt={file.file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col h-full">
          {isTextual && file.textContent ? (
            <div className="text-[8px] text-zinc-400 whitespace-pre-wrap break-words overflow-hidden flex-1 leading-relaxed">
              {file.textContent.slice(0, 120)}
              {file.textContent.length > 120 && "..."}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {getFileIcon(file.type)}
            </div>
          )}
        </div>
      )}
      <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-[10px] font-bold text-white bg-black/40 px-1.5 py-0.5 rounded-md">{ext}</span>
        {file.uploadStatus === "uploading" && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-400 ml-auto" />
        )}
      </div>
      <button
        className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(file.id)}
      >
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  )
}

interface AiInputProps {
  onSend: (message: string, files: FileWithPreview[]) => void
  disabled?: boolean
  placeholder?: string
  maxFiles?: number
  buttonLabel?: string
  buttonColor?: string
}

export function AiPromptInput({
  onSend,
  disabled = false,
  placeholder = "Kampanyanızı tarif edin...",
  maxFiles = 5,
  buttonLabel = "Oluştur",
  buttonColor = "#2563eb",
}: AiInputProps) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    const toAdd = Array.from(selectedFiles).slice(0, maxFiles - files.length).filter(f => f.size <= MAX_FILE_SIZE)

    const newFiles: FileWithPreview[] = toAdd.map(file => ({
      id: uid(),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      type: file.type || "application/octet-stream",
      uploadStatus: "uploading" as const,
      uploadProgress: 0,
    }))

    setFiles(prev => [...prev, ...newFiles])

    newFiles.forEach(f => {
      if (isTextualFile(f.file)) {
        readFileAsText(f.file).then(textContent => {
          setFiles(prev => prev.map(p => p.id === f.id ? { ...p, textContent } : p))
        })
      }
      const interval = setInterval(() => {
        setFiles(prev => prev.map(p => {
          if (p.id !== f.id || p.uploadStatus === "complete") return p
          const next = (p.uploadProgress ?? 0) + Math.random() * 25 + 10
          if (next >= 100) {
            clearInterval(interval)
            return { ...p, uploadStatus: "complete", uploadProgress: 100 }
          }
          return { ...p, uploadProgress: next }
        }))
      }, 120)
    })
  }, [files.length, maxFiles])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id)
      if (f?.preview) URL.revokeObjectURL(f.preview)
      return prev.filter(x => x.id !== id)
    })
  }, [])

  function handleSend() {
    if (disabled || (!message.trim() && files.length === 0)) return
    if (files.some(f => f.uploadStatus === "uploading")) return
    onSend(message, files)
    setMessage("")
    files.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
    setFiles([])
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = (message.trim() || files.length > 0) && !disabled && !files.some(f => f.uploadStatus === "uploading")

  return (
    <div
      className="relative w-full"
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
      onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files) }}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-600/10 border-2 border-dashed border-blue-500 rounded-2xl flex items-center justify-center pointer-events-none">
          <p className="text-sm text-blue-400 font-medium">Dosyaları buraya bırakın</p>
        </div>
      )}

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden focus-within:border-[#333] transition-colors">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={e => { setMessage(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full px-4 pt-4 pb-2 bg-transparent text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed min-h-[80px] max-h-[200px]"
        />

        {files.length > 0 && (
          <div className="flex gap-2.5 px-4 pb-3 overflow-x-auto">
            {files.map(file => (
              <FilePreviewCard key={file.id} file={file} onRemove={removeFile} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || files.length >= maxFiles}
              title="Dosya ekle"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-400 hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              disabled={disabled}
              title="Seçenekler"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-400 hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "flex items-center gap-2 px-4 h-8 rounded-xl text-xs font-bold transition-all",
              canSend
                ? "text-white shadow-lg hover:opacity-90 active:scale-95"
                : "bg-[#2a2a2a] text-gray-600 cursor-not-allowed"
            )}
            style={canSend ? { backgroundColor: buttonColor } : {}}
          >
            {disabled ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Üretiliyor...</>
            ) : (
              <><ArrowUp className="h-3.5 w-3.5" />{buttonLabel}</>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => { handleFileSelect(e.target.files); if (e.target) e.target.value = "" }}
      />
    </div>
  )
}
