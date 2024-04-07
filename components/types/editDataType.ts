export interface EditData {
  originalText: string; // 書き込み前のテキスト
  text: string; // 編集中のテキスト
  html: string; // 編集中のテキストをHTML化した情報
  committed: boolean; // コミットされているか
  conflicted: boolean; // コンフリクトしているかどうか
  timestamp: number; // 書き込み前のテキストのタイムスタンプ情報
};
