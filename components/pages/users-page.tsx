"use client";
import { useState, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";

import { Eye } from "lucide-react";
import { Table } from "@heroui/react";
import { Input, Button, TextField, FieldError } from "@heroui/react";
import { Card } from "@heroui/react";
import { Select, Label, ListBox, TextArea } from "@heroui/react";
import { Modal, useOverlayState } from "@heroui/react";

import { useSession, authClient } from "@/lib/auth-client";

import { MdNavbar } from "@/components/organisms/md-navbar";
import { UserData, UsersData, baseUserData, Role } from "@/types/users-data-type";

const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());

const roles: { key: Role; label: string; }[] = [
  {key: "admin", label: "管理者"},
  {key: "user", label: "一般ユーザ"},
];

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
  const { mutate } = useSWRConfig();
  const { data: session } = useSession();
  const [ page, setPage ] = useState<number>(1);
  const { data, isLoading } = useSWR<UsersData, boolean>(`api/users?page=${page}`, 
    fetcher, { keepPreviousData: true, });
  const rowsPerPage = 10;
  const [ editUser, setEditUser ] = useState<UserData>(baseUserData);
  const [ origUser, setOrigUser ] = useState<UserData>(baseUserData);
  const [ errorMessage, setErrorMessage ] = useState<string>("");

  const totalPages = useMemo(() => {
    return data?.count ? Math.ceil(data.count / rowsPerPage) : 0;
  }, [data?.count, rowsPerPage]);
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);
  const paginatedItems = data?.results || [];
  const start = (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, data?.results.length || 0);
  const loadingState = isLoading || data?.results?.length === 0 ? "loading" : "idle";

  const [ passwordIsVisible, setPasswordIsVisible ] = useState<boolean>(false);
  const togglePasswordIsVisible = () => setPasswordIsVisible(!passwordIsVisible);
  const [ oldPasswordIsVisible, setOldPasswordIsVisible ] = useState<boolean>(false);
  const toggleOldPasswordIsVisible = () => setOldPasswordIsVisible(!oldPasswordIsVisible);

  const [ isOpen, setIsOpen ] = useState(false);
  const modalState = useOverlayState({defaultOpen: false});

  let hasError: boolean = false;
  
  const usernameErrors: string[] = [];
  if (editUser.username.length < 2) {
    usernameErrors.push("ユーザ名は3文字以上にしてください");
    hasError = true;
  }
  if (!editUser.username.match(/^[A-Za-z0-9_-]+$/)) {
    usernameErrors.push("ユーザ名にはアルファベット・数字・-・_のみ利用可能です");
    hasError = true;
  }
  
  const nameErrors: string[] = [];
  
  const emailErrors: string[] = [];
  if (!editUser.email.match(/^.+@.+$/)) {
    emailErrors.push("メールアドレスには@が必要です");
    hasError = true;
  }
  
  const passwordErrors: string[] = [];
  if (editUser.newPassword && (editUser.id == "" || editUser.newPassword.length > 0) && editUser.newPassword.length < 8) {
    passwordErrors.push("パスワードは8文字以上にしてください");
    hasError = true;
  }
  
  const onSubmit = async () => {
    let result = true;
    if (origUser.id == "") {
      // 新規
      const { data: newUser, error } = await authClient.admin.createUser({
        email: editUser.email,
        password: editUser.password,
        name: editUser.name,
        role: editUser.role,
      });
      if (newUser) {
        const { data: updatedUser, error: error2 } = await authClient.admin.updateUser({
          userId: newUser.user.id,
          data: { username: editUser.username },
        });
        if (!updatedUser) {
          setErrorMessage(error2?.message || "");
          result = false;

          await authClient.admin.removeUser({
            userId: newUser.user.id,
          });
        }
      } else {
        setErrorMessage(error?.message || "system error");
        result = false;
      }
    } else if (session?.user?.role === "admin") {
      // 更新
      setErrorMessage("");
      const updateData: { [key: string]: string } = {};
      if (origUser.email != editUser.email) {
        updateData["email"] = editUser.email;
      }
      if (origUser.name != editUser.name) {
        updateData["name"] = editUser.name;
      }
      if (origUser.username != editUser.username) {
        updateData["username"] = editUser.username;
      }
      if (Object.keys(updateData).length > 0) {
        const { error: error2 } = await authClient.admin.updateUser({
          userId: editUser.id,
          data: updateData,
        });
        setErrorMessage(error2?.message || "");
        if (error2 !== null) {
          result = false;
        }
      }
      if (editUser.newPassword !== "") {
        const { error: error2 } = await authClient.admin.setUserPassword({
          userId: editUser.id,
          newPassword: editUser?.newPassword || "",
        });
        setErrorMessage(error2?.message || "");
        if (error2 !== null) {
          result = false;
          setErrorMessage(error2?.message || "system error");
        }
      }
      if (result && origUser.role != editUser.role && editUser.id != undefined) {
        const { error: error3 } = await authClient.admin.setRole({
          userId: editUser.id,
          role: editUser.role,
        });
        if (error3 !== null) {
          result = false;
          setErrorMessage(error3?.message || "system error");
        }
      }
    } else {
      // 更新
      setErrorMessage("");
      const updateData: { [key: string]: string } = {};
      if (origUser.email != editUser.email) {
        updateData["email"] = editUser.email;
      }
      if (origUser.name != editUser.name) {
        updateData["name"] = editUser.name;
      }
      if (origUser.username != editUser.username) {
        updateData["username"] = editUser.username;
      }
      if (Object.keys(updateData).length > 0) {
        await authClient.updateUser(updateData);
      }
      // 一般ユーザのパスワード変更
      if (editUser.password != "" && editUser.newPassword != "" && editUser.newPassword != undefined) {
        const { error: error2 } = await authClient.changePassword({
          newPassword: editUser.newPassword,
          currentPassword: editUser.password,
          revokeOtherSessions: true,
        });
        if (error2 != null) {
          setErrorMessage(error2?.message || "");
          result = false;
        }
      }
    }
    return result;
  };

  return (
    <div>
      <MdNavbar doSearchIfNecessary={null} goPageIfNecessary={null} />
      {session?.user?.role === "admin" ?
        <Card className="m-1 p-1">
          <div className="flex m-1 p-1">
            <Input className="max-w-xs" />
            <Button variant="primary" className="m-1 p-1 rounded-lg">フィルタ</Button>
          </div>
        </Card>
        :
        <></>
      }
      <Modal isOpen={modalState.isOpen}>
        <Button variant="primary" className="m-1 p-1 rounded-lg" onPress={() => {
          setOrigUser(baseUserData);
          setEditUser(baseUserData);
          modalState.open();
        }}>ユーザ追加</Button>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header className="flex flex-col gap-1">{
                editUser.id == "" ? <>ユーザ追加</> : <>ユーザ情報編集</>
              }</Modal.Header>
              <Modal.Body>
                <div className="flex flex-col m-2 p-2">
                  <div className="flex flex-row items-center">
                    <Label className="w-20">ユーザID</Label>
                    <Input key="userId"
                      className="m-1 p-1 w-80"
                      value={editUser.id}
                      disabled
                    />
                  </div>
                  <div className="flex flex-row items-center">
                    <Label className="w-20">ユーザ名</Label>
                    <TextField isRequired isInvalid={usernameErrors.length > 0}
                      name="username"
                      onChange={(value) => setEditUser({...editUser, username: value} as UserData)}
                    >
                      <Input key="username"
                        className="m-1 p-1 w-80"
                        value={editUser.username}
                        variant={editUser.username == origUser.username ? "primary" : "secondary"}
                      />
                      {usernameErrors.map((error, i) => (
                        <FieldError>{error}</FieldError>
                      ))}
                    </TextField>
                  </div>
                  <div className="flex flex-row items-center">
                    <Label className="w-20">氏名</Label>
                    <TextField isInvalid={nameErrors.length > 0}
                      name="name"
                      onChange={(value) => setEditUser({...editUser, name: value} as UserData)}
                    >
                      <Input key="name"
                        className="m-1 p-1 w-80"
                        value={editUser.name}
                        variant={editUser.name == origUser.name ? "primary" : "secondary"}
                      />
                      {nameErrors.map((error, i) => (
                        <FieldError>{error}</FieldError>
                      ))}
                    </TextField>
                  </div>
                  <div className="flex flex-row items-center">
                    <Label className="w-20">メールアドレス</Label>
                    <TextField
                      name="email"
                      onChange={(value) => setEditUser({...editUser, email: value} as UserData)}
                    >
                      <Input key="email"
                        className="m-1 p-1 w-80"
                        value={editUser.email}
                        variant={(editUser.email == origUser.email) ? "primary" : "secondary"}
                        data-invalid={emailErrors.length > 0}
                        disabled={session?.user?.role === "admin" ? false: true}
                      />
                      {emailErrors.map((error, i) => (
                        <FieldError>{error}</FieldError>
                      ))}
                    </TextField>
                  </div>
                  {session?.user?.role != "admin" ?
                    <div className="flex flex-row items-center">
                      <Label className="w-20">旧パスワード</Label>
                      <TextField name="old-password"
                        onChange={(value) => setEditUser({...editUser, password: value} as UserData)}
                      >
                        <Input key="old-password" autoComplete="new-password"
                          className="m-1 p-1 w-80"
                          value={editUser.password}
                          variant={(editUser.password == "") ? "primary" : "secondary"}
                          type={oldPasswordIsVisible ? "text" : "password"}
                        />
                        <button className="focus:outline-solid outline-transparent" type="button"
                          onClick={toggleOldPasswordIsVisible}>
                          <Eye />
                        </button>
                      </TextField>
                    </div>
                    :
                    <></>
                  }
                  <div className="flex flex-row items-center">
                    <Label className="w-20">パスワード</Label>
                    <TextField name="new-password"
                      onChange={(value) => setEditUser({...editUser, newPassword: value} as UserData)}
                    >
                      <Input key="new-password" autoComplete="new-password"
                        className="m-1 p-1 w-80"
                        value={editUser.newPassword}
                        variant={(editUser.newPassword == "") ? "primary" : "secondary"}
                        type={passwordIsVisible ? "text" : "password"}
                        data-invalid={passwordErrors.length > 0}
                      />
                      {passwordErrors.map((error, i) => (
                        <FieldError>{error}</FieldError>
                      ))}
                    </TextField>
                    <button className="focus:outline-solid outline-transparent" type="button"
                      onClick={togglePasswordIsVisible}>
                      <Eye />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <Label className="w-20">ロール</Label>
                    <Select key="role" 
                      className="ml-1 w-80"
                      selectedKey={editUser.role}
                      onChange={(value) => setEditUser({...editUser, role: value as Role} as UserData)}
                      isDisabled={editUser.id == session?.user?.id}
                      aria-label="role"
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {roles.map((role) => (
                            <ListBox.Item id={role.key} textValue={role.label}>
                              {role.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}              
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>
                <TextArea rows={1} fullWidth>{errorMessage}</TextArea>
                <div className="flex flex-wrap gap-1">
                  <Button variant="primary"
                    onPress={async () => {
                      const res = await onSubmit();
                      mutate(`api/users?page=${page}`, true);
                      if (res) {
                        modalState.close();
                      }
                    }}
                    isDisabled={hasError}
                  >{
                    editUser.id == "" ? <>追加</> : <>更新</>
                  }</Button>
                  <Button variant="danger"
                    onPress={async () => {
                      const { error } = await authClient.admin.removeUser({
                        userId: editUser.id
                      });
                      if (error) {
                        alert(error);
                      } else {
                        mutate(`api/users?page=${page}`, true);
                        modalState.close();
                      }
                    }}
                    isDisabled={editUser.id == session?.user?.id}
                  >削除</Button>
                  <span className="grow"></span>
                  <Button variant="danger"
                    onPress={() => {
                      setEditUser(origUser)
                    }}
                  >
                     クリア
                  </Button>
                  <Button variant="danger"
                    onPress={modalState.close}
                  >
                     閉じる
                  </Button>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>              
      </Modal>
      <Table className="m-1 p-1">
        <Table.ScrollContainer>
          <Table.Content aria-label="tsc" className="overflow-y-auto"
            onRowAction={(key) => {
              const item = (data?.results ?? []).find(item0 => item0.id === key);
              if (item) {
                if (!item.username) {
                  item.username = "";
                }
                setOrigUser({...item, password: item.password || "", newPassword: ""} as UserData);
                setEditUser({...item, password: item.password || "", newPassword: ""} as UserData);
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
                    {(column) => <Table.Cell>{user[column.id as keyof typeof user]}</Table.Cell>}
                  </Table.Collection>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
