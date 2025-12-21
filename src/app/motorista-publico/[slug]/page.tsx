'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Truck, Star, MapPin, Phone, Mail, Calendar, Package, 
  TrendingUp, Award, Clock, Loader2, CheckCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DriverPublicProfile {
  id: string
  name: string
  phone: string
  email: string | null
  vehicle_type: string | null
  vehicle_plate: string | null
  total_deliveries: number
  rating: number
  is_available: boolean
  created_at: string
  store?: {
    name: string
    slug: string
  }
}

interface DriverStats {
  totalDeliveries: number
  rating: number
  joinedDate: string
  vehicleType: string
}

export default function DriverPublicProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [driver, setDriver] = useState<DriverPublicProfile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDriverProfile()
  }, [slug])

  async function loadDriverProfile() {
    try {
      setLoading(true)
      
      // Buscar motorista pelo slug (usando phone como slug único)
      const { data, error: driverError } = await supabase
        .from('drivers')
        .select(`
          id,
          name,
          phone,
          email,
          vehicle_type,
          vehicle_plate,
          total_deliveries,
          rating,
          is_available,
          created_at,
          stores:store_id (name, slug)
        `)
        .eq('phone', slug.replace(/-/g, ''))
        .eq('is_active', true)
        .single()

      if (driverError || !data) {
        setError('Perfil de motorista não encontrado')
        setLoading(false)
        return
      }

      setDriver(data as any)
    } catch (err) {
      setError('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const getVehicleLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      moto: 'Moto',
      carro: 'Carro',
      bicicleta: 'Bicicleta',
      patinete: 'Patinete'
    }
    return type ? labels[type] || type : 'Não informado'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
          <Loader2 className="w-14 h-14 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (error || !driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <Truck className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Perfil não encontrado</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Truck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{driver.name}</h1>
          <p className="text-xl text-cyan-100 mb-6">Entregador Profissional</p>
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <div className={`w-3 h-3 rounded-full ${driver.is_available ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="font-medium">
              {driver.is_available ? 'Disponível' : 'Indisponível'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total de Entregas</p>
                <p className="text-3xl font-bold text-slate-800">{driver.total_deliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avaliação</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-slate-800">{driver.rating.toFixed(1)}</p>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Veículo</p>
                <p className="text-xl font-bold text-slate-800">{getVehicleLabel(driver.vehicle_type)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-cyan-600" />
            Sobre o Entregador
          </h2>

          <div className="space-y-4">
            {driver.vehicle_plate && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Truck className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Placa do Veículo</p>
                  <p className="font-semibold text-slate-800">{driver.vehicle_plate}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Membro desde</p>
                <p className="font-semibold text-slate-800">
                  {new Date(driver.created_at).toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {driver.store && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Parceiro de</p>
                  <p className="font-semibold text-slate-800">{driver.store.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Conquistas</h3>
            <div className="flex flex-wrap gap-3">
              {driver.total_deliveries >= 100 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">100+ Entregas</span>
                </div>
              )}
              {driver.rating >= 4.5 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Top Rated</span>
                </div>
              )}
              {driver.total_deliveries >= 500 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Veterano</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          {driver.store && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 text-center">
                <p className="text-slate-600 mb-4">
                  Quer fazer pedidos com {driver.name}?
                </p>
                <Button 
                  asChild
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-500/25"
                >
                  <a href={`/${driver.store.slug}`}>
                    Ver Cardápio de {driver.store.name}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-100 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            Perfil público de entregador • Powered by Pediu Food
          </p>
        </div>
      </div>
    </div>
  )
}
