# Chandboom patch notes (2026-11-02)

## Included changes
- `src/context/AppContext.tsx`: profile updates now await Supabase persistence, surface write errors, and synchronize `profiles.display_name` when `full_name` changes instead of silently swallowing errors.
- `src/components/DongView.tsx`: settlement math now splits an expense across every participant, including the payer. The payer's own share is deducted from their credit; this fixes overcharging other participants.
- `src/components/DongGroupAI.tsx`: family groups use family labels as valid participants; duplicate display-name matches are rejected instead of silently choosing the first match.
- `supabase/migrations/20261102_profile_dong_ai_alignment.sql`: backfills display names and keeps `profiles.display_name` synchronized when `users.full_name` changes. Recreates the self-only profile update policy.

## Important limitation
Dong expenses still store payer/participant names as text (`payer`, `participants`, and item consumers), not profile UUIDs. This patch prevents ambiguous AI name resolution, but it does not fully migrate expense ownership/participation to UUID identity. A complete solution for same-name users requires a schema migration to store payer_user_id and participant_user_ids (including item-level participant IDs) and updating expense forms, reporting, settlement, invitations, and AI draft validation together.

## Apply
1. Back up Supabase.
2. Run `supabase/migrations/20261102_profile_dong_ai_alignment.sql` in Supabase SQL Editor.
3. Deploy the included frontend.
4. Test profile rename from one account, reload/login, and verify both Settings and Dong member list show the same display name.
5. Test group expense splitting where payer is also a participant.
6. Test an AI draft with duplicate member display names; it should ask for disambiguation and must not save.
