import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const MAX_MB = 5;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ReportarPage() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const isPerdida = tipo === 'perdida';
  const color = isPerdida ? '#F44336' : '#FF9800';

  const [form, setForm] = useState({
    nombre: '',
    especie: 'Perro',
    raza: '',
    color: '',
    sexo: 'Macho',
    zona: '',
    descripcion: '',
    contacto: '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError('Formato no permitido. Usa JPG, PNG, WEBP o GIF.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen supera ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let foto_url = null;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/uploads/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        foto_url = data.url;
      }

      await api.post('/mascotas/', { ...form, tipo, foto_url });
      navigate('/mascotas');
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-6 space-y-4"
    >
      <div
        className="px-4 py-3 rounded-lg -mx-6 -mt-6 mb-2 text-white font-bold"
        style={{ background: color }}
      >
        {isPerdida ? '🔍 Reportar mascota perdida' : '🐾 Reportar mascota encontrada'}
      </div>

      {isPerdida && (
        <Field label="Nombre de la mascota">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Ej: Luna"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Especie">
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.especie}
            onChange={(e) => set('especie', e.target.value)}
          >
            <option>Perro</option>
            <option>Gato</option>
            <option>Otro</option>
          </select>
        </Field>
        <Field label="Sexo">
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.sexo}
            onChange={(e) => set('sexo', e.target.value)}
          >
            <option>Macho</option>
            <option>Hembra</option>
            <option>Desconocido</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Raza">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Ej: Labrador"
            value={form.raza}
            onChange={(e) => set('raza', e.target.value)}
          />
        </Field>
        <Field label="Color">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Ej: Amarillo"
            value={form.color}
            onChange={(e) => set('color', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Zona / Comuna">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Ej: Providencia"
          value={form.zona}
          onChange={(e) => set('zona', e.target.value)}
        />
      </Field>

      <Field label="Descripción">
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm"
          rows={3}
          placeholder="Señas particulares, collar, chip..."
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
        />
      </Field>

      <Field label="Contacto (WhatsApp)">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="+56 9 XXXX XXXX"
          value={form.contacto}
          onChange={(e) => set('contacto', e.target.value)}
        />
      </Field>

      <Field label="Foto">
        {preview ? (
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <img src={preview} alt="preview" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center shadow"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm cursor-pointer hover:bg-gray-50 block">
            📷 Haz clic para subir una foto
            <span className="block text-xs mt-1">JPG, PNG, WEBP o GIF · máximo {MAX_MB} MB</span>
            <input
              type="file"
              accept={ACCEPTED.join(',')}
              onChange={onFileChange}
              className="hidden"
            />
          </label>
        )}
      </Field>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg py-2 text-sm text-white font-bold disabled:opacity-60 transition"
          style={{ background: color }}
        >
          {loading ? 'Enviando...' : 'Publicar reporte'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
