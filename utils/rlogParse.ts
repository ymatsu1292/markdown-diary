import { History } from '@/components/types/historyDataType';
import moment from 'moment';

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
  
  let res: History[] = [];
  
  const revision_regex = /^revision ([0-9.]+)/;
  const date_regex = /^date: ([0-9/: ]+)/;
  const lines = value.split('\n');
  let status: number = 0; // 0: 初期状態、1: 最初の区切り文字が着た後
  let revision = "";
  let date_str = "";
  for (const line of lines) {
    switch (status) {
      case 0: // 最初のデータの前
        if (line === '----------------------------') {
          status = 1;
        }
        break;

      case 1: // データの一行目(リビジョンを収集する)
        const revision_data = revision_regex.exec(line);
        if (revision_data !== null) {
          revision = revision_data[1];
          status = 2;
        } else {
          status = 99;
        }
        break;

      case 2: // データの二行目(日付を収集する)
        try {
        const date_data = date_regex.exec(line);
        console.log("date_data=", date_data);
        if (date_data !== null) {
          let date_str = date_data[1];
          let date_obj = moment(date_str, 'YYYY/MM/DD hh:mm:ss');
          res.push({"revision": revision, "datetime": date_obj.format("YYYY-MM-DD hh:mm")});
          date_obj.format()
          status = 0;
        } else {
          status = 99;
        }
        } catch (err) {
          console.log(err);
        }
        break;

      case 99: // エラー発生時
        break;
    }
  }
  console.log(res);
  
  // res.push({"revision": "1.1", "datetime": "2024/03/30T15:55:12+09:00"});
  // res.push({"revision": "1.2", "datetime": "2024/03/30T16:04:13+09:00"});
  // res.push({"revision": "1.3", "datetime": "2024/03/30T19:49:14+09:00"});
  return res as History[];
}
