import base_logger from '@/lib/logger';
const logger = base_logger.child({ filename: __filename });

export function build_path(base_directory: string, id: string) {
  const func_logger = logger.child({ "func": "build_path" });
  func_logger.trace({"message": "START"});
  const res = base_directory + "/" + id;
  func_logger.trace({"message": "END", "res": res});
  return res;
}
