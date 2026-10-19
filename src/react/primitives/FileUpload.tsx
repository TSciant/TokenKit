"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useRef, useState, type DragEvent, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Spinner } from "./Loading";
import { STATUS_ICON } from "./status-icon";
import { FieldError, RequiredMark } from "./field-parts";

export type FileUploadItem = {
  id: string;
  name: string;
  /** In bytes. */
  size?: number;
  /** Where the upload is. The kit sends nothing: the caller says. */
  status?: "uploading" | "uploaded" | "error";
  /** 0 to 100 while uploading, when it is known. */
  progress?: number;
  /** What went wrong with this file, worded as the field error is. */
  error?: string;
};

export interface FileUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label: string;
  /** Leave it out to have the limits written from `accept` and `maxSize`. */
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  /** The input's id, for an ErrorSummary link. */
  id?: string;
  name?: string;
  /** One file per field unless research says people need several at once. */
  multiple?: boolean;
  /** As the input's accept ("application/pdf,image/jpeg,.png"). A hint to the picker, not validation: check on the server. */
  accept?: string;
  /** The largest file, in bytes, for the hint. */
  maxSize?: number;
  /** A box that takes dropped files, around the button. The button is always there. */
  dropzone?: boolean;
  files?: FileUploadItem[];
  /** Files chosen or dropped. Check them and add them to `files`. */
  onAdd?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  buttonText?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Why it is disabled, said beside it. */
  reason?: ReactNode;
}

const units = ["bytes", "KB", "MB", "GB"];
/** "1.2 MB", as ResourceDownload writes a size. */
export function formatFileSize(bytes: number) {
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${i === 0 ? n : n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

/** "PDF, JPG and PNG", from an accept list. */
function typesOf(accept: string) {
  const names = accept.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith(".") ? t.slice(1) : t.split("/")[1] ?? t).replace("jpeg", "jpg").toUpperCase());
  const u = [...new Set(names)];
  return u.length > 1 ? `${u.slice(0, -1).join(", ")} and ${u.at(-1)}` : u[0] ?? "";
}

/* A long name keeps its start and its extension: the middle goes. */
function shortName(name: string, max = 36) {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const keep = max - ext.length - 1;
  return `${name.slice(0, Math.ceil(keep * 0.7))}…${name.slice(dot > 0 ? dot - Math.floor(keep * 0.3) : -Math.floor(keep * 0.3), dot > 0 ? dot : undefined)}${ext}`;
}

/**
 * FileUpload — choose files, see each by name with where it is, remove any.
 *
 * A native file input first: without JavaScript it is the browser's own.
 * Once the page runs, a real button opens the picker (so speech control can
 * press it), a box around it takes dropped files, and the chosen files are
 * listed by name with their size, their status as an icon and a word, and a
 * Remove button that names the file. A polite region says "2 of 3 files
 * uploaded" and "File scan.heic removed". A file's error is also the field's
 * error. The kit uploads nothing: `onAdd` gets the files, the caller checks
 * them, sends them and keeps `files` up to date.
 */
export function FileUpload({
  label,
  hint,
  error,
  required,
  optional,
  id: idProp,
  name,
  multiple = false,
  accept,
  maxSize,
  dropzone = true,
  files = [],
  onAdd,
  onRemove,
  buttonText,
  emptyText = "No file chosen",
  disabled,
  reason,
  ...rest
}: FileUploadProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [said, setSaid] = useState("");
  useEffect(() => setEnhanced(true), []);

  const written = [accept ? `You can upload ${typesOf(accept)} files.` : "", maxSize ? `${multiple ? "Each file" : "The file"} can be up to ${formatFileSize(maxSize)}.` : ""].filter(Boolean).join(" ");
  const hintText = hint ?? (written || undefined);
  const hintId = hintText ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const reasonId = disabled && reason ? `${id}-reason` : undefined;
  const describedBy = [hintId, errorId, reasonId].filter(Boolean).join(" ") || undefined;

  /* "2 of 3 files uploaded", when an upload finishes. */
  const done = files.filter((f) => f.status === "uploaded").length;
  const prevDone = useRef(done);
  useEffect(() => {
    if (done > prevDone.current) setSaid(files.length > 1 ? `${done} of ${files.length} files uploaded` : `File ${files.find((f) => f.status === "uploaded")?.name ?? ""} uploaded`);
    prevDone.current = done;
  }, [done, files]);

  const add = (list: FileList | null) => { if (list && list.length && !disabled) onAdd?.(Array.from(multiple ? list : [list[0]])); };

  /* After a remove, focus goes to the next file's Remove button, or back to the button. */
  const remove = (f: FileUploadItem, index: number) => {
    onRemove?.(f.id);
    setSaid(`File ${f.name} removed`);
    requestAnimationFrame(() => {
      const buttons = list.current?.querySelectorAll<HTMLButtonElement>("[data-remove]");
      (buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)] ?? document.getElementById(`${id}-choose`))?.focus();
    });
  };

  const drop = dropzone && enhanced && !disabled
    ? {
        onDragOver: (e: DragEvent) => { e.preventDefault(); setDragging(true); },
        onDragLeave: () => setDragging(false),
        onDrop: (e: DragEvent) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); },
      }
    : {};

  return (
    <div {...rest} data-tk="file-upload" data-invalid={error ? "" : undefined}>
      <label data-tk="field-label" htmlFor={id} id={`${id}-label`}>
        {label}
        {required ? <RequiredMark /> : optional ? <span data-tk="field-optional"> (optional)</span> : null}
      </label>
      {hintText ? <p data-tk="field-hint" id={hintId}>{hintText}</p> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      {disabled && reason ? <p data-tk="field-hint" id={reasonId}>{reason}</p> : null}
      <div data-tk="file-upload-zone" data-dropzone={dropzone && enhanced ? "" : undefined} data-dragging={dragging ? "" : undefined} {...drop}>
        <input
          ref={input}
          data-tk={enhanced ? "file-upload-input" : "input"}
          type="file"
          id={id}
          name={name}
          multiple={multiple}
          accept={accept}
          disabled={disabled && !enhanced}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          tabIndex={enhanced ? -1 : undefined}
          onChange={(e) => { add(e.currentTarget.files); e.currentTarget.value = ""; }}
        />
        {enhanced ? (
          <>
            <Button
              id={`${id}-choose`}
              type="button"
              variant="outline"
              aria-labelledby={`${id}-label ${id}-button`}
              aria-describedby={describedBy}
              aria-disabled={disabled || undefined}
              onClick={() => { if (!disabled) input.current?.click(); }}
            >
              <span id={`${id}-button`}>{buttonText ?? (multiple ? "Choose files" : "Choose file")}</span>
            </Button>
            <span data-tk="file-upload-status">{files.length ? `${files.length} ${files.length === 1 ? "file" : "files"} chosen` : dropzone ? `${emptyText}, or drop ${multiple ? "files" : "a file"} here` : emptyText}</span>
          </>
        ) : null}
      </div>
      {files.length ? (
        <ul data-tk="file-upload-list" ref={list}>
          {files.map((f, i) => (
            <li key={f.id} data-tk="file-upload-file" data-status={f.status}>
              <Icon name="file" size="sm" />
              <span data-tk="file-upload-name" title={f.name}>
                <span aria-hidden="true">{shortName(f.name)}</span>
                <span data-tk="visually-hidden">{f.name}</span>
              </span>
              {f.size != null ? <span data-tk="file-upload-size">{formatFileSize(f.size)}</span> : null}
              <span data-tk="file-upload-state">
                {f.status === "uploading" ? <><Spinner decorative delay={0} /> Uploading{f.progress != null ? ` ${Math.round(f.progress)}%` : ""}</>
                  : f.status === "uploaded" ? <><Icon name={STATUS_ICON.success} size="sm" /> Uploaded</>
                  : f.status === "error" ? <><Icon name={STATUS_ICON.danger} size="sm" /> Not uploaded</> : null}
              </span>
              <Button type="button" variant="quiet" size="sm" data-remove="" onClick={() => remove(f, i)}>
                Remove<span data-tk="visually-hidden"> {f.name}</span>
              </Button>
              {f.status === "uploading" && f.progress != null ? <progress data-tk="file-upload-progress" max={100} value={f.progress} aria-hidden="true" /> : null}
              {f.error ? <p data-tk="file-upload-error">{f.error}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <span data-tk="visually-hidden" role="status">{said}</span>
    </div>
  );
}
