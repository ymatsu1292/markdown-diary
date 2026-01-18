//import { useState, useMemo } from "react";
import { Listbox, ListboxItem } from "@heroui/react";
import { File } from "lucide-react";
import { PageData } from "@/types/page-data-type";

export function MarkdownFileList(
  { pageData, setPage } : {
    pageData: PageData,
    setPage: (page: string) => void,
  }
) {
  //const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  //const selectedFile = useMemo(() => Array.from(selectedKeys).join(", "), [selectedKeys]);

  const handleTargetPageChange = (newPage: string) => {
    // ページ遷移時の処理
    setPage(newPage);
  };

  return (
    <div className="h-dvh bg-blue-50 w-53">
      <div className="m-1 p-1">ファイル一覧</div>
      <div className="container mx-auto">
        <Listbox aria-label="filelist" variant="flat" selectionMode="single">
          { pageData.scheduleData != null ? pageData.scheduleData.markdownFiles.map((item) => 
            <ListboxItem key={item} startContent={<File size={16} />}
              onPress={(e) => {
                if (e.target instanceof HTMLElement) {
                  handleTargetPageChange(String(e.target.dataset.key).slice(0, -3));
                }
              }}>
              {item}
            </ListboxItem>)
            :
            <></>
          }
        </Listbox>
      </div>
    </div>
  );
}
