import { useState, useMemo } from 'react';
import { ScheduleData } from '@/components/types/scheduleDataType';
import { Listbox, ListboxItem } from '@nextui-org/react';
import { Folder, File } from '@phosphor-icons/react';
import { History } from '@/components/types/historyDataType';
import { PageData } from '@/components/types/pageDataType';

export function MarkdownFileList(
  { pageData, setPage } : {
    pageData: PageData,
    setPage: (page: string) => void,
  }
) {
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const selectedFile = useMemo(() => Array.from(selectedKeys).join(", "), [selectedKeys]);

  const handleTargetPageChange = (newPage: string) => {
    // ページ遷移時の処理
    setPage(newPage);
  };

  return (
    <div className="h-dvh bg-blue-50 w-200">
      <div className="m-1 p-1">ファイル一覧</div>
      <div className="container mx-auto">
        <Listbox aria-label="filelist" variant="flat" selectionMode="single" selectedKeys={selectedKeys}>
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
