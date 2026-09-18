"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Folder, Server, Upload } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { importMessageFiles } from "@/components/settings/import-messages-utils";
import type {
  ImapFormState,
  ImportResult,
  ImportSourceItem,
  ImportSourceSection,
  ImportTab,
  ImportProgress,
} from "./types";
import {
  ensureImportDestination,
  fetchImapFolders,
  filterCustomImapFolders,
  formatImportResult,
  getFileImportSource,
  getFolderImportSource,
  getSelectedImportSources,
  importFromImap,
  importSourceOptions,
  resolveImapSourceFolder,
} from "./utils";

const initialImapForm: ImapFormState = {
  host: "",
  port: "993",
  secure: true,
  username: "",
  password: "",
  folder: "INBOX",
  limit: "25",
};

const defaultSections = importSourceOptions.map((option) => option.value);

export default function SettingsImportPage() {
  const { selectedMailbox } = useSelectedMailbox();
  const [activeTab, setActiveTab] = useState<ImportTab>("file");
  const [selectedSections, setSelectedSections] =
    useState<ImportSourceSection[]>(defaultSections);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileResult, setFileResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileProgress, setFileProgress] = useState<ImportProgress | null>(null);
  const [imapForm, setImapForm] = useState<ImapFormState>(initialImapForm);
  const [imapResult, setImapResult] = useState<ImportResult | null>(null);
  const [imapError, setImapError] = useState<string | null>(null);
  const [imapLoading, setImapLoading] = useState(false);
  const [imapProgress, setImapProgress] = useState<ImportProgress | null>(null);
  const selectedSources = useMemo(
    () => getSelectedImportSources(selectedSections),
    [selectedSections],
  );
  const fileImportSource = getFileImportSource(selectedSources);
  const sourceSummary =
    selectedSources.length > 0
      ? selectedSources.map((source) => source.label).join(", ")
      : "Select source sections";

  function toggleSection(section: ImportSourceSection, checked: boolean) {
    setSelectedSections((current) => {
      if (checked)
        return current.includes(section) ? current : [...current, section];
      return current.filter((item) => item !== section);
    });
  }

  async function getDestination(source: ImportSourceItem): Promise<string> {
    if (!selectedMailbox?.id) throw new Error("Select a mailbox first");
    return ensureImportDestination(selectedMailbox.id, source);
  }

  async function onFileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMailbox?.id || selectedSources.length === 0) return;

    setFileLoading(true);
    setFileError(null);
    setFileResult(null);
    setFileProgress({ completed: 0, total: 100, label: "Preparing files" });
    try {
      const destination = await getDestination(fileImportSource);
      const result = await importMessageFiles(
        selectedMailbox.id,
        files,
        destination,
        (percentage) =>
          setFileProgress({
            completed: percentage,
            total: 100,
            label: percentage < 70 ? "Uploading files" : "Importing messages",
          }),
      );
      setFileResult(result);
      window.dispatchEvent(new Event("mailflare:messages-changed"));
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "File import failed",
      );
    } finally {
      setFileLoading(false);
    }
  }

  async function onImapSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMailbox?.id || selectedSources.length === 0) return;
    setImapLoading(true);
    setImapError(null);
    setImapResult(null);
    setImapProgress({
      completed: 0,
      total: 1,
      label: "Discovering IMAP folders",
    });
    try {
      const total: ImportResult = { imported: 0, skipped: 0, errors: [] };
      const discoveredFolders = await fetchImapFolders(imapForm);
      const expandedSources: ImportSourceItem[] = [];
      for (const source of selectedSources) {
        if (source.id === "system:others") {
          expandedSources.push(
            ...filterCustomImapFolders(discoveredFolders, selectedSources).map(
              getFolderImportSource,
            ),
          );
        } else {
          expandedSources.push(source);
        }
      }

      for (const [index, source] of expandedSources.entries()) {
        setImapProgress({
          completed: index,
          total: expandedSources.length,
          label: `Importing ${source.label}`,
        });
        const destination = await getDestination(source);
        const folder = resolveImapSourceFolder(source, discoveredFolders);
        const result = await importFromImap(
          selectedMailbox.id,
          { ...imapForm, folder },
          destination,
        );
        total.imported = (total.imported ?? 0) + (result.imported ?? 0);
        total.skipped = (total.skipped ?? 0) + (result.skipped ?? 0);
        total.errors = [...(total.errors ?? []), ...(result.errors ?? [])];
        setImapProgress({
          completed: index + 1,
          total: expandedSources.length,
          label: `Imported ${source.label}`,
        });
      }
      setImapResult(total);
      setImapForm((current) => ({ ...current, password: "" }));
      window.dispatchEvent(new Event("mailflare:messages-changed"));
    } catch (error) {
      setImapError(
        error instanceof Error ? error.message : "IMAP import failed",
      );
    } finally {
      setImapLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Import mailbox
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Choose what to import and how Mailflare should receive it.
          </p>
        </div>
        <div className="space-y-1 overflow-hidden rounded-3xl">
          <CardContent className="space-y-6 rounded-b-lg rounded-t-3xl bg-white p-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="import-source">Import source</Label>
              <Select
                id="import-source"
                value={activeTab}
                onChange={(event) =>
                  setActiveTab(event.target.value as ImportTab)
                }
                className="text-sm w-full py-2"
              >
                <option value="file">Backup File</option>
                <option value="imap">IMAP</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Choose import sections</Label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSourceDropdownOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm shadow-sm shadow-neutral-200/50"
                >
                  <label className="flex-1">Selected</label>
                  <span className="truncate">{sourceSummary}</span>
                  <span className="text-neutral-400 px-2">▾</span>
                </button>
                {sourceDropdownOpen && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                    {importSourceOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Checkbox
                          checked={selectedSections.includes(option.value)}
                          onChange={(event) =>
                            toggleSection(option.value, event.target.checked)
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {activeTab === "file" ? (
              <>
                <form onSubmit={onFileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Backup File</Label>
                    <Input
                      id="import-files"
                      type="file"
                      accept=".eml,.mbox,.mbx,message/rfc822,application/mbox"
                      multiple
                      onChange={(event) =>
                        setFiles(Array.from(event.target.files ?? []))
                      }
                      className="block w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm shadow-neutral-200/50 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                    />
                    <p className="text-xs leading-5 text-neutral-500">
                      Upload exported .eml or .mbox files. File exports do not
                      reliably include source section metadata, so files are
                      imported once into {fileImportSource.label}
                    </p>
                  </div>
                  {selectedSections.includes("others") && (
                    <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Other folders can be imported automatically from IMAP.
                      File import cannot discover which section a message
                      belongs to.
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      !selectedMailbox ||
                      selectedSources.length === 0 ||
                      files.length === 0 ||
                      fileLoading
                    }
                  >
                    {fileLoading ? "Importing..." : "Import selected files"}
                  </Button>
                  {fileProgress && (
                    <div
                      className="space-y-1 text-xs text-neutral-500"
                      aria-live="polite"
                    >
                      <div className="flex justify-between">
                        <span>{fileProgress.label}</span>
                        <span>{fileProgress.completed}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full bg-blue-600 transition-[width]"
                          style={{ width: `${fileProgress.completed}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {fileResult && (
                    <p className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {formatImportResult(fileResult)}
                    </p>
                  )}
                  {fileError && (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {fileError}
                    </p>
                  )}
                </form>
              </>
            ) : (
              <>
                <form onSubmit={onImapSubmit} className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_110px]">
                    <div className="space-y-2">
                      <Label htmlFor="imap-host">Host</Label>
                      <Input
                        id="imap-host"
                        value={imapForm.host}
                        onChange={(event) =>
                          setImapForm({ ...imapForm, host: event.target.value })
                        }
                        placeholder="imap.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-port">Port</Label>
                      <Input
                        id="imap-port"
                        type="number"
                        value={imapForm.port}
                        onChange={(event) =>
                          setImapForm({ ...imapForm, port: event.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="imap-username">Username</Label>
                      <Input
                        id="imap-username"
                        value={imapForm.username}
                        onChange={(event) =>
                          setImapForm({
                            ...imapForm,
                            username: event.target.value,
                          })
                        }
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-password">
                        Password or app password
                      </Label>
                      <Input
                        id="imap-password"
                        type="password"
                        value={imapForm.password}
                        onChange={(event) =>
                          setImapForm({
                            ...imapForm,
                            password: event.target.value,
                          })
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="imap-limit">
                        Message limit per source
                      </Label>
                      <Input
                        id="imap-limit"
                        type="number"
                        min={1}
                        max={100}
                        value={imapForm.limit}
                        onChange={(event) =>
                          setImapForm({
                            ...imapForm,
                            limit: event.target.value,
                          })
                        }
                      />
                    </div>
                    <label className="flex items-end gap-2 pb-2 text-sm text-neutral-700">
                      <Checkbox
                        checked={imapForm.secure}
                        onChange={(event) =>
                          setImapForm({
                            ...imapForm,
                            secure: event.target.checked,
                          })
                        }
                      />
                      Use TLS
                    </label>
                  </div>
                  <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">
                    IMAP imports selected source sections automatically. Folders
                    are discovered from the source account and imported into
                    matching new or existing Mailflare folders.
                  </p>
                  <Button
                    type="submit"
                    disabled={
                      !selectedMailbox ||
                      selectedSources.length === 0 ||
                      !imapForm.host ||
                      !imapForm.username ||
                      !imapForm.password ||
                      imapLoading
                    }
                  >
                    <Upload className="h-4 w-4" />
                    {imapLoading ? "Importing..." : "Import selected sources"}
                  </Button>
                  {imapProgress && (
                    <div
                      className="space-y-1 text-xs text-neutral-500"
                      aria-live="polite"
                    >
                      <div className="flex justify-between">
                        <span>{imapProgress.label}</span>
                        <span>
                          {imapProgress.completed}/{imapProgress.total}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full bg-blue-600 transition-[width]"
                          style={{
                            width: `${Math.round((imapProgress.completed / imapProgress.total) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {imapResult && (
                    <p className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {formatImportResult(imapResult)}
                    </p>
                  )}
                  {imapError && (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {imapError}
                    </p>
                  )}
                </form>
              </>
            )}
          </CardContent>
        </div>
      </section>
    </div>
  );
}
