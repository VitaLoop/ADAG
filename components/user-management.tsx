"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Trash2, Edit, Lock, Mail, UserPlus } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import type { User } from "@/types/schema"

type UserManagementProps = {
  usersIniciais: User[]
  setUsers: (users: User[]) => void
}

export function UserManagement({ usersIniciais, setUsers }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState("usuarios")
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: "viewer",
  })
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer")

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const handleAddUser = () => {
    if (newUser.username && newUser.fullName && newUser.email && newUser.password) {
      const user: User = {
        ...(newUser as any),
        id: Date.now().toString(),
        isActive: true,
        dateCreated: new Date(),
        role: newUser.role || "viewer",
      }
      setUsers([...usersIniciais, user])
      setNewUser({ role: "viewer" })
      toast({
        title: "Usuário adicionado",
        description: `${user.fullName} foi adicionado com sucesso.`,
      })
    } else {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
    }
  }

  const handleInviteUser = () => {
    if (inviteEmail) {
      // Simular envio de convite por email
      toast({
        title: "Convite enviado",
        description: `Um convite foi enviado para ${inviteEmail} com nível de acesso ${getRoleName(inviteRole)}.`,
      })

      // Em um sistema real, aqui você enviaria um email com um link para cadastro
      // Por enquanto, vamos apenas adicionar o usuário com dados parciais
      const newInvitedUser: User = {
        id: Date.now().toString(),
        username: inviteEmail.split("@")[0],
        email: inviteEmail,
        fullName: "Usuário Convidado",
        role: inviteRole,
        password: Math.random().toString(36).slice(-8), // Senha temporária
        isActive: false, // Inativo até aceitar o convite
        dateCreated: new Date(),
      }

      setUsers([...usersIniciais, newInvitedUser])
      setInviteEmail("")
      setInviteRole("viewer")
      setIsInviteDialogOpen(false)
    } else {
      toast({
        title: "Erro",
        description: "Por favor, informe um email válido.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = () => {
    if (userToDelete) {
      setUsers(usersIniciais.filter((user) => user.id !== userToDelete))
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso.",
      })
    }
  }

  const handleToggleUserStatus = (id: string) => {
    setUsers(usersIniciais.map((user) => (user.id === id ? { ...user, isActive: !user.isActive } : user)))
    const updatedUser = usersIniciais.find((user) => user.id === id)
    toast({
      title: `Usuário ${updatedUser?.isActive ? "desativado" : "ativado"}`,
      description: `${updatedUser?.fullName} foi ${updatedUser?.isActive ? "desativado" : "ativado"} com sucesso.`,
    })
  }

  const handleEditUser = () => {
    if (editingUser) {
      setUsers(usersIniciais.map((user) => (user.id === editingUser.id ? editingUser : user)))
      setIsEditDialogOpen(false)
      setEditingUser(null)
      toast({
        title: "Usuário atualizado",
        description: `${editingUser.fullName} foi atualizado com sucesso.`,
      })
    }
  }

  const handleResetPassword = () => {
    if (editingUser && newPassword) {
      setUsers(usersIniciais.map((user) => (user.id === editingUser.id ? { ...user, password: newPassword } : user)))
      setIsResetPasswordDialogOpen(false)
      setEditingUser(null)
      setNewPassword("")
      toast({
        title: "Senha redefinida",
        description: `A senha de ${editingUser.fullName} foi redefinida com sucesso.`,
      })
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "editor":
        return "Editor"
      case "viewer":
        return "Visualizador"
      default:
        return role
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Administrador</Badge>
      case "editor":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Editor</Badge>
      case "viewer":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Visualizador</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  return (
    <Card className="shadow-sm md:shadow">
      <CardHeader className="px-3 py-2 md:px-6 md:py-4">
        <CardTitle className="text-lg md:text-xl">Gestão de Usuários</CardTitle>
        <CardDescription className="text-xs md:text-sm">Adicione e gerencie usuários do sistema</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
            <TabsTrigger value="usuarios" className="text-xs md:text-sm">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="convites" className="text-xs md:text-sm">
              Convites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar Usuário
              </Button>
            </div>

            {/* Tabela de usuários - versão desktop */}
            <div className="rounded-md border overflow-x-auto hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70">
                    <TableHead className="font-semibold">Nome de Usuário</TableHead>
                    <TableHead className="font-semibold">Nome Completo</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Função</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Data de Criação</TableHead>
                    <TableHead className="font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersIniciais.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-b border-border/50 dark:border-gray-700/50 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Switch checked={user.isActive} onCheckedChange={() => handleToggleUserStatus(user.id)} />
                          <span className="ml-2">{user.isActive ? "Ativo" : "Inativo"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(user.dateCreated), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user)
                              setIsResetPasswordDialogOpen(true)
                            }}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user.id)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Lista de usuários - versão mobile */}
            <div className="md:hidden space-y-3">
              {usersIniciais.map((user) => (
                <Card key={user.id} className="shadow-sm border border-border/60 dark:border-gray-700/60">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">{user.username}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        {getRoleBadge(user.role)}
                        <span className="text-xs text-muted-foreground mt-1">
                          {format(new Date(user.dateCreated), "dd/MM/yyyy", { locale: pt })}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center">
                        <Switch checked={user.isActive} onCheckedChange={() => handleToggleUserStatus(user.id)} />
                        <span className="ml-2 text-sm">{user.isActive ? "Ativo" : "Inativo"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingUser(user)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingUser(user)
                            setIsResetPasswordDialogOpen(true)
                          }}
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setUserToDelete(user.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="convites" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Convidar Novo Usuário</CardTitle>
                  <CardDescription>Envie um convite por email para um novo usuário</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="invite-role">Nível de Acesso</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value: "admin" | "editor" | "viewer") => setInviteRole(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível de acesso" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Visualizador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleInviteUser}>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Convite
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Usuário Manualmente</CardTitle>
                  <CardDescription>Adicione um usuário diretamente ao sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Nome de usuário</Label>
                        <Input
                          id="username"
                          value={newUser.username || ""}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Nome completo</Label>
                        <Input
                          id="fullName"
                          value={newUser.fullName || ""}
                          onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email || ""}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="role">Função</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value: "admin" | "editor" | "viewer") =>
                            setNewUser({ ...newUser, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password || ""}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddUser}>Adicionar Usuário</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Níveis de Acesso</CardTitle>
                <CardDescription>Explicação dos diferentes níveis de acesso disponíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 mt-0.5">
                      Administrador
                    </Badge>
                    <div>
                      <p className="text-sm">
                        Acesso completo ao sistema. Pode adicionar, editar e remover usuários, além de todas as
                        funcionalidades financeiras.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mt-0.5">
                      Editor
                    </Badge>
                    <div>
                      <p className="text-sm">
                        Pode adicionar e editar transações e planilhas, mas não pode gerenciar usuários ou excluir dados
                        permanentemente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 mt-0.5">
                      Visualizador
                    </Badge>
                    <div>
                      <p className="text-sm">
                        Acesso somente para visualização. Pode ver relatórios e dados, mas não pode fazer alterações no
                        sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Diálogo de convite */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
            <DialogDescription>Envie um convite por email para um novo usuário se juntar ao sistema.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email-dialog">Email</Label>
              <Input
                id="invite-email-dialog"
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role-dialog">Nível de Acesso</Label>
              <Select value={inviteRole} onValueChange={(value: "admin" | "editor" | "viewer") => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteUser}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Faça as alterações necessárias e clique em salvar.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-username" className="text-right">
                  Nome de usuário
                </Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-fullName" className="text-right">
                  Nome completo
                </Label>
                <Input
                  id="edit-fullName"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Função
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: "admin" | "editor" | "viewer") =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de redefinição de senha */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>Digite a nova senha para o usuário.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                Nova Senha
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword}>Redefinir Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

