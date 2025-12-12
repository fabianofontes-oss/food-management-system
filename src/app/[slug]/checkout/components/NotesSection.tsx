interface NotesSectionProps {
  notes: string
  onChange: (notes: string) => void
}

export function NotesSection({ notes, onChange }: NotesSectionProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-lg">Observações</h2>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Alguma observação sobre o pedido?"
        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
        rows={3}
      />
    </div>
  )
}
