import { History } from '@/components/types/historyDataType';

import base_logger from '@/utils/logger';
const logger = base_logger.child({ filename: __filename });

export function rlog_parse(value: string): History[] {
  // データ例
  // "\n"
  // "RCS file: RCS/2024-03-30.md,v\n"
  // "Working file: 2024-03-30.md\n"
  // "head: 1.4\n"
  // "branch:\n"
  // "locks: strict\n"
  // "\tymatsu: 1.4\n"
  // "access list:\n"
  // "symbolic names:\n"
  // "keyword substitution: kv\n"
  // "total revisions: 4;\tselected revisions: 4\n"
  // "description:\n"
  // "----------------------------\n"
  // "revision 1.4\tlocked by: ymatsu;\n"
  // "date: 2024/03/30 10:53:05;  author: ymatsu;  state: Exp;  lines: +1 -1\n"
  // "2024-03-30T19:53:05+09:00\n"
  // "----------------------------\n"
  // "revision 1.3\n"
  // "date: 2024/03/30 10:49:14;  author: ymatsu;  state: Exp;  lines: +3 -1\n"
  // "2024-03-30T19:49:14+09:00\n"
  // "----------------------------\n"
  // "revision 1.2\n"
  // "date: 2024/03/30 07:04:13;  author: ymatsu;  state: Exp;  lines: +11 -1\n"
  // "2024-03-30T16:04:13+09:00\n"
  // "----------------------------\n"
  // "revision 1.1\ndate: 2024/03/30 06:55:12;  author: ymatsu;  state: Exp;\n"
  // "2024-03-30T15:55:12+09:00\n"
  // "=============================================================================\n"

  // 1. ----------------------------の行まで読み捨てる(なくなるまで)
  // 2. "revision "で始まる行の\tか\nまでの値をバージョンとして読み出す
  // 3. "date: "で始まる行の";"までの文字列を日付として読み出し、ローカルタイムに変換して保管する
  // 4. 1へ戻る
  return [] as History[];
}
