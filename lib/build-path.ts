import base_logger from '@/lib/logger';
const logger = base_logger.child({ filename: __filename });

export function build_path(base_directory: string, user_email: string) {
  const func_logger = logger.child({ "func": "build_path" });
  func_logger.trace({"message": "START"});
  const words = user_email.split('@');
  let parent_dir = "common";
  let child_dir = "dummy";
  if (words.length == 1) {
    parent_dir = "common";
    child_dir = words[0];
  } else if (words.length == 2) {
    parent_dir = words[1];
    child_dir = words[0];
  }
  const res = base_directory + "/" + parent_dir + "/" + child_dir;
  func_logger.trace({"message": "END", "res": res});
  return res;
}
