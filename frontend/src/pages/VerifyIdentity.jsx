import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { getIdentityStatus, verifyIdentity } from '../api/auth';
import {
  UploadCloud,
  FileText,
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';

const VerifyIdentity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState(user?.identityStatus || 'pending');
  const [rejectionReason, setRejectionReason] = useState(null);
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getIdentityStatus();
      setStatus(res.data.status);
      setVerifiedAt(res.data.verified_at);
      setRejectionReason(res.data.rejection_reason);
    } catch (err) {
      console.error('Error fetching identity status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'host') {
      fetchStatus();
    }
  }, [user, fetchStatus]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    setSuccess(null);

    if (rejectedFiles.length > 0) {
      const errorDetail = rejectedFiles[0].errors[0];
      if (errorDetail.code === 'file-too-large') {
        setError('El archivo supera el límite de 5 MB.');
      } else {
        setError('Formato de archivo no válido. Solo se permiten archivos JPG, PNG y PDF.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null); // PDF
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await verifyIdentity(formData);
      setSuccess('Tu documento de identidad ha sido enviado correctamente.');
      setStatus(res.data.status || 'verified');
      removeFile();
      // If Stripe returns checkout url
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Error al subir el documento. Por favor, intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'host') {
    return <Navigate to="/dashboard" replace />;
  }

  const renderStatusBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>Identidad Verificada</span>
          </div>
        );
      case 'processing':
      case 'pending':
        return (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-semibold shadow-sm animate-fade-in">
            <Clock className="w-5 h-5" />
            <span>En Revisión</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-semibold shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            <span>Verificación Rechazada</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-dark-50 border border-dark-200 text-dark-600 font-semibold shadow-sm animate-fade-in">
            <ShieldCheck className="w-5 h-5" />
            <span>Sin Iniciar</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-mesh py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-500 font-semibold transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Panel</span>
        </Link>

        <div className="glass-card overflow-hidden shadow-2xl animate-fade-in-up">
          <div className="p-8 border-b border-dark-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-dark-900">
                Verificación de Identidad 🛡️
              </h1>
              <p className="text-dark-500 mt-1">
                Completa tu perfil de anfitrión subiendo tu identificación oficial
              </p>
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            ) : (
              renderStatusBadge()
            )}
          </div>

          <div className="p-8">
            {status === 'verified' && (
              <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 text-center animate-fade-in">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-800 mb-2">
                  ¡Todo Listo!
                </h3>
                <p className="text-emerald-700 max-w-md mx-auto">
                  Tu identidad ha sido verificada con éxito. Ya puedes publicar y recibir reservas sin limitaciones.
                </p>
                {verifiedAt && (
                  <p className="text-emerald-600/70 text-sm mt-4">
                    Verificado el: {new Date(verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {(status === 'processing' || status === 'pending') && (
              <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100 text-center animate-fade-in">
                <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-amber-800 mb-2">
                  Documento en Revisión
                </h3>
                <p className="text-amber-700 max-w-md mx-auto">
                  Estamos revisando tu documento. Este proceso suele tomar unos minutos. Te notificaremos cuando tu estado cambie.
                </p>
              </div>
            )}

            {status === 'rejected' && (
              <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 text-center mb-8 animate-fade-in">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">
                  Tu verificación ha sido rechazada
                </h3>
                <p className="text-red-700 max-w-md mx-auto font-medium">
                  Motivo: {rejectionReason || 'No fue posible leer los datos del documento o es inválido.'}
                </p>
                <p className="text-red-600 text-sm mt-3">
                  Por favor, sube un nuevo documento que sea nítido, a color y vigente.
                </p>
              </div>
            )}

            {(status === 'none' || status === 'rejected' || !status) && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-dark-50 rounded-2xl p-6 border border-dark-200">
                  <h3 className="font-bold text-dark-800 mb-2 flex items-center gap-2">
                    💡 Instrucciones
                  </h3>
                  <ul className="list-disc pl-5 text-dark-600 space-y-1.5 text-sm">
                    <li>Sube tu credencial oficial (INE, Pasaporte, Licencia de Conducir).</li>
                    <li>Asegúrate de que la foto y el texto sean legibles.</li>
                    <li>Formatos válidos: **JPG, PNG, PDF** (máximo **5 MB**).</li>
                  </ul>
                </div>

                {error && <div className="alert-error">{error}</div>}
                {success && <div className="alert-success">{success}</div>}

                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`border-3 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? 'border-primary-400 bg-primary-50/50'
                        : 'border-dark-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-dark-800 mb-1">
                      {isDragActive
                        ? '¡Suelta el archivo aquí!'
                        : 'Arrastra tu documento aquí'}
                    </h4>
                    <p className="text-dark-400 text-sm mb-4">
                      O si lo prefieres, haz clic para explorar tus archivos
                    </p>
                    <span className="text-xs px-3.5 py-1.5 rounded-full bg-dark-100 text-dark-600 font-semibold">
                      Hasta 5 MB (JPG, PNG, PDF)
                    </span>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dark-100 rounded-3xl p-6 shadow-sm flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-4">
                      {previewUrl ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-50 border border-dark-200 shadow-inner">
                          <img
                            src={previewUrl}
                            alt="Vista previa de ID"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 shadow-inner border border-primary-100">
                          <FileText className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-dark-800 truncate max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-dark-400 text-sm">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Eliminar archivo"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file || submitting}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Subiendo y Verificando...</span>
                    </>
                  ) : (
                    <span>Enviar para Verificación</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyIdentity;
