"use client";
import { useState, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";

import { Eye } from "lucide-react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
import { Pagination, getKeyValue } from "@heroui/react";
import { Spinner, Input, Button } from "@heroui/react";
import { Card, CardBody } from "@heroui/react";
import { Select, SelectItem } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/react";
import { useSession, authClient } from "@/lib/auth-client";

import { MdNavbar } from "@/components/organisms/md-navbar";
import { UserData, UsersData, baseUserData, Role } from "@/types/users-data-type";

const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());

const roles: { key: Role; label: string; }[] = [
  {key: "admin", label: "管理者"},
  {key: "user", label: "一般ユーザ"},
];

export function UsersPage() {
  const { mutate } = useSWRConfig();
  const { data: session } = useSession();
  console.log("UsersPage session=", session);
  const [page, setPage] = useState<number>(1);
  const {data, isLoading} = useSWR<UsersData, boolean>(`api/users?page=${page}`, 
    fetcher, { keepPreviousData: true, });
  const rowsPerPage = 10;
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [editUser, setEditUser] = useState<UserData>(baseUserData);
  const [origUser, setOrigUser] = useState<UserData>(baseUserData);
  const [errorMessage, setErrorMessage] = useState<string>("");
  // const tmpmsg = useMemo(() => {
  //   return errorMessage;
  // }, [errorMessage]);

  const pages = useMemo(() => {
    return data?.count ? Math.ceil(data.count / rowsPerPage) : 0;
  }, [data?.count, rowsPerPage]);
  const loadingState = isLoading || data?.results?.length === 0 ? "loading" : "idle";

  console.log("data=", data);

  const [ passwordIsVisible, setPasswordIsVisible ] = useState<boolean>(false);
  const togglePasswordIsVisible = () => setPasswordIsVisible(!passwordIsVisible);
  const [ oldPasswordIsVisible, setOldPasswordIsVisible ] = useState<boolean>(false);
  const toggleOldPasswordIsVisible = () => setOldPasswordIsVisible(!oldPasswordIsVisible);

  console.log("editUser=", editUser);
  console.log("origUser=", origUser);

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
      console.log("newUser=", newUser);
      console.log("error=", error);
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
    } else if (session?.user.role === "admin") {
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
      console.log("updateData=", updateData);
      if (Object.keys(updateData).length > 0) {
        const { data: updatedUser, error: error2 } = await authClient.admin.updateUser({
          userId: editUser.id,
          data: updateData,
        });
        console.log("updatedData=", updatedUser);
        setErrorMessage(error2?.message || "");
        if (error2 !== null) {
          result = false;
        }
      }
      if (editUser.newPassword !== "") {
        console.log("change password0:", editUser);
        const { data: updatedUser, error: error2 } = await authClient.admin.setUserPassword({
          userId: editUser.id,
          newPassword: editUser?.newPassword || "",
        });
        setErrorMessage(error2?.message || "");
        console.log("change password1:", updatedUser);
        console.log("change password2:", error2);
        if (error2 !== null) {
          result = false;
          setErrorMessage(error2?.message || "system error");
        }
      }
      if (result && origUser.role != editUser.role && editUser.id != undefined) {
        console.log("change role0:", editUser.role);
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
      console.log("updateData=", updateData);
      if (Object.keys(updateData).length > 0) {
        const res = await authClient.updateUser(updateData);
        console.log("res=", res);
        /*
        setErrorMessage(error?.message || "");
        if (error !== null) {
          result = false;
        }
         */
      }
      // 一般ユーザのパスワード変更
      if (editUser.password != "" && editUser.newPassword != "" && editUser.newPassword != undefined) {
        const { error: error2 } = await authClient.changePassword({
          newPassword: editUser.newPassword,
          currentPassword: editUser.password,
          revokeOtherSessions: true,
        });
        console.log("error2=", error2);
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
      {session!.user.role === "admin" ?
        <Card className="m-1 p-1">
          <div className="flex m-1 p-1">
            <Input label="検索" size="sm" className="max-w-xs" />
            <Button color="primary" className="m-1 p-1">フィルタ</Button>
            <Button color="primary" className="m-1 p-1" onPress={() => {
              setOrigUser(baseUserData);
              setEditUser(baseUserData);
              onOpen();
            }}>ユーザ追加</Button>
          </div>
        </Card>
        :
        <></>
      }
      <Table
        aria-label="Users Table"
        selectionMode="single"
        selectionBehavior="replace"
        bottomContent={
          pages > 0 ? (
            <div className="flex w-full justify-center">
              <Pagination isCompact showControls showShadow color="primary" 
                page={page} total={pages} onChange={(page) => setPage(page)}
              />
            </div>
          ) : null
        }
        onRowAction={(key) => {
          const item = (data?.results ?? []).find(item0 => item0.id === key);
          if (item) {
            if (!item.username) {
              item.username = "";
            }
            setOrigUser({...item, password: item.password || "", newPassword: ""});
            setEditUser({...item, password: item.password || "", newPassword: ""});
            onOpen();
          }
        }}
      >
        <TableHeader>
          <TableColumn key="username">username</TableColumn>
          <TableColumn key="name">name</TableColumn>
          <TableColumn key="email">email</TableColumn>
          <TableColumn key="role">role</TableColumn>
          <TableColumn key="banned">banned</TableColumn>
          <TableColumn key="banReason">banReason</TableColumn>
          <TableColumn key="banExpires">banExpires</TableColumn>
        </TableHeader>
        <TableBody
          items={data?.results ?? []}
          loadingContent={<Spinner />}
          loadingState={loadingState}
        >
          {(item) => (
            <TableRow key={item?.id}>
              {(columnKey) => <TableCell>{
                getKeyValue(item, columnKey)
              }</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{
                editUser.id == "" ? <>ユーザ追加</> : <>ユーザ情報編集</>
              }</ModalHeader>
              <ModalBody>
                <Card fullWidth>
                  <CardBody>
                    <div className="flex flex-col">
                      <Input key="userId"
                        label="ユーザID" labelPlacement="outside-left"
                        classNames={{"base": "m-1 p-1", "label": "w-30", "input": "w-130"}}
                        value={editUser.id} isReadOnly isDisabled
                      />
                      <Input key="username"
                        classNames={{"base": "m-1 p-1", "label": "w-30", "input": "w-130"}}
                        value={editUser.username}
                        color={editUser.username == origUser.username ? "default" : "warning"}
                        onValueChange={(value) => setEditUser({...editUser, username: value} as UserData)}
                        label="ユーザ名" labelPlacement="outside-left"
                        isInvalid={usernameErrors.length > 0}
                        errorMessage={() => (
                          <ul>{usernameErrors.map((error, i) => (<li key={i}>{error}</li>))}</ul>
                        )}
                      />
                      <Input key="name"
                        classNames={{"base": "m-1 p-1", "label": "w-30", "input": "w-130"}}
                        value={editUser.name}
                        color={editUser.name == origUser.name ? "default" : "warning"}
                        onValueChange={(value) => setEditUser({...editUser, name: value})}
                        label="氏名" labelPlacement="outside-left"
                        isInvalid={nameErrors.length > 0}
                        errorMessage={() => (
                          <ul>{nameErrors.map((error, i) => (<li key={i}>{error}</li>))}</ul>
                        )}
                      />
                      <Input key="email"
                        classNames={{"base": "m-1 p-1", "label": "w-30", "input": "w-130"}}
                        value={editUser.email}
                        color={(editUser.email == origUser.email) ? "default" : "warning"}
                        onValueChange={(value) => setEditUser({...editUser, email: value})}
                        label="メールアドレス" labelPlacement="outside-left" 
                        isInvalid={emailErrors.length > 0}
                        errorMessage={() => (
                          <ul>{emailErrors.map((error, i) => (<li key={i}>{error}</li>))}</ul>
                        )}
                        isReadOnly={session?.user.role === "admin"? false: true}
                      />
                      {session?.user.role != "admin" ?
                      <Input key="old-password" autoComplete="new-password"
                        classNames={{"base": "m-1 p-1", "label": "w-30", "input": "w-124"}}
                        value={editUser.password}
                        color={(editUser.password == "") ? "default" : "warning"}
                        onValueChange={(value) => setEditUser({...editUser, password: value})}
                        type={oldPasswordIsVisible ? "text" : "password"}
                        endContent={<button className="focus:outline-solid outline-transparent" type="button"
                                      onClick={toggleOldPasswordIsVisible}>
                                      <Eye />
                                    </button>}
                        label="旧パスワード" labelPlacement="outside-left" 
                      />
                        : <></>}
                      <Input key="new-password" autoComplete="new-password"
                        classNames={{"base": "m-1 p-1", "label": "w-30", "input": "w-124"}}
                        value={editUser.newPassword}
                        color={(editUser.newPassword == "") ? "default" : "warning"}
                        onValueChange={(value) => setEditUser({...editUser, newPassword: value})}
                        type={passwordIsVisible ? "text" : "password"}
                        endContent={<button className="focus:outline-solid outline-transparent" type="button"
                                      onClick={togglePasswordIsVisible}>
                                      <Eye />
                                    </button>}
                        label="パスワード" labelPlacement="outside-left" 
                        isInvalid={passwordErrors.length > 0}
                        errorMessage={() => (
                          <ul>{passwordErrors.map((error, i) => (<li key={i}>{error}</li>))}</ul>
                        )}
                      />
                      <Select key="role" 
                        classNames={{"base": "m-1 p-1", "label": "ml-2 w-28", "trigger": "w-136"}}
                        selectedKeys={[typeof editUser.role === "string" ? editUser.role : "user"]}
                        onSelectionChange={(value) => setEditUser({...editUser, role: (value.anchorKey || "user") as Role})}
                        selectionMode="single"
                        isDisabled={editUser.id == session?.user?.id}
                        label="ロール" labelPlacement="outside-left"
                      >
                        {roles.map((role) => (
                          <SelectItem key={role.key} textValue={role.label}>{role.label}</SelectItem>
                        ))}              
                      </Select>
                    </div>
                  </CardBody>
                </Card>
                <Button>{errorMessage}</Button>
                <div className="flex flex-wrap gap-1">
                  <Button color="primary"
                    onPress={async () => {
                      const res = await onSubmit();
                      console.log("onSubmit=", res);
                      mutate(`api/users?page=${page}`, true);
                      if (res) {
                        onClose();
                      }
                    }}
                    isDisabled={hasError}
                  >{
                    editUser.id == "" ? <>追加</> : <>更新</>
                  }</Button>
                  <Button color="danger"
                    onPress={async () => {
                      const { error } = await authClient.admin.removeUser({
                        userId: editUser.id
                      });
                      if (error) {
                        alert(error);
                      } else {
                        mutate(`api/users?page=${page}`, true);
                        onClose();
                      }
                    }}
                    isDisabled={editUser.id == session?.user?.id}
                  >削除</Button>
                  <span className="grow"></span>
                  <Button color="warning"
                    onPress={() => {
                      setEditUser(origUser)
                    }}
                  >
                    クリア
                  </Button>
                  <Button color="warning"
                    onPress={onClose}
                  >
                    閉じる
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
