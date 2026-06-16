"use client"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { User, Lock, LogOut, Save, Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const { data: session, update } = useSession()

  const [name, setName] = useState(session?.user?.name || "")
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const saveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    const res = await fetch("/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      await update({ name })
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    }
    setSavingName(false)
  }

  const savePassword = async () => {
    setPasswordError("")
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPasswordError("Preencha todos os campos")
    }
    if (newPassword.length < 6) {
      return setPasswordError("A nova senha deve ter pelo menos 6 caracteres")
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError("As senhas não coincidem")
    }
    setSavingPassword(true)
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } else {
      setPasswordError(data.error || "Erro ao alterar senha")
    }
    setSavingPassword(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie sua conta</p>
      </div>

      <div className="max-w-xl space-y-4">

        {/* Nome */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-purple-400" />
            <h2 className="font-semibold text-white text-sm">Informações pessoais</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={saveName}
              disabled={savingName}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Save size={14} />
              {savingName ? "Salvando..." : nameSuccess ? "Salvo!" : "Salvar nome"}
            </button>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-purple-400" />
            <h2 className="font-semibold text-white text-sm">Alterar senha</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Senha atual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
                <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Nova senha</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            {passwordError && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {passwordError}
              </p>
            )}

            <button
              onClick={savePassword}
              disabled={savingPassword}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700
