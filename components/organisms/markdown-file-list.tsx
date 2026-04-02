//import { useState, useMemo } from "react";
import { ListBox } from "@heroui/react";
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
        <ListBox aria-label="filelist" selectionMode="single"
          onAction={(key) => handleTargetPageChange(key as string)}
        >
          { pageData.scheduleData != null ? pageData.scheduleData.markdownFiles.map((item) =>
            (
              <ListBox.Item key={item.slice(0, -3)} id={item.slice(0, -3)} textValue={item.slice(0, -3)}>
                <File size={16} />
                {item.slice(0, -3)}
              </ListBox.Item>
            ))
            :
            <></>
          }
        </ListBox>
      </div>
    </div>
  );
}
