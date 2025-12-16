'use client'

import { useState } from 'react'
import { Printer, ArrowLeft, FileText, Check } from 'lucide-react'
import Link from 'next/link'

export default function PrintingPage() {
  const [lastPrint, setLastPrint] = useState<string | null>(null)

  const handlePrint = (size: '80mm' | '58mm') => {
    // Criar conteúdo de teste
    const content = generateTestContent(size)
    
    // Criar iframe invisível para impressão
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'fixed'
    printFrame.style.top = '-10000px'
    printFrame.style.left = '-10000px'
    printFrame.style.width = size === '80mm' ? '80mm' : '58mm'
    document.body.appendChild(printFrame)

    const doc = printFrame.contentDocument || printFrame.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(content)
    doc.close()

    // Aguardar carregamento e imprimir
    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow?.print()
        setLastPrint(size)
        
        // Remover iframe após impressão
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }, 100)
    }
  }

  const generateTestContent = (size: '80mm' | '58mm') => {
    const width = size === '80mm' ? '80mm' : '58mm'
    const charPerLine = size === '80mm' ? 48 : 32
    const separator = '─'.repeat(charPerLine)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Teste de Impressão ${size}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: ${size === '80mm' ? '12px' : '10px'};
            width: ${width};
            padding: 5mm;
            line-height: 1.4;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: ${size === '80mm' ? '16px' : '14px'}; }
          .separator { border-top: 1px dashed #000; margin: 8px 0; }
          .double { border-top: 2px solid #000; margin: 8px 0; }
          .item { display: flex; justify-content: space-between; }
          .right { text-align: right; }
          .mt { margin-top: 8px; }
          .mb { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="center bold large mb">
          ═══════════════════<br>
          TESTE DE IMPRESSÃO<br>
          ═══════════════════
        </div>
        
        <div class="center mb">
          Papel: ${size}<br>
          ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <div class="separator"></div>
        
        <div class="bold mb">TESTE DE CARACTERES:</div>
        <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
        <div>abcdefghijklmnopqrstuvwxyz</div>
        <div>0123456789</div>
        
        <div class="separator"></div>
        
        <div class="bold mb">TESTE DE ACENTOS:</div>
        <div>ÁÉÍÓÚÂÊÎÔÛÃÕ</div>
        <div>áéíóúâêîôûãõ</div>
        <div>Ç ç Ñ ñ</div>
        
        <div class="separator"></div>
        
        <div class="bold mb">TESTE DE SÍMBOLOS:</div>
        <div>R$ € £ ¥ @ # % &</div>
        <div>+ - * / = < > ( )</div>
        <div>! ? . , ; : " '</div>
        
        <div class="separator"></div>
        
        <div class="bold mb">TESTE DE FORMATAÇÃO:</div>
        <div class="item">
          <span>Item Normal</span>
          <span>R$ 10,00</span>
        </div>
        <div class="item bold">
          <span>Item Negrito</span>
          <span>R$ 20,00</span>
        </div>
        <div class="item">
          <span>Item Longo Nome...</span>
          <span>R$ 5,00</span>
        </div>
        
        <div class="double"></div>
        
        <div class="item bold large">
          <span>TOTAL</span>
          <span>R$ 35,00</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="center mt">
          ${separator}<br>
          Linha de ${charPerLine} caracteres<br>
          ${separator}
        </div>
        
        <div class="center mt mb">
          ✓ Se você consegue ler isto,<br>
          a impressora está funcionando!
        </div>
        
        <div class="center">
          <div class="bold">▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄</div>
          <div>FIM DO TESTE</div>
          <div class="bold">▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀</div>
        </div>
      </body>
      </html>
    `
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/diagnostics"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Diagnósticos
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Printer className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">🖨️ Doutor da Impressora</h1>
          </div>
          <p className="text-slate-600">
            Teste a impressão térmica sem criar pedidos.
          </p>
        </div>

        {/* Botões de Teste */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 80mm */}
          <button
            onClick={() => handlePrint('80mm')}
            className="group p-8 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Printer className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Papel 80mm</h2>
              <p className="text-slate-500 text-sm mb-4">Bobina padrão (48 caracteres)</p>
              <div className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold group-hover:bg-blue-700 transition-colors">
                🖨️ Imprimir Teste
              </div>
            </div>
          </button>

          {/* 58mm */}
          <button
            onClick={() => handlePrint('58mm')}
            className="group p-8 bg-white rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Printer className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Papel 58mm</h2>
              <p className="text-slate-500 text-sm mb-4">Bobina compacta (32 caracteres)</p>
              <div className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold group-hover:bg-emerald-700 transition-colors">
                🖨️ Imprimir Teste
              </div>
            </div>
          </button>
        </div>

        {/* Status */}
        {lastPrint && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-700">
                Última impressão: <strong>{lastPrint}</strong> às {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            O que é testado:
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              <span><strong>Caracteres:</strong> Alfabeto completo maiúsculo e minúsculo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              <span><strong>Acentuação:</strong> ÁÉÍÓÚ, ãõ, Ç (essencial para PT-BR)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              <span><strong>Símbolos:</strong> R$, @, #, %, operadores matemáticos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              <span><strong>Formatação:</strong> Texto normal, negrito, alinhamento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              <span><strong>Linhas:</strong> Separadores tracejados e sólidos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              <span><strong>Largura:</strong> Linha de referência com caracteres máximos</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Dica: Certifique-se de que a impressora está conectada e selecionada como padrão.
        </div>
      </div>
    </div>
  )
}
