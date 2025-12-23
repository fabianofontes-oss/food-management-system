'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { User, Phone, Mail, Truck, Calendar, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PerfilPage() {
  const params = useParams()
  const slug = params.slug as string
  const [driver, setDriver] = useState<any>(null)

  useEffect(() => {
    const driverData = localStorage.getItem(`driver_${slug}`)
    if (driverData) {
      setDriver(JSON.parse(driverData).driver)
    }
  }, [slug])

  const handleLogout = () => {
    localStorage.removeItem(`driver_${slug}`)
    window.location.href = `/${slug}/motorista`
  }

  if (!driver) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Carregando perfil...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Meu Perfil</h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{driver.name}</h2>
            <p className="text-sm text-slate-500">Entregador</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Telefone</p>
              <p className="font-medium text-slate-800">{driver.phone}</p>
            </div>
          </div>

          {driver.email && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-slate-800">{driver.email}</p>
              </div>
            </div>
          )}

          {driver.vehicle_type && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Truck className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Veículo</p>
                <p className="font-medium text-slate-800 capitalize">{driver.vehicle_type}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Comissão</p>
              <p className="font-medium text-slate-800">{driver.commission_percent || 10}%</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full mt-6 text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  )
}
