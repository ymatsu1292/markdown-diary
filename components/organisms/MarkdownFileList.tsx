import { useState, useMemo } from 'react';
import { ScheduleData } from '@/components/types/scheduleDataType';
import { Listbox, ListboxItem } from '@nextui-org/react';
import { Folder, File } from '@phosphor-icons/react';

export function MarkdownFileList(
  { scheduleData, handleTargetPageChange } : {
    scheduleData: ScheduleData | null,
    handleTargetPageChange: (newPage: string) => void
  }
) {
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const selectedFile = useMemo(() => Array.from(selectedKeys).join(", "), [selectedKeys]);

  console.log("scheduleData=", scheduleData);
  
  return (
    <div className="h-dvh bg-blue-50 w-200">
      <div className="m-1 p-1">ファイル一覧</div>
      {scheduleData != null ? 
        <div className="container mx-auto">
          <Listbox aria-label="filelist" variant="flat" selectionMode="single" selectedKeys={selectedKeys}>
            { scheduleData.markdownFiles.map((item) => 
              <ListboxItem key={item} startContent={<File size={16} />}
                onPress={(e) => {
                  if (e.target instanceof HTMLElement) {
                    handleTargetPageChange(String(e.target.dataset.key).slice(0, -3));
                  }
                }}>
                {item}
              </ListboxItem>)
            }
          </Listbox>
        </div>
        :
        <div className="grid place-items-center h-full">
          準備中
        </div>
      }
    </div>
  );
}
