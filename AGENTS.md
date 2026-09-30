<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 作業方針

- 特に指示がない限り、変更は新しいブランチを作らず main ブランチに直接コミットし、そのまま Push する
- Supabaseのマイグレーションを追加した場合は、SQLをそのまま提示し、ユーザーがSupabaseのSQL Editorで実行する必要がある旨を毎回明記する
- 実装後は、必ずブラウザ(開発サーバー)で実際に操作して動作確認を行い、確認した内容と未確認の点を報告する
