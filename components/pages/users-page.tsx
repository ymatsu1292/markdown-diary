"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";

import type { Key } from "react";

import { Table, Pagination } from "@heroui/react";
import { Input } from "@heroui/react";
import { Card } from "@heroui/react";
import { Select, ListBox } from "@heroui/react";
import { useOverlayState } from "@heroui/react";

import { useSession } from "@/lib/auth-client";

import { MdNavbar } from "@/components/organisms/md-navbar";
import { UserEditModal } from "@/components/organisms/user-edit-modal";

import { baseUserData } from "@/types/users-data-type";
import type { UserData, UsersData } from "@/types/users-data-type";

const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());
const calcBanExpiresIn = (banExpires: string): string => {
  //console.log(new Date(banExpires).getTime());
  //console.log(new Date().getTime());
  //console.log("banExpires.date=", banExpires.calendarDate.toDate(getLocalTimeZone()));
  return String(Math.max(0, Math.ceil((new Date(banExpires).getTime() - new Date().getTime()) / 1000)));
};

const columns = [
  {id: "username", name: "ユーザID"},
  {id: "name", name: "名前"},
  {id: "email", name: "メール"},
  {id: "role", name: "ロール"},
  {id: "banned", name: "banned"},
  {id: "banReason", name: "banReason"},
  {id: "banExpires", name: "banExpires"},
];

export function UsersPage() {
  //const { mutate } = useSWRConfig();
  const { data: session } = useSession();
  const [ filterKey, setFilterKey ] = useState<Key | null>("name");
  const [ filterString, setFilterString ] = useState<string>("");
  const [ page, setPage ] = useState<number>(1);
  const { data, isLoading } = useSWR<UsersData, boolean>(`api/users?page=${page}&key=${filterKey as string}&filter=${filterString}`, 
    fetcher);
  const rowsPerPage = 10;
  const [ editUser, setEditUser ] = useState<UserData>(baseUserData);
  const [ origUser, setOrigUser ] = useState<UserData>(baseUserData);

  const totalPages = useMemo(() => {
    return data?.count ? Math.ceil(data.count / rowsPerPage) : 0;
  }, [data?.count, rowsPerPage]);
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);
  const paginatedItems = data?.results || [];
  const start = (page - 1) * rowsPerPage + 1;
  //console.log("data2=", data);
  const end = Math.min(page * rowsPerPage, paginatedItems.length || 0);
  //const loadingState = isLoading || data?.results?.length === 0 ? "loading" : "idle";

  //const [ isOpen, setIsOpen ] = useState(false);
  const modalState = useOverlayState({defaultOpen: false});

  return (
    <div>
      <MdNavbar doSearchIfNecessary={null} goPageIfNecessary={null} />
      {session?.user?.role === "admin" ?
        <Card className="m-1 p-1">
          <div className="flex m-1 p-1">
            <Select className="max-w-xs"
              value={String(filterKey)}
              onChange={(value) => setFilterKey(value)}
              aria-label="filter-list"
            >
              <Select.Trigger className="max-w-xs">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {columns.map((column) => (
                    <ListBox.Item key={column.id} id={column.id} textValue={column.name}>
                      {column.name}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <Input className="max-w-xs ml-1" aria-label="filter-test"
              value={String(filterString)} onChange={(event) => setFilterString(event.target.value || "")}
            />
          </div>
        </Card>
        :
        <></>
      }
      <UserEditModal modalState={modalState}
        origUser={origUser} setOrigUser={setOrigUser}
        editUser={editUser} setEditUser={setEditUser}
        page={page} filterKey={String(filterKey)} filter={filterString}
      />
      
      <Table className="m-1 p-1">
        <Table.ScrollContainer>
          {!isLoading &&
          <Table.Content aria-label="tsc" className="overflow-y-auto"
            onRowAction={(key) => {
              const item = (data?.results ?? []).find(item0 => item0.id === key);
              if (item) {
                if (!item.username) {
                  item.username = "";
                }
                setOrigUser({...item, banExpiresIn: calcBanExpiresIn(item.banExpires),
                  password: item.password || "", newPassword: ""} as UserData);
                setEditUser({...item, banExpiresIn: calcBanExpiresIn(item.banExpires),
                  password: item.password || "", newPassword: ""} as UserData);
                modalState.open();
              }
            }}
          >
            <Table.Header columns={columns}>
              {(column) => (
                <Table.Column isRowHeader={column.id === "username"}>{column.name}</Table.Column>
              )}
            </Table.Header>
            <Table.Body items={paginatedItems}>
              {(user) => (
                <Table.Row>
                  <Table.Collection items={columns}>
                    {(column) => ( column.id !== "banned" ?
                      <Table.Cell>{user[column.id as keyof typeof user]}</Table.Cell>
                      :
                      <Table.Cell>{user[column.id as keyof typeof user] ? "banned" : ""}</Table.Cell>
                    )}
                  </Table.Collection>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
          }
        </Table.ScrollContainer>
        <Table.Footer>
          <Pagination size="sm">
            <Pagination.Summary>
              {start} to {end} of {data?.count} results
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous isDisabled={page === 1} 
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Pagination.PreviousIcon />
                                               Prev
                </Pagination.Previous>
              </Pagination.Item>
              {pages.map((p) => (
                <Pagination.Item key={p}>
                  <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next isDisabled={page === totalPages} 
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                                               Next
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </Table.Footer>
      </Table>
    </div>
  );
}
