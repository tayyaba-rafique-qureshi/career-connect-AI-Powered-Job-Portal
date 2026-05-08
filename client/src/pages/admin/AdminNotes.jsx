import { useState, useEffect } from 'react'
import { Plus, Pin, Edit2, Trash2, X } from 'lucide-react'
import { getEntityNotes, createNote, updateNote, deleteNote } from '../../services/adminService'

const AdminNotes = ({ entityType, entityId }) => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [formData, setFormData] = useState({ note: '', color: 'yellow', isPinned: false })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (entityType && entityId) {
      fetchNotes()
    }
  }, [entityType, entityId])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await getEntityNotes(entityType, entityId)
      setNotes(response.data.data)
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingNote) {
        await updateNote(editingNote._id, formData)
      } else {
        await createNote({ entityType, entityId, ...formData })
      }
      resetForm()
      fetchNotes()
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId)
      setDeleteConfirm(null)
      fetchNotes()
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handleTogglePin = async (note) => {
    try {
      await updateNote(note._id, { isPinned: !note.isPinned })
      fetchNotes()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const resetForm = () => {
    setFormData({ note: '', color: 'yellow', isPinned: false })
    setEditingNote(null)
    setShowForm(false)
  }

  const getColorClass = (color) => {
    const colors = {
      yellow: 'bg-yellow-50 border-yellow-200',
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      red: 'bg-red-50 border-red-200'
    }
    return colors[color] || colors.yellow
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#2557a7] rounded-lg hover:bg-[#0d2d6e]"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <textarea
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            required
            maxLength={1000}
            rows="3"
            placeholder="Enter note (max 1000 characters)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] mb-3"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Color:</label>
              <div className="flex gap-2">
                {['yellow', 'blue', 'green', 'red'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    } ${getColorClass(color)}`}
                  />
                ))}
              </div>
              
              <label className="flex items-center gap-2 ml-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                  className="w-4 h-4 text-[#2557a7] border-gray-300 rounded focus:ring-[#2557a7]"
                />
                <span className="text-sm text-gray-700">Pin note</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#2557a7] rounded-lg hover:bg-[#0d2d6e]"
              >
                {editingNote ? 'Update' : 'Add'} Note
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notes yet</div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className={`p-4 rounded-lg border-2 ${getColorClass(note.color)} relative`}
            >
              {note.isPinned && (
                <Pin className="absolute top-2 right-2 h-4 w-4 text-gray-600 fill-current" />
              )}
              
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-8">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.note}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <img
                    src={note.createdBy?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(note.createdBy?.name || 'Admin')}`}
                    alt={note.createdBy?.name}
                    className="h-5 w-5 rounded-full"
                  />
                  <span>{note.createdBy?.name || 'Admin'}</span>
                  <span>•</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(note)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingNote(note)
                      setFormData({
                        note: note.note,
                        color: note.color,
                        isPinned: note.isPinned
                      })
                      setShowForm(true)
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(note._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === note._id && (
                <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-900 mb-3">Delete this note?</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminNotes
