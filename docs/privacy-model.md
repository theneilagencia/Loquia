# Privacy Model (Local First)

## What is true

- The **original recording stays on the user's device** (`LocalMediaStore`).
- To transcribe, a **temporary copy** is sent to processing (Cloudflare R2 →
  Deepgram) and **deleted after the transcript is persisted**.
- The **transcript and AI Pack** are stored server-side (so they're available on
  other devices), unchanged from M3/M4.
- Object storage remains private: signed URLs, restricted CORS, server-side
  secrets, short TTL, observed cleanup (`docs/storage.md`).

## Language we use — factual only (§29/§30)

Recommended copy (shipped in `settings.privacy`):

- **pt-BR:** "A gravação fica neste dispositivo. Para transcrever a reunião, uma
  cópia temporária é enviada para processamento e removida depois."
- **en-US:** "The recording stays on this device. To transcribe the meeting, a
  temporary copy is sent for processing and deleted afterward."

## Language we must NOT use

Because STT is a cloud service, these claims are **false** and are forbidden:

- ❌ "Seu áudio nunca sai do dispositivo." / "Your audio never leaves your device."
- ❌ "100% privado", "zero cloud".

We also never present browser storage as an absolute guarantee — the device/OS
can evict local storage, so persistence is requested best-effort and described
honestly (§12).

## Privacy settings UI (§28)

The Privacy tab shows **Armazenamento da gravação → Somente neste dispositivo**
as the policy, plus the temporary-processing-copy explanation. The old permanent
remote-retention options (Loquia 7/30/90 days) are **removed** — they are not a
product in this phase. Analytics opt-in and export e-mail redaction remain.

## Deletion controls

- **Remove recording from this device** (§31): deletes the local blob + metadata;
  the meeting, transcript, AI Pack and exports are preserved.
- **Delete meeting** (§32): removes server-side data per existing rules AND the
  on-device copy AND any still-present temporary remote copy.

## Multi-user on one browser (§34)

`LocalMediaAsset`s are namespaced by workspace. A different workspace signed in
on the same browser does not see another workspace's recordings. Logout does not
auto-wipe local recordings — they belong to the installation until the user
removes them or clears browser data (§33).
