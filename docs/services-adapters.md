# Loquia — contratos de services e adapters

A UI nunca chama HTTP direto. Cada service recebe um adapter por injeção (`MockAdapter` | `ApiAdapter`).

```ts
interface AuthService {
  signIn(email: string, password: string): Promise<Session>;            // erro genérico: não revelar existência do email
  signOut(): Promise<void>;
  requestReset(email: string): Promise<void>;                            // sempre resolve
  getSession(): Promise<Session | null>;
}
interface AccessService {
  submitRequest(input: AccessRequestInput): Promise<{ id: string }>;
  getInvitation(token: string): Promise<Invitation | null>;
  activateAccount(token: string, password: string): Promise<Session>;
}
interface AdminService {
  stats(): Promise<AdminStats>;
  listRequests(filter?: AccessRequestStatus[]): Promise<AccessRequest[]>;
  getRequest(id: string): Promise<AccessRequest>;
  startReview(id: string): Promise<AccessRequest>;
  requestInformation(id: string, message?: string): Promise<AccessRequest>;
  approve(id: string, opts: { workspaceName: string; role: User["role"]; expiresInDays: number; send: boolean; message?: string }): Promise<{ request: AccessRequest; invitation: Invitation; user: User }>;
  reject(id: string, opts: { category: string; internalReason: string }): Promise<AccessRequest>;
  cancel(id: string): Promise<AccessRequest>; reopen(id: string): Promise<AccessRequest>;
  listInvitations(): Promise<Invitation[]>; resendInvitation(id: string): Promise<Invitation>; revokeInvitation(id: string): Promise<Invitation>;
  listUsers(): Promise<User[]>; setUserStatus(id: string, status: UserStatus): Promise<User>;
  listWorkspaces(): Promise<Workspace[]>; setWorkspaceStatus(id: string, s: Workspace["status"]): Promise<Workspace>; changeOwner(id: string, userId: string): Promise<Workspace>;
  audit(limit?: number): Promise<AuditEvent[]>;
}
interface MeetingService {
  list(q?: { search?: string; status?: MeetingStatus[] }): Promise<Meeting[]>;
  get(id: string): Promise<Meeting>;
  create(input: { title: string; language: MeetingLanguage; source: Meeting["source"] }): Promise<Meeting>;
  upload(file: File, input: { title: string; language: MeetingLanguage }): Promise<Meeting>;
  processingState(id: string): Promise<{ step: number; total: 7; state: "running" | "partial" | "error" | "done" }>;
  retryProcessing(id: string): Promise<void>;
  archive(id: string): Promise<Meeting>; remove(id: string): Promise<void>;
}
interface RecordingService {
  permission(): Promise<"granted" | "denied" | "prompt" | "unsupported">;
  devices(): Promise<Array<{ id: string; label: string }>>;
  start(o: { deviceId?: string; quality: Recording["quality"] }): Promise<void>;
  pause(): void; resume(): void; addMarker(label?: string): Marker;
  finish(): Promise<Recording>;
  onTick(cb: (seconds: number, level: number) => void): () => void;
}
interface TranscriptService {
  get(meetingId: string): Promise<TranscriptSegment[]>;
  updateSegment(id: string, text: string): Promise<TranscriptSegment>;
  renameSpeaker(meetingId: string, speakerKey: string, name: string): Promise<Meeting>;  // aplica a todos os segmentos
  search(meetingId: string, q: string): Promise<TranscriptSegment[]>;
}
interface ExportService {
  buildPack(meetingId: string, cfg: ExportConfig): Promise<AIPack>;      // fonte única
  render(pack: AIPack, cfg: ExportConfig): string;                       // md | txt | json a partir do MESMO pack
  filename(meeting: Meeting, cfg: ExportConfig): string;
  copy(text: string): Promise<void>;                                     // ClipboardAdapter
  download(text: string, filename: string, format: ExportFormat): void;  // DownloadAdapter
  history(meetingId?: string): Promise<ExportHistoryEntry[]>;
  presets(): Promise<ExportPreset[]>; savePreset(p: Omit<ExportPreset,"id">): Promise<ExportPreset>;
  updatePreset(id: string, p: Partial<ExportPreset>): Promise<ExportPreset>; deletePreset(id: string): Promise<void>;
  setDefaultPreset(id: string): Promise<void>;
}
interface SettingsService { get(): Promise<UserSettings>; set(patch: Partial<UserSettings>): Promise<UserSettings>; downloadMyData(): Promise<Blob>; deleteAudio(): Promise<void>; deleteWorkspace(): Promise<void>; }
interface StorageService { get<T>(k: string): Promise<T | null>; set<T>(k: string, v: T): Promise<void>; remove(k: string): Promise<void>; putBlob(k: string, b: Blob): Promise<string>; getBlob(k: string): Promise<Blob | null>; }
```

## Adapters

- **MockAdapter** — implementa todos os services sobre `BrowserStorageAdapter`; latência artificial 120–600 ms; erros injetáveis por flag (`?fail=export`); NÃO finge transcrição real de áudio enviado, integração de calendário nem envio de email.
- **ApiAdapter** — mesma interface sobre `fetch`; mapeia erros HTTP para os estados de erro nomeados.
- **BrowserStorageAdapter** — localStorage para entidades (chave `loquia.proto.v1` no protótipo), IndexedDB para Blob de áudio.
- **ClipboardAdapter** — `navigator.clipboard.writeText` com fallback `textarea + execCommand`; toast só após sucesso; falha → estado `clipboard`.
- **DownloadAdapter** — `new Blob([text], {type})` + `URL.createObjectURL` + `<a download>` + revoke; MIME: `text/markdown`, `text/plain`, `application/json`.
- **MediaRecorderAdapter** — `getUserMedia` + `MediaRecorder`; permissões e ausência de device mapeadas para os estados do recorder; buffer preservado em pause.
