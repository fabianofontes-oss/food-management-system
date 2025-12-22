'use client'

import { useState } from 'react'
import { Truck, ArrowRight, ArrowLeft, CheckCircle, Upload, User, MapPin, Car, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { validarCPF, formatarCPF, formatarTelefone, formatarCEP, buscarCEP } from '@/lib/marketing-utils'

type Step = 1 | 2 | 3 | 4 | 5

export default function CadastroMotoristaPage() {
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    tipoVeiculo: 'moto',
    placa: '',
    cnh: '',
    validadeCNH: '',
    chavePix: '',
    tipoChavePix: 'cpf',
  })

  const handleCEPChange = async (cep: string) => {
    setFormData({ ...formData, cep })
    if (cep.replace(/\D/g, '').length === 8) {
      const endereco = await buscarCEP(cep)
      if (endereco) {
        setFormData(prev => ({
          ...prev,
          rua: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.localidade,
          estado: endereco.uf,
        }))
      }
    }
  }

  const canProceed = () => {
    if (step === 1) return formData.nome && validarCPF(formData.cpf) && formData.telefone && formData.email
    if (step === 2) return formData.cep && formData.rua && formData.numero && formData.cidade
    if (step === 3) return formData.tipoVeiculo && (formData.tipoVeiculo === 'bicicleta' || formData.placa) && formData.cnh
    if (step === 4) return formData.chavePix
    return false
  }

  const handleSubmit = () => {
    setStep(5)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Cadastro de Motorista
          </h1>
          {step < 5 && (
            <p className="text-slate-600">Passo {step} de 4</p>
          )}
        </div>

        {/* Progress Bar */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full ${
                    s <= step ? 'bg-cyan-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-cyan-600" />
                Dados Pessoais
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CPF *</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data de Nascimento *</label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Telefone/WhatsApp *</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder="joao@email.com"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-cyan-600" />
                Endereço
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CEP *</label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleCEPChange(formatarCEP(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rua *</label>
                  <input
                    type="text"
                    value={formData.rua}
                    onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número *</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder="Apto, bloco, etc"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Bairro *</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cidade *</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Car className="w-6 h-6 text-cyan-600" />
                Veículo e Documentos
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Veículo *</label>
                <select
                  value={formData.tipoVeiculo}
                  onChange={(e) => setFormData({ ...formData, tipoVeiculo: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                >
                  <option value="moto">Moto</option>
                  <option value="carro">Carro</option>
                  <option value="bicicleta">Bicicleta</option>
                </select>
              </div>
              {formData.tipoVeiculo !== 'bicicleta' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Placa *</label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                    placeholder="ABC-1234"
                    maxLength={8}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Número CNH *</label>
                <input
                  type="text"
                  value={formData.cnh}
                  onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder="00000000000"
                  maxLength={11}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Validade CNH *</label>
                <input
                  type="date"
                  value={formData.validadeCNH}
                  onChange={(e) => setFormData({ ...formData, validadeCNH: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <p className="text-sm text-cyan-800">
                  📸 Upload de fotos da CNH será solicitado após aprovação inicial
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-cyan-600" />
                Dados Bancários
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Chave PIX *</label>
                <select
                  value={formData.tipoChavePix}
                  onChange={(e) => setFormData({ ...formData, tipoChavePix: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                >
                  <option value="cpf">CPF</option>
                  <option value="email">Email</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chave PIX *</label>
                <input
                  type="text"
                  value={formData.chavePix}
                  onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                  placeholder={formData.tipoChavePix === 'cpf' ? '000.000.000-00' : 'Sua chave PIX'}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  💡 Usamos PIX para pagamentos rápidos toda sexta-feira
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Cadastro Enviado!
              </h2>
              <p className="text-slate-600 mb-8">
                Analisaremos seus dados em até 24h.
                <br />
                Você receberá um WhatsApp com o resultado.
              </p>
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <p className="font-medium text-slate-800 mb-4">Enquanto isso...</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• Baixe o app (em breve)</p>
                  <p>• Entre no grupo de motoristas</p>
                  <p>• Assista o tutorial</p>
                </div>
              </div>
              <Button asChild size="lg">
                <Link href="/para-motoristas">
                  Voltar para Home
                </Link>
              </Button>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((step - 1) as Step)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}
              <Button
                onClick={() => step === 4 ? handleSubmit() : setStep((step + 1) as Step)}
                disabled={!canProceed()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                {step === 4 ? 'Finalizar Cadastro' : 'Próximo'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Link para voltar */}
        {step === 1 && (
          <div className="text-center mt-6">
            <Link href="/para-motoristas" className="text-slate-600 hover:text-slate-800 text-sm">
              ← Voltar para landing
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
